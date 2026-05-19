import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.engine.unstop_scraper import run_unstop_scraper
from src.engine.internshala_scraper import run_internshala_jobs


async def safe_run(name, func):
    start = datetime.now()

    try:
        result = await func()  # 🔥 expect scraper to return count
        duration = datetime.now() - start

        print(f"✅ {name} | Time: {duration} | Jobs: {result if result else 0}")

        return result if result else 0

    except Exception as e:
        duration = datetime.now() - start
        print(f"❌ {name} failed | Time: {duration} | Error: {e}")
        return 0


async def automation_cycle():
    start_cycle = datetime.now()

    print(f"\n🚀 CYCLE START: {start_cycle.strftime('%H:%M:%S')}")

    unstop_count = await safe_run("Unstop", run_unstop_scraper)
    internshala_count = await safe_run("Internshala", run_internshala_jobs)

    total = unstop_count + internshala_count
    duration = datetime.now() - start_cycle

    print(f"🎯 TOTAL JOBS: {total} | Cycle Time: {duration}\n")


async def start_scheduler():
    scheduler = AsyncIOScheduler()

    scheduler.add_job(
        automation_cycle,
        "interval",
        hours=1,
        max_instances=1,
        coalesce=True
    )

    scheduler.start()

    print("🔥 Scheduler started (1h interval)")

    # 🔥 run once immediately
    await automation_cycle()

    while True:
        await asyncio.sleep(10)


if __name__ == "__main__":
    try:
        asyncio.run(start_scheduler())
    except KeyboardInterrupt:
        print("\n🛑 Scheduler stopped")