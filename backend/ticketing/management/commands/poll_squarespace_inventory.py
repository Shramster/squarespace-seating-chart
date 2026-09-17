import logging
import time

import requests
from decouple import config
from django.core.management.base import BaseCommand

from ticketing.inventory_sync import sync_inventory

logger = logging.getLogger("ticketing")

INVENTORY_URL = "https://api.squarespace.com/1.0/commerce/inventory"


class Command(BaseCommand):
    """Polls Squarespace's Inventory API and releases seats whose stock has
    come back in (see inventory_sync.sync_inventory for why this, not order
    fields, is what detects a refund).
    """

    help = "Poll the Squarespace Inventory API and release restocked seats."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Run a single pass and exit.")
        parser.add_argument("--interval", type=int, default=60, help="Seconds between polls.")

    def handle(self, *args, **options):
        api_key = config("SQUARESPACE_API_KEY")
        session = requests.Session()
        session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "seatchart-ticketing-inventory-poller",
            }
        )

        while True:
            try:
                self.poll_once(session)
            except requests.exceptions.RequestException as exc:
                logger.error("Squarespace Inventory API request failed: %s", exc)
            if options["once"]:
                return
            time.sleep(options["interval"])

    def poll_once(self, session):
        params = {}
        synced = 0

        while True:
            response = session.get(INVENTORY_URL, params=params, timeout=30)
            if not response.ok:
                logger.error(
                    "Squarespace Inventory API request failed: %s %s",
                    response.status_code,
                    response.text[:500],
                )
                return

            body = response.json()
            items = body.get("inventory", [])
            sync_inventory(items)
            synced += len(items)

            pagination = body.get("pagination", {})
            if not pagination.get("hasNextPage"):
                break
            params = {"cursor": pagination["nextPageCursor"]}

        logger.info("Squarespace inventory poll: checked %d SKU(s)", synced)
