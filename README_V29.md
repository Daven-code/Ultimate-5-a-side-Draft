# Ultimate 5-a-side Draft v29

This update preserves your uploaded better-looking layout and applies a local-mode-first fix.

Files included:
- index.html
- app.js

Fixes:
- Local Draft: after clicking Pick player, Accept and Decline are explicitly re-enabled.
- State safety: missing team/declined/history data is sanitised before use.
- index.html references app.js?v=29 for cache busting.

Install:
1. Replace only index.html and app.js.
2. Do not replace styles.css or players.json.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
