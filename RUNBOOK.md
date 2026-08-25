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

Writes two files:
- `backend/test_data/product_import-shows.csv` — the full catalog, one
  product row per sellable seat (gallery/delegate/state chairperson/
  candidate) per configured show, at real tier pricing, each with a
  unique `Product URL`/`Title`/`SKU` and a `Categories` value grouping it
  under its show day.
- `backend/test_data/product_import-test-subset.csv` — a small (~10 seat,
  one per tier) `$0` subset, safe to bulk-import into a live Squarespace
  test site.

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
  output for that show/seat (e.g. `.../convention-oct03-back1-1`).
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

**Target VPS (as actually deployed, 2026-08-25):** the **swseng staging
server**, `deploy@<STAGING_VPS_IP>` — not the production box
(`<PRODUCTION_VPS_IP>`) this section originally described. Claude has direct
SSH access via `~/.ssh/staging_deploy`. Live hostname is
**`seatchart.swseng.io`** (not `seatchart-demo.swseng.io` — that was
the placeholder name from planning; the real DNS record and deploy use
the shorter hostname). The staging box's live nginx config is
`backend/nginx/nginx.conf` (mounted at `/etc/nginx/conf.d/default.conf`
via `docker-compose.staging.yml`) — **not** `nginx.production.conf`,
which earlier planning assumed but which isn't actually live on this
box (it's still there in the repo, presumably for the real production
box at `<PRODUCTION_VPS_IP>`, untouched by this deploy).

One-time setup to put a deliberately tiny, obviously-fake catalog (10
seats, $0, SKU `TEST01`, "STAKEHOLDER DEMO — DO NOT BUY") on a real
HTTPS URL for a stakeholder walkthrough, without touching swseng's own
staging app. The seatchart backend runs as its own container on the
**same VPS** that already serves `api-staging.swseng.io`, reachable at
`seatchart.swseng.io`, sharing that box's nginx container and Let's
Encrypt setup but not its Django app, database, or ports. Frontend
static files (`dist/seat-chart.js`/`.css`) are served by the seatchart
Django app itself via whitenoise, through the same nginx proxy — no
separate static host needed.

This section assumes the swseng repo (`swseng_mono`, checked out at
`<SWSENG_ROOT>` on the VPS, `staging` branch) is already deployed and
running via its own `docker compose`.

**7a. DNS.** A record: `seatchart.swseng.io` → `<STAGING_VPS_IP>`
(already created and propagated as of this deploy).

**7b. Get the code onto the VPS.** The VPS has no `node`/`npm`
installed, so build locally and ship the built `dist/` — don't rely on
building on the box:
```
git clone https://github.com/Shramster/squarespace-seating-chart.git ~/seatchart   # on the VPS
```
Locally: set `CONFIG.apiBase`'s prod fallback in `src/config.js` to
`https://seatchart.swseng.io` (it's baked into the bundle at build
time), then:
```
npm run build           # produces dist/seat-chart.js + .css
scp -r dist deploy@<STAGING_VPS_IP>:~/seatchart/dist
```

**7c. Configure `backend/.env`** (not committed — create fresh on the VPS):
```
SECRET_KEY=<generate a fresh one, e.g. `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`>
SQUARESPACE_WEBHOOK_SECRET=<placeholder for now — replaced in 7i>
DJANGO_ALLOWED_HOSTS=seatchart.swseng.io
CORS_ALLOWED_ORIGINS=https://flute-swan-yncx.squarespace.com
DEBUG=False
SWSENG_NETWORK_NAME=backend_default
```
`backend_default` is the network `docker-compose.yml` in `<SWSENG_ROOT>/backend`
creates (compose project name `backend`); confirm with `docker network ls`
on the VPS if the swseng compose setup ever changes.

