import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
from src.utils.db_handler import db_handler

# 🔥 limit parallel requests (avoid block)
SEM = asyncio.Semaphore(5)


# =========================
# 🔥 Extract details from job page
# =========================
async def extract_unstop_details(context, job):
    async with SEM:
        page = await context.new_page()

        try:
            await page.goto(job["link"], timeout=45000)
            await page.wait_for_load_state("domcontentloaded")

            details = await page.evaluate("""
            () => {

                const clean = (t) =>
                    (t || "")
                    .replace(/Apply|Login|Register|Sign in|Home|Unstop/gi, "")
                    .replace(/\\n+/g, " ")
                    .trim();

                const getField = (label) => {
                    const elements = Array.from(document.querySelectorAll("div, span"));
                    for (let el of elements) {
                        if (el.innerText && el.innerText.toLowerCase().includes(label)) {
                            let parent = el.parentElement;
                            if (parent) {
                                let text = parent.innerText.replace(el.innerText, "").trim();
                                if (text.length > 0 && text.length < 200) {
                                    return clean(text);
                                }
                            }
                        }
                    }
                    return "";
                };

                // 🔥 Clean Skills
                const skills = Array.from(document.querySelectorAll("span, li"))
                    .map(el => el.innerText.trim())
                    .filter(t =>
                        t.length > 2 &&
                        t.length < 40 &&
                        !/apply|login|home|register/i.test(t)
                    )
                    .slice(0, 8);

                // 🔥 CLEAN DESCRIPTION (FIXED)
                const getDescription = () => {
                    const selectors = [
                        ".description",
                        ".job-description",
                        ".internship_description",
                        "[class*='description']",
                        "[class*='details']"
                    ];

                    let text = "";

                    for (let sel of selectors) {
                        const el = document.querySelector(sel);
                        if (el && el.innerText.length > 100) {
                            text = el.innerText;
                            break;
                        }
                    }

                    if (!text) {
                        text = document.body.innerText;
                    }

                    return clean(text).slice(0, 800);
                };

                return {
                    stipend: getField("stipend"),
                    experience: getField("experience"),
                    location: getField("location"),
                    apply_by: getField("apply"),
                    skills: skills.join(", "),
                    description: getDescription()
                };
            }
            """)

            return {**job, **details}

        except Exception as e:
            print(f"❌ Detail Error: {e}")
            return job

        finally:
            await page.close()


# =========================
# 🔥 Main scraper
# =========================
async def run_unstop_scraper():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)  # 🔥 FAST MODE
        context = await browser.new_context()
        page = await context.new_page()

        try:
            print("🌐 Opening Unstop...")
            await page.goto("https://unstop.com/internships", timeout=60000)
            await page.wait_for_load_state("domcontentloaded")

            seen_links = set()

            # 🔥 Scroll and collect links
            for _ in range(20):
                await page.mouse.wheel(0, 5000)
                await page.keyboard.press("End")
                await asyncio.sleep(1.5)

                links = await page.evaluate("""
                () => Array.from(
                    document.querySelectorAll("a[href*='/internships/']")
                ).map(a => a.href)
                """)

                new_links = [l for l in links if l not in seen_links]

                if not new_links:
                    break

                seen_links.update(new_links)

            # 🔥 Convert to job objects
            base_jobs = []
            for link in seen_links:
                base_jobs.append({
                    "title": link.split("/")[-1].replace("-", " ").title(),
                    "company": "Unstop",
                    "link": link,
                    "scraped_at": datetime.utcnow().isoformat(),
                    "source": "Unstop"
                })

            # 🔥 Parallel detail scraping (controlled)
            detailed_jobs = await asyncio.gather(
                *[extract_unstop_details(context, job) for job in base_jobs]
            )

            detailed_jobs = [j for j in detailed_jobs if j]

            if detailed_jobs:
                inserted = await db_handler.save_jobs(detailed_jobs)
                print(f"🎯 DB Sync Done | New Jobs: {inserted}")
            else:
                print("❌ No jobs found")

        except Exception as e:
            print(f"❌ Scraper Error: {e}")

        finally:
            await browser.close()
            print("🔒 Browser Closed")
            print("============================================\n")