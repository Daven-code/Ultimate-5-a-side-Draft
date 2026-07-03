# Ultimate 5-a-side Draft - v25 app.js

Replace your existing `app.js` with this one.

## What this version fixes

- Rebuilds the online/local split into two clear boxes.
- Fixes online Pick Player by waiting for `players.json` before drawing a player.
- Uses one shared Firebase room state so all joined devices update.
- The current named player can act, and the host can step in.
- Keeps local game functionality.

## Install

1. Copy `app.js` into your project folder:

```text
C:\Users\Daven.Argile\Documents\fifa-5aside-game
```

2. Do not replace `players.json`.
3. Update `index.html` cache busting to a new version, for example:

```html
<script src="app.js?v=25"></script>
```

4. Commit and push.
5. Hard refresh the browser with Ctrl+F5.
