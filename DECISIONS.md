# Decisions Log

## 2026-05-04: HashRouter over BrowserRouter
HashRouter avoids the need for 404.html redirect hacks on GitHub Pages. Trade-off: URLs have `/#/` in them, which is slightly uglier but functionally equivalent.

## 2026-05-04: Tailwind v4 with Vite plugin
Using `@tailwindcss/vite` plugin instead of PostCSS. `tailwind.config.js` exists for repo structure consistency but is unused — all theme config lives in CSS via `@theme`.

## 2026-05-04: No redundancy clock
The 6-month DETE post-redundancy window (from March 2025) has lapsed. Skipping the redundancy clock widget entirely.

## 2026-05-04: Build output to /docs
Vite outputs to `/docs` for GitHub Pages compatibility. GitHub Actions workflow deploys from this directory.

## 2026-05-04: localStorage under single namespaced key
All user-mutable data stored under `sponsor-track-ie:v1` in localStorage. Version-stamped for future migration support.
