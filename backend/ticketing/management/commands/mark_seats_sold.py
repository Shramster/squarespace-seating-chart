from django.core.management.base import BaseCommand, CommandError

from ticketing.models import SeatSale, Show


class Command(BaseCommand):
    """Marks seats sold directly in Django, bypassing Squarespace entirely
    — for demoing the embed's sold/available rendering to stakeholders
    without needing a real (or even a $0 test) product for every seat.
    Fabricates a unique squarespace_order_id/line_item_id per seat so it
    satisfies SeatSale's uniqueness constraints without colliding with a
    real order.
    """

    help = "Mark one or more seats as sold for a show, without a real Squarespace order."

    def add_arguments(self, parser):
        parser.add_argument("show_sku")
        parser.add_argument("seat_codes", nargs="+")

    def handle(self, *args, **options):
        try:
            show = Show.objects.get(sku=options["show_sku"])
        except Show.DoesNotExist:
            raise CommandError(f"No Show with sku {options['show_sku']!r}")

        for seat_code in options["seat_codes"]:
            _, created = SeatSale.objects.get_or_create(
                show=show,
                seat_code=seat_code,
                voided_at=None,
                defaults={
                    "squarespace_order_id": f"manual-{show.sku}-{seat_code}",
                    "squarespace_line_item_id": f"manual-{show.sku}-{seat_code}",
                },
            )
            if created:
                self.stdout.write(f"Marked {seat_code} sold")
            else:
                self.stdout.write(f"{seat_code} was already sold — left as is")
