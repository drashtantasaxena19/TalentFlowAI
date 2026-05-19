import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.engine.unstop_scraper import run_unstop_scraper
from src.engine.internshala_scraper import run_internshala_jobs


def get_total(result):
    if isinstance(result, dict):
        return result.get("inserted", 0) + result.get("updated", 0)
    if isinstance(result, int):
        return result
    return 0


async def safe_run(name, func):
    start = datetime.now()

    try:
        result = await func()
        total = get_total(result)
        duration = datetime.now() - start
        print(f"[{name}] completed | jobs={total} | time={duration}")
        return total

    except Exception as e:
        duration = datetime.now() - start
        print(f"[{name}] failed | time={duration} | error={e}")
        return 0


async def automation_cycle():
    start = datetime.now()
    print(f"\n[SCHEDULER] cycle started | {start.strftime('%Y-%m-%d %H:%M:%S')}")

    unstop_count = await safe_run("Unstop", run_unstop_scraper)
    internshala_count = await safe_run("Internshala", run_internshala_jobs)

    total = unstop_count + internshala_count
    duration = datetime.now() - start

    print(f"[SCHEDULER] cycle completed | total_jobs={total} | time={duration}\n")


async def start_scheduler():
    scheduler = AsyncIOScheduler()

    scheduler.add_job(
        automation_cycle,
        "interval",
        hours=1,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()

    print("[SCHEDULER] started | interval=1 hour")

    await automation_cycle()

    while True:
        await asyncio.sleep(10)


if __name__ == "__main__":
    try:
        asyncio.run(start_scheduler())
    except KeyboardInterrupt:
        print("\n[SCHEDULER] stopped")