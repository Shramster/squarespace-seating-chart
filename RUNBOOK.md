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

## 7. Stakeholder demo deploy (VPS)

One-time setup to put a deliberately tiny, obviously-fake catalog (10
seats, $0, SKU `TEST01`, "STAKEHOLDER DEMO — DO NOT BUY") on a real
HTTPS URL for a stakeholder walkthrough, without touching the swseng
repo's own production app. The seatchart backend runs as its own
container on the **same VPS** that already serves `api.swseng.io`
(165.232.128.75), reachable at `seatchart-demo.swseng.io`, sharing that
box's nginx container and Let's Encrypt setup but not its Django app,
database, or ports. Frontend static files (`dist/seat-chart.js`/`.css`)
are served by the seatchart Django app itself via whitenoise, through
the same nginx proxy — no separate static host needed.

This section assumes the swseng repo (`new_swseng/backend/`) is already
deployed and running on this VPS via its own `docker compose`, per that
repo's `DEPLOY.md`.

**7a. DNS.** Add an A record: `seatchart-demo.swseng.io` → `165.232.128.75`.
Wait for it to propagate before requesting a cert (7d).

**7b. Get the code onto the VPS.**
```
git clone git@github.com:Shramster/squarespace-seating-chart.git ~/seatchart-demo
cd ~/seatchart-demo
npm install
npm run build          # produces dist/seat-chart.js + .css, mounted into the backend container
```

**7c. Configure `backend/.env`** (not committed — create fresh on the VPS):
```
SECRET_KEY=<generate a fresh one, e.g. `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`>
SQUARESPACE_WEBHOOK_SECRET=<placeholder for now — replaced in 7g>
DJANGO_ALLOWED_HOSTS=seatchart-demo.swseng.io
CORS_ALLOWED_ORIGINS=https://flute-swan-yncx.squarespace.com
DEBUG=False
```
Find the swseng compose stack's network name (needed next):
```
docker network ls | grep swseng    # or whatever the swseng backend/ directory is named on this box
```
Add that value to `backend/.env` as `SWSENG_NETWORK_NAME=<name from above>`.

**7d. Get a cert for the new subdomain**, using the same webroot the
swseng nginx container already serves `.well-known/acme-challenge/`
from (`./certbot/www` in the swseng repo, bind-mounted to
`/var/www/certbot` in its nginx container, backed by the VPS's own
`/etc/letsencrypt`). Run certbot on the **host** (not in a container),
matching however the existing `api.swseng.io`/`api-staging.swseng.io`
certs were obtained — e.g.:
```
sudo certbot certonly --webroot -w /path/to/new_swseng/backend/certbot/www -d seatchart-demo.swseng.io
```
This writes to `/etc/letsencrypt/live/seatchart-demo.swseng.io/`, which
the swseng nginx container already bind-mounts read-only (its compose
production overlay mounts the host's whole `/etc/letsencrypt`), so no
change to that mount is needed.

**7e. Bring up the seatchart backend container** (must happen *before*
7f's nginx reload — the nginx config's demo server block resolves
`seatchart_web` at request time via Docker's embedded DNS, but the
container still needs to exist and be joined to the network first):
```
cd ~/seatchart-demo/backend
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
```
Verify it's up and joined to the right network:
```
docker compose logs web --tail 30
docker network inspect $SWSENG_NETWORK_NAME | grep -A2 seatchart
```

**7f. Reload swseng's nginx** to pick up the new `seatchart-demo.swseng.io`
server blocks (already added to
`new_swseng/backend/nginx/nginx.production.conf` — review that diff,
commit, `git pull` on the VPS, then):
```
cd /path/to/new_swseng/backend
docker compose exec nginx nginx -t     # validate syntax first
docker compose exec nginx nginx -s reload
```
`nginx -t` failing here (e.g. because 7e wasn't done yet) will NOT take
down `api.swseng.io` — reload only applies on success. Confirm
production is still healthy after reloading:
```
curl -sI https://api.swseng.io/api/shows/ | head -1
```

**7g. Import the demo catalog and confirm:**
```
docker compose exec web python manage.py import_squarespace_csv test_data/product_import-shows.csv
curl -s https://seatchart-demo.swseng.io/api/shows/TEST01/seats/
curl -sI https://seatchart-demo.swseng.io/static/seat-chart.js | head -1
```

**7h. Squarespace side** (on `https://flute-swan-yncx.squarespace.com/`):
create the demo page with a Code Block:
```html
<div id="seat-chart-root"></div>
<link rel="stylesheet" href="https://seatchart-demo.swseng.io/static/seat-chart.css">
<script src="https://seatchart-demo.swseng.io/static/seat-chart.js"></script>
```
Bulk-import `backend/test_data/product_import-shows.csv` per §4 above,
then password-protect the page (Squarespace page settings → password).

**7i. Register the webhook and test end-to-end** per §5–§6 above, using
`https://seatchart-demo.swseng.io/api/webhooks/squarespace/orders/` as
the registered URL. Update `SQUARESPACE_WEBHOOK_SECRET` in
`~/seatchart-demo/backend/.env` with the real value Squarespace shows
at registration, then `docker compose restart web`.

**Tearing the demo down later:** `docker compose down` in
`~/seatchart-demo/backend`, remove the two `seatchart-demo.swseng.io`
server blocks (and this note) from `nginx.production.conf`, reload
nginx, remove the DNS record, and let the cert expire unrenewed.
