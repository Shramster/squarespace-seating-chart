.PHONY: install dev build preview clean backend-up backend-down

install:
	npm install

dev:
	npm run dev

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
