# Step 17 - Online header/action cleanup

Updated files:
- app.js
- index.html

Changes made:
- Applied the same polished blue sticky-header style to the main online action header (e.g. Live Auction / Make your bid) as the Draft Board header.
- Applied this across all online game modes.
- Restored a strong, obvious `YOUR GO` highlight/banner on the exact bidding card the user needs to interact with.
- Removed duplicate low-value messages from the online play screen:
  - `Live auction open for ...`
  - `It is your turn, ...`
  - `Active player pool: ...`
- For Solo Challenge, removed the player count from the active pool text if it appears.
- Added further live-auction skip hardening for `No first bid` so the skip count is incremented/clamped reliably.
- Bumped cache-buster to `app.js?v=62-onlineheaderactioncleanup`.

Upload both `app.js` and `index.html` together.
