# Neuroverse v5 — future-ready Support & Learning Hub

This version keeps the complete v4 support website working immediately, but reorganises the project so content, authentication and media can move away from GitHub independently.

## Recommended starting mode
**Start with everything public in GitHub**: code, local JSON content, and the current image library. Publish the `/docs` folder with GitHub Pages. This is the lowest-risk starting point and requires no backend account to keep the site working.

When staff editing is genuinely needed, switch only the content/auth layers to Supabase. You do **not** need to rebuild the UI. If the Academy later needs heavy video delivery, move video files to AWS/CloudFront while keeping lesson metadata in Supabase.

## Repository layout
- `/docs` — the deployable public website (GitHub Pages or Netlify)
- `/docs/data` — local content fallback, shaped like future database rows
- `/docs/src/services` — provider abstraction for content, auth, search and media
- `/supabase` — schema + seed data for the future backend
- `/scripts` — Netlify runtime config generation
- `/architecture` — migration and content-model notes

## Preview locally
```bash
python3 -m http.server 8000 -d docs
```
Then open `http://localhost:8000`.

## Current runtime mode
`docs/config/runtime-config.js` defaults to:
- content = local JSON
- auth = none
- media = local assets
- hash routing

This means GitHub Pages works immediately.

Read `DEPLOYMENT_GUIDE.md` for the exact upload order.

## v5.1 content-source rule
For customer-facing product instructions, **Neuroverse page layout designs PDF is the source of truth**. Older Trial Cards/checklist drafts are not to be used as a content source. v5.1 also changes guide pages to a landscape-first layout so desktop screens use available width more effectively while remaining responsive on smaller screens.


## v5.4 resource integration
The Resource Library now contains curated official links grouped by provider. Device pages surface only the links relevant to that workflow. Items requested without a supplied/verified URL are shown as Link pending in local mode and are intentionally excluded from the Supabase seed until an official URL is available. Tracking query parameters have been removed from stored official URLs.
