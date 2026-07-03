# Ultimate 5-a-side Draft v28

This update preserves the uploaded polished previous version and applies targeted fixes only.

Files included:
- index.html
- app.js

Fixes:
- Local Pick Player now enables Accept/Decline correctly.
- Online Accept/Decline now sanitises Firebase user/team state before use.
- Safer handling of missing `team`, `declinedNames`, `acceptedPlayerNames`, `history`, and `bidOrder`.
- index.html now references `app.js?v=28` for cache busting.

Install:
1. Replace only `index.html` and `app.js` in your project folder.
2. Do not replace `players.json` or `styles.css`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
5. For online testing, create a new room.
