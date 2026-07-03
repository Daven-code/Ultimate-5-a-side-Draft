# Ultimate 5-a-side Draft v37

Based on v36. This update only changes the end-of-game reveal behaviour for online games.

Updates:
- Once all teams are complete, every joined online user sees the Reveal ratings button.
- Any joined online user can click Reveal ratings.
- Revealing scores still syncs through Firebase so all users move to the finished results page.
- Local gameplay and result layout from v36 are unchanged.
- index.html references `app.js?v=37` for cache busting.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
5. Create a new online room when testing.
