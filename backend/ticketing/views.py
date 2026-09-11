import logging
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SeatHold, SeatSale, Show
from .order_sync import sync_order
from .serializers import SeatHoldSerializer, SeatStatusSerializer
from .webhook_auth import verify_squarespace_signature

logger = logging.getLogger("ticketing")

HOLD_TTL = timedelta(minutes=10)


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
        held_seats = list(
            SeatHold.objects.filter(show=show, expires_at__gt=timezone.now()).values_list(
                "seat_code", flat=True
            )
        )
        data = SeatStatusSerializer({"soldSeats": sold_seats, "heldSeats": held_seats}).data
        return Response(data)


class SeatHoldView(APIView):
    """Creates a short-lived soft hold on a seat when a buyer clicks
    Reserve, so other browsers see it as unavailable while this buyer is
    off completing checkout on Squarespace. This is a UX nicety, not an
    inventory lock — Squarespace's own per-seat Stock: 1 is what actually
    prevents overselling if a hold expires mid-checkout."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, sku, code):
        show = get_object_or_404(Show, sku=sku)
        now = timezone.now()

        with transaction.atomic():
            SeatHold.objects.filter(show=show, seat_code=code, expires_at__lte=now).delete()

            if SeatSale.objects.filter(show=show, seat_code=code, voided_at__isnull=True).exists():
                return Response({"detail": "Seat already sold."}, status=status.HTTP_409_CONFLICT)

            if SeatHold.objects.select_for_update().filter(show=show, seat_code=code).exists():
                return Response({"detail": "Seat already held."}, status=status.HTTP_409_CONFLICT)

            hold = SeatHold.objects.create(show=show, seat_code=code, expires_at=now + HOLD_TTL)

        data = SeatHoldSerializer({"seatCode": hold.seat_code, "expiresAt": hold.expires_at}).data
        return Response(data, status=status.HTTP_201_CREATED)


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
