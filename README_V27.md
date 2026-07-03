# Ultimate 5-a-side Draft - v27 update

This zip contains both updated files requested:

- `index.html`
- `app.js`

## Fixes included

- Fixes online Accept/Decline crashing with `Cannot read properties of undefined`.
- Fixes local play being broken.
- Keeps the two-box Online game / Local game start screen.
- Updates index.html to load `app.js?v=27` for cache busting.
- Makes Firebase state safer by normalising user/team/declined data every time it is used.

## Install

Copy both files into your project folder:

```text
C:\Users\Daven.Argile\Documents\fifa-5aside-game
```

Replace the existing `index.html` and `app.js`.

Do **not** replace `players.json`.

Then commit and push:

```powershell
git add index.html app.js
git commit -m "Fix online and local player selection"
git push
```

After GitHub Pages updates, hard refresh Chrome with `Ctrl + F5`.

Important: create a **new online room** for testing. Old Firebase rooms may still contain broken stale state.
