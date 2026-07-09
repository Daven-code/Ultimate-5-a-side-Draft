# Ultimate 5-a-side Draft - Maintainer Guide

This package is a Phase 2 refactor of the working website code. The functionality has been preserved by splitting the original long `app.js` into smaller browser scripts that are loaded in the original execution order.

## File structure

```text
index.html
styles.css
players.json
app.js                         # compatibility note only
js/
  01-core-base.js
  02-state-and-results-overrides.js
  03-online-bidding.js
  04-live-auction-and-year-filter.js
  05-solo-modes.js
  06-online-ui-polish.js
  07-leaderboards-and-challenges.js
```

## Important

The JavaScript files are **not ES modules**. They are normal browser scripts and share global functions/variables. Keep the script order in `index.html` exactly as supplied.

## Where to change common things

### Main game constants

File: `js/01-core-base.js`

Search for:

```javascript
const DECLINES_ALLOWED
const AUCTION_BUDGET
const BID_SKIPS_ALLOWED
const TEAM_SHAPE
```

### Firebase settings

File: `js/01-core-base.js`

Search for:

```javascript
const FIREBASE_CONFIG
```

### Homepage challenge cards

File: `index.html` if you want to edit the visible homepage cards.

Search for:

```html
popular-challenges-v2
data-challenge="ultimate"
data-challenge="easy"
```

The click behaviour is in `js/07-leaderboards-and-challenges.js` at the bottom where `window.challengePreset` is set.

### Solo mode setup text

File: `js/05-solo-modes.js`

Search for:

```javascript
Ultimate Solo Mode
Easy Solo Challenge
Solo Challenge
```

This controls the setup page hero, intro box and start button text.

### Ultimate Solo Mode year filter UI

File: `js/05-solo-modes.js`

Search for:

```javascript
Player pool locked to all years
All years active
```

### Easy Solo Challenge player pool limits

File: `js/04-live-auction-and-year-filter.js`

Search for:

```javascript
filteredPlayersStep5
```

Current intended behaviour:

```text
GK  = top 5 per year
DEF = top 5 per year
MID = top 10 per year
FWD = top 5 per year
```

The key line is:

```javascript
const limit = position === "MID" ? 10 : 5;
```

### Leaderboard labels and tabs

File: `js/07-leaderboards-and-challenges.js`

Search for:

```javascript
leaderboardGameModeLabelStep19
loadLeaderboardStep20
setActiveLeaderboardTabStep20
```

Visible leaderboard buttons are in `index.html` inside:

```html
leaderboard-tabs
soloLeaderboardSubTabs
```

### Styling

File: `styles.css`

Search for the relevant area:

```text
Leaderboard Page
Solo Leaderboard Sub Tabs
Front page How to Play
popular-challenges-v2
setup-card-home
```

## Refactor approach used

This refactor is deliberately conservative. Instead of rewriting all functions from scratch, which would risk breaking a working site, the original working execution order has been preserved and documented. The largest maintainability improvement is that each logical area is now in a smaller file with comments explaining what to edit.

## Deployment checklist

1. Upload all files and folders, including the `js` folder.
2. Make sure `index.html` references all seven JS files.
3. Clear browser cache / Cloudflare cache if changes do not appear.
4. Test:
   - Standard Solo Challenge
   - Ultimate Solo Mode
   - Easy Solo Challenge
   - Online Ultimate Draft
   - Online Blind Bidding
   - Online Live Auction
   - Leaderboard submit and filters

