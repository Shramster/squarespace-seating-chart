import logging

from django.utils import timezone

from .models import SeatSale, SeatSkuMap

logger = logging.getLogger("ticketing")


def sync_inventory(inventory_items):
    """Releases seats whose Squarespace stock has come back in, per one page
    of `GET /1.0/commerce/inventory` results: `[{sku, quantity,
    isUnlimited}, ...]`.

    This is the actual mechanism for detecting a refund, deliberately not
    order-field-based: Squarespace's order payload has no per-line-item
    refund breakdown, so a partial refund of one seat in a multi-seat order
    can't be localized from order data. Per-seat stock has no such
    ambiguity — every seat is its own SKU with `Stock: 1`, so its quantity
    going back to 1 (whether from a full refund with "Restock Inventory"
    checked, or a partial refund staff then restocks by hand) means exactly
    that seat, and only that seat, is sellable again. It also can't drift
    from what's actually purchasable the way an order-status guess could,
    since it's the same stock count Squarespace itself checks at checkout.

    Doesn't handle marking a seat *sold* — that stays `sync_order()`'s job,
    since only the order stream carries the order/line-item id this app
    keeps for its sales ledger.
    """
    for item in inventory_items:
        sku = item.get("sku")
        quantity = item.get("quantity")
        if not sku or item.get("isUnlimited") or not quantity:
            continue

        seat_map = SeatSkuMap.objects.filter(squarespace_sku=sku).select_related("show").first()
        if not seat_map:
            continue

        SeatSale.objects.filter(
            show=seat_map.show,
            seat_code=seat_map.seat_code,
            voided_at__isnull=True,
        ).update(voided_at=timezone.now())
