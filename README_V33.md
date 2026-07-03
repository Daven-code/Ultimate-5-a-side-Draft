# Ultimate 5-a-side Draft v33

Based on v32. Local and online draft behaviour is preserved.

Updates:
- Reveal scores now switches to a proper finished results page.
- The in-game turn message / "it is your turn" note is removed once the game is finished.
- Results page shows a winner banner, final totals, teams, players and ratings.
- Share/save image now generates a richer summary image with teams, players and scores.
- Online clients that receive `ratingsRevealed` from Firebase also switch to the finished results page.
- index.html references `app.js?v=33` for cache busting.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
