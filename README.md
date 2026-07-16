# Ultimate 5-a-side - Online Bidding Fix v2

This package keeps the existing working solo modes and front-end structure, but adds a targeted Version 2 override at the bottom of `app.js`.

## What changed

- **Online Blind Bidding**
  - Eligible users who submit `£0m` lose exactly one skip.
  - Skip counters are clamped between `0/3` and `3/3` and persisted in Firebase state.
  - Users with no skips left cannot submit `£0m`.
  - Maximum bid still respects the reserve needed to complete the remaining squad slots.

- **Online Live Auction**
  - Rewritten as a strict turn-based auction.
  - The first turn is randomised, then rotated for the next player to keep it fair.
  - Only the current online player can bid/pass.
  - Passing costs one skip only if that user has not already bid for the current player.
  - If a user has already bid once for that player, passing is free.
  - Users who cannot fill the player position, or cannot afford a valid next bid, are not penalised.

## Deployment

Upload/replace these files on the site:

- `index.html`
- `styles.css`
- `players.json`
- `app.js`

Then clear Cloudflare cache / hard refresh. The script tag has been cache-busted to `app.js?v=ultimate-online-v2`.

## Note

I have deliberately kept this as a targeted patch rather than a full module split, because the solo game modes are currently working and a full refactor would increase regression risk.
