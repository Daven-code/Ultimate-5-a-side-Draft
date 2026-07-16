# Ultimate 5-a-side - Online Bidding Fix v3

This is the full v3 package based on the latest files.

## New fixes in v3

1. Removed the incorrect bottom turn/waiting box (`#turnLockNote`) from online games.
2. Fixed the online bidding year filter so Online Blind Bidding and Online Live Auction draw players only from the selected year range.

## Previous v2 fixes retained

- Online Blind Bidding skip counters persist properly.
- Online Live Auction is turn-based, rotates the starting user, and only charges a skip when passing before bidding for that player.

## Deployment

Upload/replace:

- `index.html`
- `styles.css`
- `players.json`
- `app.js`

The script tag has been cache-busted to `app.js?v=ultimate-online-v3`. Clear Cloudflare cache after uploading.
