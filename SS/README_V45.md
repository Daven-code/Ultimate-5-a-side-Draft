# Ultimate 5-a-side Draft - v45

Updated files:
- `app.js`
- `index.html`

## Change made
Online blind bidding now prevents a user from spending so much that they cannot complete their team.

Rule applied:
- After winning a player, the user must have at least £1m left for every remaining empty squad slot.
- Example: if a user has £50m left and still needs 2 players including the current player, their maximum bid is £49m.
- If the current player would complete their team, they can bid all their remaining budget.

The online bid screen now shows the maximum valid bid for each eligible user, and submission is blocked if the bid is too high.
