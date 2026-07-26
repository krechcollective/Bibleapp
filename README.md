# Bible Reader

A personal, installable PWA for reading the Bible as one continuous infinite
scroll, with a persistent notes/drawing panel, a Bible-in-a-year reading plan
with day dividers, and cross-device progress sync.

## Structure

- `frontend/` — React + Vite PWA (installed via "Add to Home Screen" on
  iPad/iPhone). Virtualized infinite-scroll reader, jump-to-reference,
  dot-grid notes panel, reading plan view, settings.
- `worker/` — Cloudflare Worker + D1 API. Proxies ESV (api.esv.org) and
  The Message (api.bible) passage text with a short-TTL KV cache — it never
  persists Bible text, per both translations' licensing terms. Also serves
  notes, reading plan/progress, and settings, all backed by D1.

## Local development

**Worker (API):**

```sh
cd worker
npm install
npm run db:migrate:local   # applies schema + a placeholder sample plan
npm run dev                # http://localhost:8787
```

To fetch real passage text you'll need API keys (see "Bible text APIs"
below). Set them for local dev with:

```sh
npx wrangler secret put ESV_API_KEY
npx wrangler secret put BIBLE_API_KEY
```

**Frontend:**

```sh
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api to localhost:8787
```

## Deploying

```sh
cd worker
# Create the D1 database and KV namespace, then paste their IDs into
# wrangler.toml (database_id / kv_namespaces[].id):
npx wrangler d1 create bibleapp
npx wrangler kv namespace create PASSAGE_CACHE
npm run db:migrate:remote
npx wrangler secret put ESV_API_KEY
npx wrangler secret put BIBLE_API_KEY
npm run deploy

cd ../frontend
npm run build
# deploy dist/ to Cloudflare Pages (or any static host), pointing /api at
# the deployed Worker's URL.
```

## Bible text APIs

- **ESV** — apply at https://api.esv.org. Free tier terms cap local storage
  at 500 verses / half a book at a time and require non-commercial use.
  The Worker only ever caches recently-viewed chapters in KV with a 1-hour
  TTL — never a permanent store.
- **The Message** — apply for `scripture.api.bible` access. Similar
  per-passage caching restrictions apply. Once approved, confirm the MSG
  bible ID and update `MSG_BIBLE_ID` in `worker/src/lib/messageBible.ts`.

## Reading plan import

The Worker ships with a placeholder 7-day sample plan (see
`worker/migrations/0002_seed_sample_plan.sql`) so the Plan view has data to
show. Once a real day-by-day plan file is available, it needs to be
converted into `reading_plan_days` rows (`day_number`, `day_date`, and a
JSON `passages` array of `{ book, chapter, verseStart?, verseEnd? }`) and
loaded via a new migration or a one-off import script.

## Status

Implemented: PWA shell (manifest, service worker, icons), infinite
virtualized scroll across all 1,189 chapters, jump-to-reference, ESV/MSG
proxy with KV caching, dot-grid text notes synced to D1, reading plan with
day dividers and progress tracking, translation toggle.

Not yet implemented: Apple Pencil vector-stroke drawing in the notes panel
(text notes work today); this is next up once the API access approvals for
ESV/api.bible are in and real passage text is flowing through the reader.
