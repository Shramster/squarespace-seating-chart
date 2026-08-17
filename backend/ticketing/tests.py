import hashlib
import hmac
import json
import os
import tempfile

from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import SeatSale, SeatSkuMap, Show

TEST_SECRET_HEX = "deadbeef" * 8  # 32 bytes, hex-encoded


def sign(body_bytes, secret_hex=TEST_SECRET_HEX):
    key = bytes.fromhex(secret_hex)
    return hmac.new(key, body_bytes, hashlib.sha256).hexdigest()


@override_settings(SQUARESPACE_WEBHOOK_SECRET=TEST_SECRET_HEX)
class TicketingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.show = Show.objects.create(sku="SEPT12", label="Sat, Sept 12")
        self.seats_url = f"/api/shows/{self.show.sku}/seats/"
        self.webhook_url = "/api/webhooks/squarespace/orders/"

    def post_webhook(self, payload):
        body = json.dumps(payload).encode()
        signature = sign(body)
        return self.client.post(
            self.webhook_url,
            data=body,
            content_type="application/json",
            HTTP_SQUARESPACE_SIGNATURE=signature,
        )

    def test_seats_endpoint_starts_empty(self):
        res = self.client.get(self.seats_url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"soldSeats": []})

    def test_webhook_marks_seat_sold(self):
        SeatSkuMap.objects.create(show=self.show, seat_code="L-2-3", squarespace_sku="SQ-L-2-3")
        payload = {
            "topic": "order.create",
            "data": {
                "id": "order-1",
                "lineItems": [{"id": "li-1", "sku": "SQ-L-2-3"}],
            },
        }
        res = self.post_webhook(payload)
        self.assertEqual(res.status_code, 200)

        res = self.client.get(self.seats_url)
        self.assertEqual(res.json(), {"soldSeats": ["L-2-3"]})

    def test_webhook_is_idempotent_on_duplicate_line_item(self):
        SeatSkuMap.objects.create(show=self.show, seat_code="L-2-3", squarespace_sku="SQ-L-2-3")
        payload = {
            "topic": "order.create",
            "data": {"id": "order-1", "lineItems": [{"id": "li-1", "sku": "SQ-L-2-3"}]},
        }
        self.post_webhook(payload)
        self.post_webhook(payload)

        self.assertEqual(SeatSale.objects.count(), 1)

    def test_webhook_rejects_bad_signature(self):
        body = json.dumps({"topic": "order.create", "data": {"id": "x", "lineItems": []}}).encode()
        res = self.client.post(
            self.webhook_url,
            data=body,
            content_type="application/json",
            HTTP_SQUARESPACE_SIGNATURE="not-a-real-signature",
        )
        self.assertEqual(res.status_code, 403)

    def test_webhook_skips_unknown_sku_without_error(self):
        payload = {
            "topic": "order.create",
            "data": {"id": "order-2", "lineItems": [{"id": "li-9", "sku": "SQ-UNKNOWN"}]},
        }
        res = self.post_webhook(payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(SeatSale.objects.count(), 0)

    def test_webhook_cancellation_voids_seat_sale(self):
        SeatSkuMap.objects.create(show=self.show, seat_code="L-2-3", squarespace_sku="SQ-L-2-3")
        sale_payload = {
            "topic": "order.create",
            "data": {"id": "order-3", "lineItems": [{"id": "li-3", "sku": "SQ-L-2-3"}]},
        }
        self.post_webhook(sale_payload)

        cancel_payload = {
            "topic": "order.update",
            "data": {
                "id": "order-3",
                "fulfillmentStatus": "CANCELED",
                "lineItems": [{"id": "li-3", "sku": "SQ-L-2-3"}],
            },
        }
        self.post_webhook(cancel_payload)

        res = self.client.get(self.seats_url)
        self.assertEqual(res.json(), {"soldSeats": []})


class ImportSquarespaceCsvTests(TestCase):
    def test_import_creates_shows_and_seat_sku_map(self):
        csv_body = (
            "SKU,Title,Price\n"
            "OCT03-L-0-0,Swing Night,25\n"
            "OCT03-L-0-1,,25\n"
            "OCT09-L-0-0,Swing Night,25\n"
            "SQ3723082,Lemons,10\n"  # non-seat SKU, no dash — should be skipped
        )
        call_command("import_squarespace_csv", self._write_csv(csv_body))

        self.assertEqual(Show.objects.filter(sku="OCT03").count(), 1)
        self.assertEqual(Show.objects.filter(sku="OCT09").count(), 1)
        self.assertEqual(SeatSkuMap.objects.filter(show__sku="OCT03").count(), 2)
        self.assertEqual(SeatSkuMap.objects.filter(show__sku="OCT09").count(), 1)
        self.assertEqual(
            SeatSkuMap.objects.get(show__sku="OCT03", seat_code="L-0-0").squarespace_sku,
            "OCT03-L-0-0",
        )

    def test_reimport_updates_existing_mapping_without_duplicating(self):
        first = self._write_csv("SKU\nOCT03-L-0-0\n")
        call_command("import_squarespace_csv", first)

        second = self._write_csv("SKU\nOCT03-L-0-0\n")  # same show/seat, re-imported
        call_command("import_squarespace_csv", second)

        self.assertEqual(SeatSkuMap.objects.filter(show__sku="OCT03", seat_code="L-0-0").count(), 1)

    def _write_csv(self, body):
        f = tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, newline="")
        f.write(body)
        f.close()
        self.addCleanup(os.unlink, f.name)
        return f.name
