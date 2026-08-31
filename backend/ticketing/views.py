import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SeatSale, Show
from .order_sync import sync_order
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
        order = payload.get("data", {})

        if not (order.get("id") or order.get("orderId")):
            logger.warning("Webhook payload missing order id: %s", payload)
            return Response(status=status.HTTP_400_BAD_REQUEST)

        sync_order(order)

        return Response(status=status.HTTP_200_OK)
