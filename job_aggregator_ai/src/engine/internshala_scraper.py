import asyncio
from playwright.async_api import async_playwright
from src.utils.db_handler import db_handler

BASE_URL = "https://internshala.com/jobs/page-{page}"

# 🔥 limit parallel requests (important)
SEM = asyncio.Semaphore(5)


# =========================
# 🔥 DETAIL SCRAPER
# =========================
async def extract_job_internshala(context, job):
    async with SEM:
        page = await context.new_page()

        try:
            if not job.get("link"):
                return None

            await page.goto(job["link"], timeout=45000)
            await page.wait_for_load_state("domcontentloaded")

            content = await page.content()

            # 🔥 BLOCK DETECTION
            if any(x in content for x in [
                "503", "Access Denied", "Cloudflare", "Just a moment"
            ]):
                return None

            data = await page.evaluate("""() => {

                const clean = (t) =>
                    (t || "").replace(/\\n+/g, " ").trim();

                const get = (sel) => {
                    const el = document.querySelector(sel);
                    return el ? clean(el.innerText) : "";
                };

                const skills = Array.from(
                    document.querySelectorAll(".round_tabs_container span")
                )
                .map(e => e.innerText.trim())
                .filter(t => t.length > 2 && t.length < 30);

                return {
                    title: document.querySelector("h1")?.innerText?.trim() || "",
                    company: get(".company_name"),
                    location: get(".location_link, .locations"),
                    salary: get(".salary, .stipend"),
                    experience: get(".experience, .duration"),
                    apply_by: get(".apply_by"),
                    description: (
                        document.querySelector(".internship_details")?.innerText || ""
                    )
                    .replace(/\\n+/g, " ")
                    .trim()
                    .slice(0, 1200),
                    skills
                };
            }""")

            return {
                **job,
                **data,
                "source": "Internshala"
            }

        except Exception:
            return None

        finally:
            await page.close()


# =========================
# 🔥 LIST SCRAPER
# =========================
async def scrape_list_page(page_no, context):
    page = await context.new_page()

    try:
        url = BASE_URL.format(page=page_no)

        await page.goto(url, timeout=45000)
        await page.wait_for_load_state("domcontentloaded")

        jobs = await page.evaluate("""() => {

            const cards = Array.from(
                document.querySelectorAll("a[href*='/job/detail/']")
            );

            const seen = new Set();

            return cards.map(a => {
                const link = a.href;

                if (!link || seen.has(link)) return null;
                seen.add(link);

                const parent = a.closest("div");

                const title =
                    parent?.querySelector("h3, h4")?.innerText?.trim()
                    || a.innerText?.trim()
                    || "";

                const company =
                    parent?.innerText?.split("\\n")[1]?.trim() || "";

                if (!title || !link.includes("/job/detail/")) return null;

                return {
                    title,
                    company,
                    link,
                    scraped_at: new Date().toISOString(),
                    source: "Internshala"
                };

            }).filter(Boolean);
        }""")

        return jobs

    except Exception:
        return []

    finally:
        await page.close()


# =========================
# 🔥 MAIN RUNNER
# =========================
async def run_internshala_jobs():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)  # 🔥 FAST MODE
        context = await browser.new_context()

        seen = set()
        final_jobs = []

        MAX_PAGES = 5

        for page_no in range(1, MAX_PAGES + 1):

            base_jobs = await scrape_list_page(page_no, context)

            new_jobs = [
                j for j in base_jobs
                if j.get("link") and j["link"] not in seen
            ]

            if not new_jobs:
                break

            seen.update(j["link"] for j in new_jobs)

            detailed_jobs = await asyncio.gather(
                *[extract_job_internshala(context, j) for j in new_jobs]
            )

            detailed_jobs = [j for j in detailed_jobs if j]

            final_jobs.extend(detailed_jobs)

        # =========================
        # 🔥 SAVE TO DB
        # =========================
        if final_jobs:
            inserted = await db_handler.save_jobs(final_jobs)
            print(f"🎯 Internshala Inserted: {inserted}")
        else:
            print("❌ No valid jobs found")

        await browser.close()