**7d. Certbot needs nginx already routing the new hostname's HTTP-01
challenge before it can issue a cert — but the HTTPS server block for
`seatchart.swseng.io` in `nginx.conf` references a cert that doesn't
exist yet, and since it's one shared config file, a block referencing a
missing cert would fail `nginx -t` for the *entire* file (not just that
block). To break this chicken-and-egg problem, add that HTTPS block
**commented out**; only the plain-HTTP block (redirect + ACME challenge
location, no cert reference) is active to start. Edit
`<SWSENG_ROOT>/backend/nginx/nginx.conf` directly on the VPS (or edit
locally in a `swseng_mono` checkout and `git pull` on the VPS — either
way, the working file on the VPS is what matters), then:
```
cd <SWSENG_ROOT>/backend
docker compose -f docker-compose.yml -f docker-compose.staging.yml exec nginx nginx -t
docker compose -f docker-compose.yml -f docker-compose.staging.yml exec nginx nginx -s reload
```
`nginx -t` failing here will NOT take down `api-staging.swseng.io` —
reload only applies on success. Confirm staging is still healthy after
reloading:
```
curl -sI https://api-staging.swseng.io/ | head -1
```
**Gotcha:** if you edit `nginx.conf` with a tool that does an atomic
replace (`sed -i`, most editors' "safe save") rather than an in-place
write, it changes the file's inode — and Docker's single-file bind
mount is bound to the *inode*, not the path, so the container keeps
serving the old (pre-edit) content indefinitely even though `nginx -t`
and `-s reload` both report success against what looks like the new
file. Symptom: `docker compose exec nginx nginx -T` (dumps the config
the *container* actually sees) disagrees with `cat`-ing the file
directly on the host. Fix: `docker compose -f docker-compose.yml -f
docker-compose.staging.yml up -d --force-recreate nginx` to force a
fresh bind mount, then re-verify with `nginx -T`. Appending with `>>`
or Python's `open(path, "w")` (which truncates in place) don't trigger
this; `sed -i` does.

**7e. Get the cert**, now that nginx is serving the ACME challenge path
for the new hostname, using the same webroot the swseng nginx container
already serves `.well-known/acme-challenge/` from (`./certbot/www` in
`<SWSENG_ROOT>/backend`, bind-mounted to `/var/www/certbot` in its nginx
container, backed by the VPS's own `/etc/letsencrypt`). Run certbot on
the **host** (not in a container). The `deploy` user has no
passwordless sudo, so this step needs a human at the keyboard — Claude
cannot run it:
```
sudo certbot certonly --webroot -w <SWSENG_ROOT>/backend/certbot/www -d seatchart.swseng.io
```
This writes to `/etc/letsencrypt/live/seatchart.swseng.io/`, which the
swseng nginx container already bind-mounts read-only (the staging
compose overlay mounts the host's whole `/etc/letsencrypt`), so no
change to that mount is needed.

**7f. Bring up the seatchart backend container**, then uncomment the
HTTPS block and reload nginx again (must happen in this order — the
server block resolves `seatchart_web` at request time via Docker's
embedded DNS, but the container needs to exist and be joined to the
network first; and the cert from 7e needs to exist before the HTTPS
block will load):
```
cd ~/seatchart/backend
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
docker compose logs web --tail 30
docker network inspect backend_default | grep -A2 seatchart
```
Uncomment the HTTPS `server { listen 443 ssl; server_name
seatchart.swseng.io; ... }` block in `<SWSENG_ROOT>/backend/nginx/nginx.conf`,
then on the VPS (mind the bind-mount gotcha in 7d if editing with
anything other than a plain in-place write/append):
```
cd <SWSENG_ROOT>/backend
docker compose -f docker-compose.yml -f docker-compose.staging.yml exec nginx nginx -t
docker compose -f docker-compose.yml -f docker-compose.staging.yml exec nginx nginx -s reload
curl -sI https://api-staging.swseng.io/ | head -1        # confirm staging still healthy
curl -sI https://seatchart.swseng.io/static/seat-chart.js | head -1   # should be 200
```

**7g. Import the demo catalog and confirm:**
```
docker compose exec web python manage.py import_squarespace_csv test_data/product_import-shows.csv
curl -s https://seatchart.swseng.io/api/shows/TEST01/seats/
curl -sI https://seatchart.swseng.io/static/seat-chart.js | head -1
```

**7h. Squarespace side** (on `https://flute-swan-yncx.squarespace.com/`):
create the demo page with a Code Block:
```html
<div id="seat-chart-root"></div>
<link rel="stylesheet" href="https://seatchart.swseng.io/static/seat-chart.css">
<script src="https://seatchart.swseng.io/static/seat-chart.js"></script>
```
Bulk-import `backend/test_data/product_import-shows.csv` per §4 above,
then password-protect the page (Squarespace page settings → password).

**7i. Register the webhook and test end-to-end** per §5–§6 above, using
`https://seatchart.swseng.io/api/webhooks/squarespace/orders/` as
the registered URL. Update `SQUARESPACE_WEBHOOK_SECRET` in
`~/seatchart/backend/.env` with the real value Squarespace shows
at registration, then `docker compose restart web`.

**Git note:** the `nginx.conf` change to `swseng_mono` (`staging`
branch) needs to be committed and pushed from a machine with write
access to that repo — the deploy key on the VPS is CI/read-only, and
it's a separate repo from this one, so it doesn't ride along with any
`squarespace-seating-chart` commit.

**Tearing the demo down later:** `docker compose down` in
`~/seatchart/backend`, remove the two `seatchart.swseng.io`
server blocks (and this note) from `nginx.conf`, reload
nginx, remove the DNS record, and let the cert expire unrenewed.
