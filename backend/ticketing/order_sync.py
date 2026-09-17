import logging

from django.utils import timezone

from .models import SeatHold, SeatSale, SeatSkuMap

logger = logging.getLogger("ticketing")


def sync_order(order):
    """Upserts/voids SeatSale rows for one Squarespace order. Shared by the
    order webhook view and the Orders-API poller — same order shape either
    way: `{id, fulfillmentStatus, grandTotal, refundedTotal, lineItems:
    [{id, sku}]}`.
    """
    order_id = order.get("id") or order.get("orderId")
    if not order_id:
        logger.warning("Order payload missing id: %s", order)
        return

    # Cancellation and refund are independent on a Squarespace order: a
    # refund does not necessarily flip fulfillmentStatus to CANCELED, so
    # both signals must be checked to release a seat. Only a FULL refund
    # counts — Squarespace flips paymentState to REFUNDED on any partial
    # refund too (e.g. a post-purchase goodwill discount), which must not
    # release a seat that's still legitimately sold.
    grand_total = (order.get("grandTotal") or {}).get("value") or 0
    refunded_total = (order.get("refundedTotal") or {}).get("value") or 0
    is_fully_refunded = float(grand_total) > 0 and float(refunded_total) >= float(grand_total)
    is_voided = order.get("fulfillmentStatus") == "CANCELED" or is_fully_refunded

    for line_item in order.get("lineItems", []):
        line_item_id = line_item.get("id") or line_item.get("lineItemId")
        sku = line_item.get("sku") or line_item.get("variantId")
        if not line_item_id or not sku:
            continue

        seat_map = SeatSkuMap.objects.filter(squarespace_sku=sku).select_related("show").first()
        if not seat_map:
            logger.warning("No SeatSkuMap entry for SKU %s (order %s)", sku, order_id)
            continue

        if is_voided:
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
