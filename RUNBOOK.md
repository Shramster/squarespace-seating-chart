# Runbook

Operational steps for getting shows/seats into Squarespace, testing the
catalog import, and verifying the hold → purchase → webhook flow end to
end. See `CLAUDE.md` for architecture; this file is process, not design.

## 1. Embed placement

The React bundle goes on a **standalone "Buy Tickets" page** — a
Squarespace Code Block on its own page, not on any individual product
page. `DayTabs` lets the buyer switch between performance days inside that
one embed; only the outbound "Reserve this seat" link is per-show/per-seat
(see below). Don't duplicate the embed onto every show's product page —
there's only one embed, one page.

## 2. Seat → purchase workflow

Every sellable seat (`ga`/`delegate`) is its **own Squarespace product**,
not a variant of a per-show product. Squarespace has no native way to
deep-link into a preselected variant (confirmed against Squarespace's own
forums/dev docs — unlike Shopify's `?variant=` parameter), so the only way
to get a real one-click seat permalink is to give each seat its own product
page.

- `src/config.js` exports `seatProductSlug(showSku, seatCode)` and
  `seatBuyLink(showSku, seatCode)` — the single source of truth for the
  URL slug, imported by both the CSV generator (sets each product's
  `Product URL`) and the frontend (builds the link `handleReserve` opens).
  They can't drift apart because both sides call the same function.
- Each show's seats are grouped under a Squarespace `Categories` value
  equal to that show's `label`, so Squarespace auto-builds a per-day
  category page as a side effect — useful for browsing, not required for
  the embed to work.
- Clicking "Reserve this seat" still creates a short-lived `SeatHold`
  (10 min TTL) first, same as before — the permalink change doesn't affect
  that. The hold is a UX nicety only. The actual overselling backstop is
  Squarespace's own `Stock: 1` set per seat-product by the CSV generator,
  which blocks a second purchase at checkout regardless of hold state or
  expiry.

## 3. Generating & testing the catalog CSV locally

```
node backend/test_data/generate_show_test_data.mjs
```

Writes `backend/test_data/product_import-shows.csv` — one full product row
per sellable seat per show (currently 9 shows × 94 seats = 846 rows),
each with a unique `Product URL`/`Title`/`SKU` and a `Categories` value
grouping it under its show day.

Import into the local Django backend:

```
docker compose exec web python manage.py import_squarespace_csv test_data/product_import-shows.csv
```

Verify it landed:

```
docker compose exec web python manage.py test ticketing   # ImportSquarespaceCsvTests covers create + idempotent re-import
```

or hit `GET http://127.0.0.1:8100/api/shows/<sku>/seats/` directly, or check
the Django admin for `SeatSkuMap` rows.

## 4. Importing into a Squarespace test site

The same CSV Django reads is also a valid Squarespace bulk product-import
CSV — no separate format. In the test site's admin, use the store's bulk
import feature and point it at `product_import-shows.csv`. Each row becomes
its own product (not a variant), landing in the category named after its
show day.

Sanity-check after import:
- Spot-check that a seat's product page URL matches `seatBuyLink()`'s
  output for that show/seat (e.g. `.../swing-night-oct03-l1-1`).
- Confirm `Stock` shows as `1` on a couple of products.

## 5. Registering & testing the order webhook

**Registration** (admin → Settings → Advanced → Webhooks in the test
site): needs a **public HTTPS URL** — the local dev backend
(`http://127.0.0.1:8100`) isn't reachable from Squarespace's servers, so
tunnel it first (e.g. `ngrok http 8100`) and register the tunnel's
`https://.../api/webhooks/squarespace/orders/` URL, subscribed to
`order.create` and `order.update`. Squarespace shows a signing secret at
registration time — set it as `SQUARESPACE_WEBHOOK_SECRET` in
`backend/.env` (must match exactly; it's required with no default and the
app fails loudly if unset).

**Faking a webhook call locally**, without a tunnel or a real order —
useful for iterating on webhook logic in isolation. Uses the same
HMAC-SHA256 scheme as `backend/ticketing/webhook_auth.py` and
`tests.py`'s `sign()` helper:

```
python3 - <<'PY'
import hmac, hashlib, json

secret_hex = "<SQUARESPACE_WEBHOOK_SECRET from backend/.env>"
body = json.dumps({
    "topic": "order.create",
    "data": {
        "id": "order-test-1",
        "fulfillmentStatus": "PENDING",
        "lineItems": [
            {"id": "li-1", "sku": "OCT03-L1-1"}
        ]
    }
}).encode()

sig = hmac.new(bytes.fromhex(secret_hex), body, hashlib.sha256).hexdigest()
print(sig)
with open("/tmp/webhook_payload.json", "wb") as f:
    f.write(body)
PY

curl -X POST http://127.0.0.1:8100/api/webhooks/squarespace/orders/ \
  -H "Squarespace-Signature: <hash printed above>" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/webhook_payload.json
```

Then confirm `OCT03-L1-1` shows as sold via
`GET /api/shows/OCT03/seats/`, and check for a `SeatSale` row in the admin.
For a cancellation, resend with `"topic": "order.update"` and
`"fulfillmentStatus": "CANCELED"` — confirm the matching `SeatSale` gets
`voided_at` set and the seat frees back up.

This is good enough for iterating on webhook logic, but doesn't replace at
least one real click-through purchase (next section) before going live —
it doesn't catch payload-shape mismatches against what Squarespace
actually sends.

## 6. Full live end-to-end test

1. Open the embed, pick a show/day and a seat, click "Reserve this seat".
2. Confirm the seat now shows as held via `GET /api/shows/<sku>/seats/`
   (or by loading the embed in a second browser — the seat should be
   disabled there too).
3. In the tab that opened, complete a real test purchase on the test
   Squarespace site for that exact seat product.
4. Confirm the registered webhook fires (check ngrok's request log, or
   Django logs) and the seat flips from held to sold — `SeatSale` row
   created, matching `SeatHold` cleared.
5. Cancel/refund that test order in the Squarespace admin, confirm the
   webhook voids the `SeatSale` (`voided_at` set) and the seat becomes
   available again via the seats endpoint.

There's currently no reconciliation path if a webhook delivery is missed
(e.g. tunnel down, Squarespace retry exhausted) — a seat could show sold in
Squarespace but not in Django, or vice versa. Worth a periodic manual
diff against the Squarespace orders export until that gap is closed.
