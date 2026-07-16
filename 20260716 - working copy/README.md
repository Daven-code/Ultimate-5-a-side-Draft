# Ultimate 5-a-side - Ultimate Solo Mode Fix v4

This package includes all previous online bidding fixes and the new Ultimate Solo Mode year-filter fix.

## New in v4

- Ultimate Solo Mode now always resets the year range to the full player database range when selected.
- If the user previously changed the Solo Challenge or Easy Solo Challenge year filter, Ultimate Solo Mode no longer inherits that old range.
- The locked Ultimate Solo Mode year-filter UI now displays all years active.
- The game state is forced to the full range before starting Ultimate Solo Mode.

## Deployment

Replace the current files with:

- `index.html`
- `styles.css`
- `players.json`
- `app.js`

The script tag has been cache-busted to `app.js?v=ultimate-online-v4`. Clear Cloudflare cache after uploading.
