import csv

from django.core.management.base import BaseCommand

from ticketing.models import SeatSkuMap, Show


class Command(BaseCommand):
    help = (
        "Import seat-to-SKU mappings from a Squarespace product-import CSV "
        "(see backend/test_data/product_import-shows.csv). Each SKU is "
        "expected in the form '<show_sku>-<seat_code>' (e.g. "
        "'OCT03-L1-1'), matching how the seat-chart generator builds "
        "SKUs — rows whose SKU doesn't contain a '-' are skipped. Upserts "
        "one Show per distinct show_sku found (label defaults to the sku "
        "the first time it's created — rename it in the admin if you "
        "want something friendlier) and a SeatSkuMap row per seat, keyed "
        "on (show, seat_code) so re-importing an updated export just "
        "updates the mapping instead of duplicating it."
    )

    def add_arguments(self, parser):
        parser.add_argument("csv_path", help="Path to the Squarespace product-import CSV")

    def handle(self, csv_path, **options):
        shows_created = 0
        rows_imported = 0
        rows_skipped = 0

        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sku = (row.get("SKU") or "").strip()
                if not sku or "-" not in sku:
                    rows_skipped += 1
                    continue

                show_sku, seat_code = sku.split("-", 1)
                show, created = Show.objects.get_or_create(
                    sku=show_sku, defaults={"label": show_sku}
                )
                shows_created += created

                SeatSkuMap.objects.update_or_create(
                    show=show, seat_code=seat_code, defaults={"squarespace_sku": sku}
                )
                rows_imported += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {rows_imported} seat/SKU pairs "
                f"({shows_created} new shows, {rows_skipped} rows skipped)"
            )
        )
