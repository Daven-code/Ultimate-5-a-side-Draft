# Step 15 - Online bid action highlight and skip enforcement

Updated files:
- app.js
- index.html

Changes made:
- In the two online bidding modes, the section the current user needs to use now highlights with a clear green `Your go` marker.
- Added clearer helper text inside the active action card only.
- Online blind bidding now deducts a skip immediately when a user submits £0m.
- The blind-bid result logic avoids double-counting that immediate £0m skip.
- Online live auction skip values are clamped to 0-3 and keep the existing rule: saying no before any first bid uses one skip.
- All online bid skip counts are clamped so users cannot exceed 3 skips.
- Existing online board-fit layout, online draft, Solo Challenge, reset flow and year-filter logic are retained.

Upload both app.js and index.html together.
