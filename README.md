# Animepahe
Animepahe Downloader using Cloudflare Workers &amp; Pages
[Visit](https://animepahe.pages.dev/).

## Run locally

### Prereqs
- Node.js + npm installed

### Install dependencies
```bash
cd worker && npm ci
cd ../pages && npm ci
```

### Start the Worker API (backend)
```bash
cd worker
npm run dev -- --ip 127.0.0.1 --port 8787
```

Quick check:
```bash
curl "http://127.0.0.1:8787/?method=search&query=naruto"
```

### Start the Pages app (frontend)
In another terminal:
```bash
cd pages
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173`.

### Notes
- Season ZIP download only shows on browsers that support the File System Access API (Chrome/Edge).

## Deploy (Cloudflare Workers + Pages)

### 1) Deploy the Worker API
```bash
cd worker
npm ci
npx wrangler login
npx wrangler deploy
```

After deploy, note your Worker URL (example: `https://your-worker.your-subdomain.workers.dev`).

### 2) Deploy the frontend to Cloudflare Pages
Option A (recommended): connect your GitHub repo in the Cloudflare Pages dashboard.
- **Build command:** `npm ci && npm run build`
- **Build output directory:** `dist`
- **Root directory:** `pages`

Option B (CLI):
```bash
cd pages
npm ci
npm run build
npx wrangler pages deploy dist --project-name <your-pages-project>
```

### 3) Point the frontend at your APIs (optional)
If you fork your own Worker(s), set these environment variables in Cloudflare Pages:
- `VITE_ANIME_API` = your Worker API base URL
- `VITE_KWIK_API` = your KwiK direct-link API base URL (if you run your own)
