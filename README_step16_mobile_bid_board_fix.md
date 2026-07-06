# Step 16 - Mobile bid highlight, board header polish and live skip repair

Updated files:
- app.js
- index.html

Changes made:
- Added a real in-card `YOUR GO` banner for online bidding modes so the active action section is visible on actual phones, not just browser mobile preview.
- Kept the green highlighted action panel for laptop/desktop.
- Restyled the top of the online Draft Board / Teams area so it looks more professional across all online game modes.
- Hardened the live auction `No first bid` skip behaviour so the counter is repaired if the no-first-bid marker saves but the skip count does not update.
- Bumped the cache-buster to `app.js?v=61-mobilebidboardfix`, which should help phones load the new script rather than a cached version.

Upload both `app.js` and `index.html` together.
