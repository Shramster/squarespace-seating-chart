import logging

from django.utils import timezone

from .models import SeatHold, SeatSale, SeatSkuMap

logger = logging.getLogger("ticketing")


def sync_order(order):
    """Upserts/voids SeatSale rows for one Squarespace order. Shared by the
    order webhook view and the Orders-API poller — same order shape either
    way: `{id, fulfillmentStatus, lineItems: [{id, sku}]}`.

    Only handles order cancellation, not refunds: a refund doesn't
    necessarily flip fulfillmentStatus, and Squarespace's order payload has
    no per-line-item refund breakdown, so a partial refund of one seat in a
    multi-seat order can't be localized here. `poll_squarespace_inventory`
    (`inventory_sync.py`) is the actual mechanism that releases a seat on
    refund, by watching each seat's own SKU stock directly — the same stock
    count that governs whether Squarespace itself will let it be bought
    again, so it can't drift from what's actually purchasable the way an
    order-field-based guess could.
    """
    order_id = order.get("id") or order.get("orderId")
    if not order_id:
        logger.warning("Order payload missing id: %s", order)
        return

    is_cancellation = order.get("fulfillmentStatus") == "CANCELED"

    for line_item in order.get("lineItems", []):
        line_item_id = line_item.get("id") or line_item.get("lineItemId")
        sku = line_item.get("sku") or line_item.get("variantId")
        if not line_item_id or not sku:
            continue

        seat_map = SeatSkuMap.objects.filter(squarespace_sku=sku).select_related("show").first()
        if not seat_map:
            logger.warning("No SeatSkuMap entry for SKU %s (order %s)", sku, order_id)
            continue

        if is_cancellation:
            SeatSale.objects.filter(
                squarespace_order_id=order_id,
                squarespace_line_item_id=line_item_id,
            ).update(voided_at=timezone.now())
            continue

        SeatSale.objects.get_or_create(
            squarespace_order_id=order_id,
            squarespace_line_item_id=line_item_id,
            defaults={
                "show": seat_map.show,
                "seat_code": seat_map.seat_code,
            },
        )
        SeatHold.objects.filter(show=seat_map.show, seat_code=seat_map.seat_code).delete()
