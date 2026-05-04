# sponsor-track-ie

A static, single-user web app to organize a focused job hunt for an Irish work permit–sponsored role. Tracks applications, sponsor companies, study progress, and blog post ideas. No backend, no accounts — all data in localStorage.

**Live:** https://prashdev.github.io/sponsor-track-ie/

## Features

- **Dashboard** — visa expiry countdown, weekly action checklist, top-of-mind metrics
- **Jobs** — kanban and table tracker with permit salary warnings (GEP €36,605 / CSEP €40,904)
- **Sponsors** — searchable/filterable table of 39 Irish permit-sponsoring companies
- **Study** — free resources across 5 tracks with progress tracking and study timer
- **News** — live RSS feeds (cybersec, AI, Ireland tech) with read-later bookmarks
- **Blog Ideas** — 26 LinkedIn post seed cards with draft/publish workflow

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/sponsor-track-ie/`

## Build

```bash
npm run build
```

Output goes to `/docs` for GitHub Pages.

## Deploy

Push to `main`. GitHub Actions builds and deploys automatically.

To enable: go to repo Settings → Pages → Source → **GitHub Actions**.

## Add a sponsor company

Edit `data/sponsors.json`, add a new entry following the existing schema, commit and push.

## Back up your data

Open the app → Settings → **Export JSON**. Save the file somewhere safe.
To restore on a new machine, use **Import JSON**.

## Tech

Vite + React + TypeScript, Tailwind CSS v4, HashRouter (GitHub Pages compatible).
