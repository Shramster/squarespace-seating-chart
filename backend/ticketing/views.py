import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SeatSale, SeatSkuMap, Show
from .serializers import SeatStatusSerializer
from .webhook_auth import verify_squarespace_signature

logger = logging.getLogger("ticketing")


class SeatStatusView(APIView):
    """Public read endpoint the seat-chart embed polls. No auth — anyone can
    see which seats are sold, same as the physical box office."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, sku):
        show = get_object_or_404(Show, sku=sku)
        sold_seats = list(
            SeatSale.objects.filter(show=show, voided_at__isnull=True).values_list(
                "seat_code", flat=True
            )
        )
        data = SeatStatusSerializer({"soldSeats": sold_seats}).data
        return Response(data)


class SquarespaceOrderWebhookView(APIView):
    """Receives order.create / order.update notifications from Squarespace.

    Line items are matched to seats via SeatSkuMap (each seat is its own
    Squarespace product variant/SKU). Unknown SKUs are logged and skipped
    rather than failing the whole webhook, since a single bad line item
    shouldn't block the rest of an order from being recorded.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        signature = request.headers.get("Squarespace-Signature")
        if not verify_squarespace_signature(
            settings.SQUARESPACE_WEBHOOK_SECRET, request.body, signature
        ):
            logger.warning("Rejected webhook with invalid Squarespace-Signature")
            return Response(status=status.HTTP_403_FORBIDDEN)

        payload = request.data
        topic = payload.get("topic", "")
        order = payload.get("data", {})
        order_id = order.get("id") or order.get("orderId")

        if not order_id:
            logger.warning("Webhook payload missing order id: %s", payload)
            return Response(status=status.HTTP_400_BAD_REQUEST)

        is_cancellation = topic in ("order.update",) and order.get("fulfillmentStatus") == "CANCELED"

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

        return Response(status=status.HTTP_200_OK)
