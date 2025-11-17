#!/usr/bin/env python3
import asyncio
import argparse

from db.repos import load_enabled_repositories
from db.ai_reviews import upsert_reviews_async
from logger import logger
from scraper.fetch_reactions import fetch_from_github, print_table

async def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch AI review reactions and upsert into CockroachDB")
    parser.add_argument("--days", type=int, default=7, help="Number of days to look back")
    parser.add_argument("--dry-run", action="store_true", help="Print only; no DB writes")
    args = parser.parse_args()

    enabled = await load_enabled_repositories()
    if not enabled:
        logger.info("⚠️ No enabled repositories found; nothing to do.")
        return

    rows, processed, errors = fetch_from_github(enabled_repos=enabled, days=args.days)
    logger.info(f"\n✅ Processed {processed} reviews ({errors} errors)")
    print_table(rows)

    if args.dry_run:
        return

    inserted = await upsert_reviews_async(rows)
    logger.info(f"✅ Upserted {inserted} records into CockroachDB")

if __name__ == "__main__":
    asyncio.run(main())
