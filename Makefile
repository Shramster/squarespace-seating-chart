.PHONY: install dev dev-lan build preview clean backend-up backend-down logs

LAN_IP := $(shell ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if ($$i=="src") print $$(i+1)}')

install:
	npm install

# Backend + frontend for local-only testing (matches the CORS/host
# defaults baked into backend/.env).
dev:
	cd backend && docker compose up -d
	npm run dev
	cd backend && docker compose down

# Backend + frontend reachable from other devices on the LAN (e.g. a
# phone), for mobile testing. Overlays docker-compose.lan.yml so Django
# accepts the LAN origin/host, and binds vite to 0.0.0.0.
dev-lan:
	@echo "Frontend will be reachable at http://$(LAN_IP):3000"
	@node -e "require('qrcode-terminal').generate('http://$(LAN_IP):3000', {small: true})"
	cd backend && LAN_IP=$(LAN_IP) docker compose -f docker-compose.yml -f docker-compose.lan.yml up -d
	npm run dev -- --host 0.0.0.0
	cd backend && docker compose -f docker-compose.yml -f docker-compose.lan.yml down

build:
	npm run build

preview:
	npm run preview

clean:
	rm -rf dist node_modules

backend-up:
	cd backend && docker compose up

backend-down:
	cd backend && docker compose down

# Tail the backend container's logs. Run this in a second terminal
# alongside `make dev`/`dev-lan` to watch requests/errors live.
logs:
	cd backend && docker compose logs -f
