import logging
import time
from datetime import timedelta

import requests
from decouple import config
from django.core.management.base import BaseCommand
from django.utils import timezone

from ticketing.order_sync import sync_order

logger = logging.getLogger("ticketing")

ORDERS_URL = "https://api.squarespace.com/1.0/commerce/orders"


class Command(BaseCommand):
    """Polls Squarespace's Orders API and syncs results into SeatSale rows.

    Stands in for push webhooks, which need an OAuth app (Squarespace's
    Webhook Subscriptions API is OAuth-only — a plain site API key, like
    SQUARESPACE_API_KEY here, can't create a subscription). Re-scans a
    rolling lookback window every poll rather than tracking a cursor
    between runs, since sync_order() is idempotent (SeatSale is unique on
    order/line-item id) — simpler than persisting poll state, and safe
    across restarts.
    """

    help = "Poll the Squarespace Orders API and sync SeatSale rows."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Run a single pass and exit.")
        parser.add_argument("--interval", type=int, default=60, help="Seconds between polls.")
        parser.add_argument(
            "--lookback-hours", type=int, default=24, help="How far back to re-scan each poll."
        )

    def handle(self, *args, **options):
        api_key = config("SQUARESPACE_API_KEY")
        session = requests.Session()
        session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "seatchart-ticketing-order-poller",
            }
        )

        while True:
            try:
                self.poll_once(session, options["lookback_hours"])
            except requests.exceptions.RequestException as exc:
                logger.error("Squarespace Orders API request failed: %s", exc)
            if options["once"]:
                return
            time.sleep(options["interval"])

    def poll_once(self, session, lookback_hours):
        now = timezone.now()
        fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
        params = {
            "modifiedAfter": (now - timedelta(hours=lookback_hours)).strftime(fmt),
            "modifiedBefore": now.strftime(fmt),
        }
        synced = 0

        while True:
            response = session.get(ORDERS_URL, params=params, timeout=30)
            if not response.ok:
                logger.error(
                    "Squarespace Orders API request failed: %s %s",
                    response.status_code,
                    response.text[:500],
                )
                return

            body = response.json()
            for order in body.get("result", []):
                sync_order(order)
                synced += 1

            pagination = body.get("pagination", {})
            if not pagination.get("hasNextPage"):
                break
            params = {"cursor": pagination["nextPageCursor"]}

        logger.info("Squarespace order poll: synced %d order(s)", synced)
