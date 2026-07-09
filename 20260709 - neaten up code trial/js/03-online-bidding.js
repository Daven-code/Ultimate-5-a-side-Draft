/* ============================================================
   03-online-bidding.js
   ONLINE/LOCAL BIDDING: blind bidding, local bidding fixes, skip lives, reserve-budget rules, then init()

   Refactor note:
   This file is loaded as a normal browser script, not an ES module.
   Files must remain in the order listed in index.html because the
   original working app.js used sequential overrides.
   ============================================================ */

// --- v38 online blind bidding mode override ---
// Online bid mode only: all eligible users submit bids in parallel, then bids are revealed together.
function userNeedsPositionV38(user, position) {
  return getNeededPositions(user).includes(position);
}

function eligibleBidUsersV38(candidate = currentCandidate) {
  if (!state || !candidate) return [];
  v29SafeState();
  return state.users.filter(user => {
    return getNeededPositions(user).length > 0 && userNeedsPositionV38(user, candidate.mainPosition) && Number(user.budget || 0) > 0;
  });
}

function allOnlineBidUsersV38() {
  if (!state) return [];
  v29SafeState();
  return state.users.filter(user => getNeededPositions(user).length > 0);
}

function currentOnlineUserV38() {
  if (!online.enabled || !state) return null;
  v29SafeState();
  return state.users.find(user => safeKey(user.name) === safeKey(online.myName)) || null;
}

function initialiseBlindBidStateV38() {
  if (!state) return;
  if (!state.blindBids || typeof state.blindBids !== "object" || Array.isArray(state.blindBids)) state.blindBids = {};
  state.bidOutcome = state.bidOutcome || null;
  state.bidSubmittingLocked = !!state.bidSubmittingLocked;
}

async function drawOnlineBlindBidCandidateV38() {
  if (!online.enabled || !state || state.gameMode !== "bid") return;
  await ensurePlayersReady();
  v29SafeState();

  if (isGameComplete()) {
    completeGame();
    render();
    await saveOnlineState("Game complete. Reveal ratings to see the winner.");
    return;
  }

  const neededPositions = new Set();
  allOnlineBidUsersV38().forEach(user => getNeededPositions(user).forEach(pos => neededPositions.add(pos)));

  const pool = players.filter(p => {
    return neededPositions.has(p.mainPosition) && !state.acceptedPlayerNames.has(p.player);
  });

  if (!pool.length) {
    completeGame();
    render();
    await saveOnlineState("No more eligible players. Reveal ratings to see the winner.");
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  state.blindBids = {};
  state.bidOutcome = null;
  state.bidSubmittingLocked = false;

  renderCandidate(currentCandidate);
  renderOnlineBidControlsV38();
  setMessage(`Blind bidding open for ${currentCandidate.player}.`);
  await saveOnlineState(`Blind bidding open for ${currentCandidate.player}.`);
}

function renderOnlineBidControlsV38() {
  if (!online.enabled || !state || state.gameMode !== "bid") return;
  initialiseBlindBidStateV38();

  show(els.draftControls, false);
  show(els.bidControls, true);
  show(els.declinesPill, false);
  show(els.budgetPill, false);

  if (els.bidPickBtn) els.bidPickBtn.classList.add("hidden");
  if (els.awardBidBtn) els.awardBidBtn.classList.add("hidden");
  if (els.skipBidBtn) els.skipBidBtn.classList.add("hidden");

  const me = currentOnlineUserV38();
  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(online.myName);
  const myBid = state.blindBids?.[myKey];
  const submittedCount = eligible.filter(user => state.blindBids?.[safeKey(user.name)]?.submitted).length;
  const totalCount = eligible.length;
  const outcome = state.bidOutcome;

  if (els.bidOrderDisplay) {
    els.bidOrderDisplay.innerHTML = `
      <div class="bid-status-summary">
        <strong>Blind bidding</strong>
        <span>${submittedCount}/${totalCount} eligible bids submitted</span>
      </div>
    `;
  }

  if (!els.bidInputs) return;

  if (!currentCandidate && isGameComplete()) {
    els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`;
    syncRevealButtonV37?.();
    return;
  }

  if (!currentCandidate && !outcome) {
    els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`;
    return;
  }

  const statusRows = state.users.map(user => {
    const key = safeKey(user.name);
    const isEligible = eligibleKeys.has(key);
    const submitted = !!state.blindBids?.[key]?.submitted;
    const budget = Number(user.budget || 0);
    return `
      <div class="bid-row">
        <label>
          ${escapeHtml(user.name)}
          <span class="bid-help">Budget left: £${budget}m</span>
        </label>
        <div class="bid-submit-status ${submitted ? "submitted" : "waiting"}">
          ${isEligible ? (submitted ? "Bid submitted ✅" : "Waiting for bid") : "Not eligible for this position"}
        </div>
      </div>
    `;
  }).join("");

  if (outcome) {
    const bidRevealRows = outcome.bids.map(row => `
      <div class="bid-row">
        <label>${escapeHtml(row.name)}</label>
        <div class="bid-submit-status submitted">£${Number(row.bid || 0)}m</div>
      </div>
    `).join("");

    els.bidInputs.innerHTML = `
      <div class="bid-order-card">
        <p class="eyebrow">Bids revealed</p>
        <h3>${escapeHtml(outcome.player?.player || "Player")}</h3>
        <p class="message">
          ${outcome.winnerName
            ? `${escapeHtml(outcome.winnerName)} wins ${escapeHtml(outcome.player?.player || "the player")} for £${outcome.winningBid}m${outcome.tie ? " after a tied highest bid" : ""}.`
            : `No valid bids above £0m. ${escapeHtml(outcome.player?.player || "The player")} was skipped.`}
        </p>
        ${bidRevealRows}
        <p class="muted">Next player loading...</p>
      </div>
    `;
    return;
  }

  const canSubmit = !!me && eligibleKeys.has(myKey) && !myBid?.submitted && !state.bidSubmittingLocked;
  const myBudget = Number(me?.budget || 0);

  const submitBox = canSubmit ? `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <h3>${escapeHtml(currentCandidate.player)}</h3>
      <p class="muted">Enter your bid privately. Other users will only see that you have submitted.</p>
      <div class="bid-row">
        <label for="onlineBlindBidInput">
          Your bid
          <span class="bid-help">Budget left: £${myBudget}m</span>
        </label>
        <input id="onlineBlindBidInput" type="number" min="0" max="${myBudget}" step="1" value="0" />
      </div>
      <button id="submitBlindBidBtn" class="btn btn-primary" type="button">Submit blind bid</button>
    </div>
  ` : `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <p class="muted">
        ${myBid?.submitted
          ? "Your bid has been submitted. Waiting for everyone else."
          : eligibleKeys.has(myKey)
            ? "Bidding is locked while results are being calculated."
            : "You are not eligible for this player because your team does not need this position, or you have no budget left."}
      </p>
    </div>
  `;

  els.bidInputs.innerHTML = submitBox + `<div class="bid-order-card"><p class="eyebrow">Submission status</p>${statusRows}</div>`;

  $("submitBlindBidBtn")?.addEventListener("click", safe(submitOnlineBlindBidV38));
}

async function submitOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();

  const me = currentOnlineUserV38();
  if (!me) throw new Error("You are not listed in this online game.");

  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(me.name);

  if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible to bid for this player.");
  if (state.blindBids?.[myKey]?.submitted) return;

  const input = $("onlineBlindBidInput");
  const rawBid = Number(input?.value || 0);
  const bid = Math.max(0, Math.floor(rawBid));

  if (!Number.isFinite(bid)) throw new Error("Enter a valid bid.");
  if (bid > Number(me.budget || 0)) throw new Error(`Your bid cannot exceed your remaining budget of £${me.budget}m.`);

  state.blindBids[myKey] = {
    name: me.name,
    bid,
    submitted: true,
    submittedAt: Date.now()
  };

  const allSubmitted = eligible.every(user => state.blindBids?.[safeKey(user.name)]?.submitted);

  if (allSubmitted) {
    await resolveOnlineBlindBidV38();
  } else {
    renderOnlineBidControlsV38();
    await saveOnlineState(`${me.name} submitted a blind bid.`);
  }
}

async function resolveOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();

  state.bidSubmittingLocked = true;
  const candidate = v29NormalisePlayer(currentCandidate);
  const eligible = eligibleBidUsersV38(candidate);
  const bids = eligible.map(user => {
    const entry = state.blindBids?.[safeKey(user.name)] || { name: user.name, bid: 0, submitted: false };
    return {
      name: user.name,
      bid: Math.max(0, Math.floor(Number(entry.bid || 0))),
      budget: Number(user.budget || 0)
    };
  });

  let validBids = bids.filter(row => row.bid > 0 && row.bid <= row.budget);
  validBids.sort((a, b) => b.bid - a.bid || a.name.localeCompare(b.name));

  let winnerName = null;
  let winningBid = 0;
  let tie = false;

  if (validBids.length) {
    const highest = validBids[0].bid;
    const tied = validBids.filter(row => row.bid === highest);
    tie = tied.length > 1;
    const winnerRow = tied[Math.floor(Math.random() * tied.length)];
    winnerName = winnerRow.name;
    winningBid = winnerRow.bid;

    const winner = state.users.find(user => safeKey(user.name) === safeKey(winnerName));
    if (winner && candidate) {
      winner.team.push({ ...candidate, price: winningBid });
      winner.budget = Math.max(0, Number(winner.budget || 0) - winningBid);
      winner.spent = Number(winner.spent || 0) + winningBid;
      state.acceptedPlayerNames.add(candidate.player);
    }
  }

  state.bidOutcome = {
    player: candidate,
    bids,
    winnerName,
    winningBid,
    tie,
    resolvedAt: Date.now()
  };

  currentCandidate = null;
  renderOnlineBidControlsV38();
  renderTeams();
  await saveOnlineState(winnerName ? `${winnerName} won ${candidate.player} for £${winningBid}m.` : `${candidate.player} was skipped.`);

  if (isGameComplete()) {
    setTimeout(async () => {
      completeGame();
      render();
      await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
    }, 3500);
  } else {
    setTimeout(async () => {
      await drawOnlineBlindBidCandidateV38();
    }, 3500);
  }
}

async function startOnlineGameFromLobby() {
  if (!online.enabled || !online.isHost || !online.ref) return;

  await ensurePlayersReady();

  const snapshot = await online.ref.child("participants").once("value");
  const names = participantNamesFromObject(snapshot.val());

  const minUsers = selectedGameMode === "bid" ? 2 : 1;

  if (names.length < minUsers) {
    throw new Error(selectedGameMode === "bid"
      ? "Bid mode needs at least 2 players."
      : "At least 1 player is needed.");
  }

  startNewGame(selectedGameMode, names.slice(0, 4), true);

  if (selectedGameMode === "bid") {
    state.blindBids = {};
    state.bidOutcome = null;
    state.bidSubmittingLocked = false;
    await drawOnlineBlindBidCandidateV38();
  } else {
    await saveOnlineState("Online game started.");
  }
}

async function bidRandomPlayer() {
  if (online.enabled && state?.gameMode === "bid") {
    await drawOnlineBlindBidCandidateV38();
    return;
  }
  await ensurePlayersReady();
  if (!state || state.gameMode !== "bid") return;
  const user = currentUser();
  if (!user) return;
  const needs = getNeededPositions(user);
  const pool = players.filter(p => {
    return needs.includes(p.mainPosition) && !state.acceptedPlayerNames.has(p.player);
  });
  if (!pool.length) {
    setMessage(`No available player for ${user.name}.`);
    return;
  }
  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  renderBidInputs();
  await saveOnlineState();
}

function render() {
  if (!state) return;
  v29SafeState();
  updateGameControls();
  const user = currentUser();
  if (els.currentUserLabel) els.currentUserLabel.textContent = user?.name || "";
  if (state.gameMode === "draft" && els.declinesLeft) {
    els.declinesLeft.textContent = DECLINES_ALLOWED - (user?.declines || 0);
  }
  if (state.gameMode === "bid" && els.currentBudgetLeft) {
    els.currentBudgetLeft.textContent = `£${user?.budget || 0}m`;
  }
  renderTeams();
  if (online.enabled && state.gameMode === "bid") renderOnlineBidControlsV38();
  else setDraftActionButtons();
  applyOnlinePermissions();
  syncRevealButtonV37();
}

function applyRemoteData(data) {
  applyingRemote = true;
  state = restoreState(data.state);
  currentCandidate = data.currentCandidate || null;
  ratingsRevealed = !!data.ratingsRevealed;

  if (ratingsRevealed) {
    applyingRemote = false;
    showFinishedResultsPageV33();
    return;
  }

  hideEntryPanel();
  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, true);
  show(els.resultsPanel, false);
  updateGameControls();
  render();
  if (currentCandidate) renderCandidate(currentCandidate);
  else clearCandidate(data.message || (isGameComplete() ? "Game complete. Reveal ratings to see the winner." : "Waiting for the next action..."));
  renderTeams();
  if (online.enabled && state?.gameMode === "bid") renderOnlineBidControlsV38();
  setMessage(data.message || "");
  applyingRemote = false;
  applyOnlinePermissions();
  syncRevealButtonV37();
}



// --- v39 preserve unsubmitted blind bid input during remote updates ---
// Fixes: When another online user submits, Firebase refresh re-renders the controls. Any typed-but-unsubmitted bid now persists locally.
function blindBidDraftKeyV39() {
  const playerKey = currentCandidate?.player ? safeKey(currentCandidate.player) : "no_player";
  const roomKey = online.roomId || "local_room";
  const userKey = safeKey(online.myName || "anon");
  return `ultimate5aside_blind_bid_draft_${roomKey}_${userKey}_${playerKey}`;
}

function getBlindBidDraftV39(defaultValue = "0") {
  try {
    return localStorage.getItem(blindBidDraftKeyV39()) ?? defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

function setBlindBidDraftV39(value) {
  try {
    localStorage.setItem(blindBidDraftKeyV39(), String(value ?? "0"));
  } catch (err) {
    // localStorage can be blocked in some privacy modes. If so, the game still works; only the draft preservation is skipped.
  }
}

function clearBlindBidDraftV39() {
  try {
    localStorage.removeItem(blindBidDraftKeyV39());
  } catch (err) {
    // Ignore.
  }
}

function renderOnlineBidControlsV38() {
  if (!online.enabled || !state || state.gameMode !== "bid") return;
  initialiseBlindBidStateV38();

  show(els.draftControls, false);
  show(els.bidControls, true);
  show(els.declinesPill, false);
  show(els.budgetPill, false);

  if (els.bidPickBtn) els.bidPickBtn.classList.add("hidden");
  if (els.awardBidBtn) els.awardBidBtn.classList.add("hidden");
  if (els.skipBidBtn) els.skipBidBtn.classList.add("hidden");

  const me = currentOnlineUserV38();
  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(online.myName);
  const myBid = state.blindBids?.[myKey];
  const submittedCount = eligible.filter(user => state.blindBids?.[safeKey(user.name)]?.submitted).length;
  const totalCount = eligible.length;
  const outcome = state.bidOutcome;

  if (els.bidOrderDisplay) {
    els.bidOrderDisplay.innerHTML = `
      <div class="bid-status-summary">
        <strong>Blind bidding</strong>
        <span>${submittedCount}/${totalCount} eligible bids submitted</span>
      </div>
    `;
  }

  if (!els.bidInputs) return;

  if (!currentCandidate && isGameComplete()) {
    els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`;
    syncRevealButtonV37?.();
    return;
  }

  if (!currentCandidate && !outcome) {
    els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`;
    return;
  }

  const statusRows = state.users.map(user => {
    const key = safeKey(user.name);
    const isEligible = eligibleKeys.has(key);
    const submitted = !!state.blindBids?.[key]?.submitted;
    const budget = Number(user.budget || 0);
    return `
      <div class="bid-row">
        <label>
          ${escapeHtml(user.name)}
          <span class="bid-help">Budget left: £${budget}m</span>
        </label>
        <div class="bid-submit-status ${submitted ? "submitted" : "waiting"}">
          ${isEligible ? (submitted ? "Bid submitted ✅" : "Waiting for bid") : "Not eligible for this position"}
        </div>
      </div>
    `;
  }).join("");

  if (outcome) {
    clearBlindBidDraftV39();
    const bidRevealRows = outcome.bids.map(row => `
      <div class="bid-row">
        <label>${escapeHtml(row.name)}</label>
        <div class="bid-submit-status submitted">£${Number(row.bid || 0)}m</div>
      </div>
    `).join("");

    els.bidInputs.innerHTML = `
      <div class="bid-order-card">
        <p class="eyebrow">Bids revealed</p>
        <h3>${escapeHtml(outcome.player?.player || "Player")}</h3>
        <p class="message">
          ${outcome.winnerName
            ? `${escapeHtml(outcome.winnerName)} wins ${escapeHtml(outcome.player?.player || "the player")} for £${outcome.winningBid}m${outcome.tie ? " after a tied highest bid" : ""}.`
            : `No valid bids above £0m. ${escapeHtml(outcome.player?.player || "The player")} was skipped.`}
        </p>
        ${bidRevealRows}
        <p class="muted">Next player loading...</p>
      </div>
    `;
    return;
  }

  const canSubmit = !!me && eligibleKeys.has(myKey) && !myBid?.submitted && !state.bidSubmittingLocked;
  const myBudget = Number(me?.budget || 0);
  const draftValue = getBlindBidDraftV39("0");

  const submitBox = canSubmit ? `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <h3>${escapeHtml(currentCandidate.player)}</h3>
      <p class="muted">Enter your bid privately. Other users will only see that you have submitted.</p>
      <div class="bid-row">
        <label for="onlineBlindBidInput">
          Your bid
          <span class="bid-help">Budget left: £${myBudget}m</span>
        </label>
        <input id="onlineBlindBidInput" type="number" min="0" max="${myBudget}" step="1" value="${escapeHtml(draftValue)}" />
      </div>
      <button id="submitBlindBidBtn" class="btn btn-primary" type="button">Submit blind bid</button>
    </div>
  ` : `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <p class="muted">
        ${myBid?.submitted
          ? "Your bid has been submitted. Waiting for everyone else."
          : eligibleKeys.has(myKey)
            ? "Bidding is locked while results are being calculated."
            : "You are not eligible for this player because your team does not need this position, or you have no budget left."}
      </p>
    </div>
  `;

  els.bidInputs.innerHTML = submitBox + `<div class="bid-order-card"><p class="eyebrow">Submission status</p>${statusRows}</div>`;

  const bidInput = $("onlineBlindBidInput");
  if (bidInput) {
    bidInput.addEventListener("input", event => setBlindBidDraftV39(event.target.value));
    bidInput.addEventListener("change", event => setBlindBidDraftV39(event.target.value));
  }

  $("submitBlindBidBtn")?.addEventListener("click", safe(submitOnlineBlindBidV38));
}

async function submitOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();

  const me = currentOnlineUserV38();
  if (!me) throw new Error("You are not listed in this online game.");

  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(me.name);

  if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible to bid for this player.");
  if (state.blindBids?.[myKey]?.submitted) return;

  const input = $("onlineBlindBidInput");
  const rawValue = input?.value ?? getBlindBidDraftV39("0");
  const rawBid = Number(rawValue || 0);
  const bid = Math.max(0, Math.floor(rawBid));

  if (!Number.isFinite(bid)) throw new Error("Enter a valid bid.");
  if (bid > Number(me.budget || 0)) throw new Error(`Your bid cannot exceed your remaining budget of £${me.budget}m.`);

  state.blindBids[myKey] = {
    name: me.name,
    bid,
    submitted: true,
    submittedAt: Date.now()
  };
  clearBlindBidDraftV39();

  const allSubmitted = eligible.every(user => state.blindBids?.[safeKey(user.name)]?.submitted);

  if (allSubmitted) {
    await resolveOnlineBlindBidV38();
  } else {
    renderOnlineBidControlsV38();
    await saveOnlineState(`${me.name} submitted a blind bid.`);
  }
}



// --- v42 local bid controls fix ---
// Fixes local bid mode where Award highest bid and Skip player stayed disabled.
// Online blind bidding from v39 is deliberately left unchanged.
function setBidActionButtonsV42() {
  if (!state || state.gameMode !== "bid") return;

  // Online bid mode uses its own blind bidding controls, so don't interfere with it.
  if (online.enabled) return;

  const hasCandidate = !!currentCandidate;
  const complete = isGameComplete();

  if (els.bidPickBtn) {
    els.bidPickBtn.classList.remove("hidden");
    els.bidPickBtn.disabled = hasCandidate || complete;
  }

  if (els.awardBidBtn) {
    els.awardBidBtn.classList.remove("hidden");
    els.awardBidBtn.disabled = !hasCandidate || complete;
  }

  if (els.skipBidBtn) {
    els.skipBidBtn.classList.remove("hidden");
    els.skipBidBtn.disabled = !hasCandidate || complete;
  }
}

function clearLocalBidInputsV42(message = "") {
  if (!online.enabled && state?.gameMode === "bid" && els.bidInputs) {
    els.bidInputs.innerHTML = message ? `<p class="muted">${escapeHtml(message)}</p>` : "";
  }
}

function renderBidInputs() {
  if (!els.bidInputs || !state || state.gameMode !== "bid") return;

  if (!currentCandidate) {
    clearLocalBidInputsV42("Randomise a player to enter bids.");
    setBidActionButtonsV42();
    return;
  }

  els.bidInputs.innerHTML = state.users.map((u, i) => `
    <div class="bid-row">
      <label for="bidUser${i}">
        ${escapeHtml(u.name)}
        <span class="bid-help">Budget left: £${u.budget}m</span>
      </label>
      <input id="bidUser${i}" type="number" min="0" max="${u.budget}" step="1" value="0" />
    </div>
  `).join("");

  setBidActionButtonsV42();
}

async function bidRandomPlayer() {
  if (online.enabled && state?.gameMode === "bid") {
    await drawOnlineBlindBidCandidateV38();
    return;
  }

  await ensurePlayersReady();
  if (!state || state.gameMode !== "bid") return;
  v29SafeState();

  if (currentCandidate) {
    setMessage("Award or skip the current player before randomising another.");
    setBidActionButtonsV42();
    return;
  }

  if (isGameComplete()) {
    completeGame();
    render();
    return;
  }

  const user = currentUser();
  if (!user) return;

  const needs = getNeededPositions(user);
  const pool = players.filter(p => {
    return needs.includes(p.mainPosition) && !state.acceptedPlayerNames.has(p.player);
  });

  if (!pool.length) {
    setMessage(`No available player for ${user.name}.`);
    setBidActionButtonsV42();
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  renderBidInputs();
  setMessage(`${user.name} nominated ${currentCandidate.player}. Enter bids, then award or skip.`);
  renderTeams();
  setBidActionButtonsV42();
  await saveOnlineState();
}

async function awardHighestBid() {
  // Keep online mode completely separate.
  if (online.enabled) return;
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  v29SafeState();

  let best = null;

  state.users.forEach((u, i) => {
    const bid = getBid(i);
    if (bid > 0 && bid <= u.budget && (!best || bid > best.bid)) {
      best = { user: u, index: i, bid };
    }
  });

  if (!best) {
    setMessage("Enter at least one valid bid above £0m.");
    setBidActionButtonsV42();
    return;
  }

  const awardedPlayer = v29NormalisePlayer(currentCandidate);
  if (!awardedPlayer) return;

  best.user.team.push({
    ...awardedPlayer,
    price: best.bid
  });

  best.user.budget = Math.max(0, Number(best.user.budget || 0) - best.bid);
  best.user.spent = Number(best.user.spent || 0) + best.bid;
  state.acceptedPlayerNames.add(awardedPlayer.player);

  const winnerName = best.user.name;
  const playerName = awardedPlayer.player;
  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
    clearLocalBidInputsV42("Bidding complete. Reveal ratings to see the winner.");
  } else {
    rotateBidNominator();
    clearCandidate("Click Randomise player to continue.");
    clearLocalBidInputsV42("Randomise the next player to enter bids.");
    setMessage(`${winnerName} won ${playerName} for £${best.bid}m.`);
  }

  render();
  setBidActionButtonsV42();
  await saveOnlineState();
}

async function skipBidPlayer() {
  // Keep online mode completely separate.
  if (online.enabled) return;
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  v29SafeState();

  const skippedName = currentCandidate.player;
  currentCandidate = null;

  rotateBidNominator();
  clearCandidate("Player skipped. Click Randomise player to continue.");
  clearLocalBidInputsV42("Randomise the next player to enter bids.");
  setMessage(`${skippedName} was skipped.`);

  render();
  setBidActionButtonsV42();
  await saveOnlineState();
}

function render() {
  if (!state) return;
  v29SafeState();
  updateGameControls();

  const user = currentUser();
  if (els.currentUserLabel) els.currentUserLabel.textContent = user?.name || "";

  if (state.gameMode === "draft" && els.declinesLeft) {
    els.declinesLeft.textContent = DECLINES_ALLOWED - (user?.declines || 0);
  }

  if (state.gameMode === "bid" && els.currentBudgetLeft) {
    els.currentBudgetLeft.textContent = `£${user?.budget || 0}m`;
  }

  renderTeams();

  if (online.enabled && state.gameMode === "bid") {
    renderOnlineBidControlsV38();
  } else if (state.gameMode === "bid") {
    setBidActionButtonsV42();
  } else {
    setDraftActionButtons();
  }

  applyOnlinePermissions();
  syncRevealButtonV37();
}



// --- v43 restore local bid skip lives ---
// Local bid mode only. Online blind bidding remains unchanged.
// Rule: each eligible user has 3 zero-bid/skip lives. If they bid £0m or the player is skipped, they lose one life.
// Once a user has used 3 skips, they must bid above £0m for eligible players.
function localEligibleBidUsersV43(candidate = currentCandidate) {
  if (!state || !candidate) return [];
  v29SafeState();
  return state.users.filter(user => {
    return getNeededPositions(user).includes(candidate.mainPosition);
  });
}

function localBidSkipsUsedV43(user) {
  return Math.max(0, Number(user?.bidSkips || 0));
}

function localBidSkipsLeftV43(user) {
  return Math.max(0, BID_SKIPS_ALLOWED - localBidSkipsUsedV43(user));
}

function localZeroBidUsersV43(eligibleUsers) {
  return eligibleUsers.filter((user) => {
    const index = state.users.findIndex(u => safeKey(u.name) === safeKey(user.name));
    return getBid(index) <= 0;
  });
}

function localUsersWithNoSkipsLeftV43(users) {
  return users.filter(user => localBidSkipsUsedV43(user) >= BID_SKIPS_ALLOWED);
}

function localIncrementSkipsV43(users) {
  users.forEach(user => {
    user.bidSkips = Math.min(BID_SKIPS_ALLOWED, localBidSkipsUsedV43(user) + 1);
  });
}

function setBidActionButtonsV42() {
  if (!state || state.gameMode !== "bid") return;
  if (online.enabled) return;

  const hasCandidate = !!currentCandidate;
  const complete = isGameComplete();
  const eligibleUsers = localEligibleBidUsersV43();
  const everyoneCanStillSkip = eligibleUsers.length > 0 && localUsersWithNoSkipsLeftV43(eligibleUsers).length === 0;

  if (els.bidPickBtn) {
    els.bidPickBtn.classList.remove("hidden");
    els.bidPickBtn.disabled = hasCandidate || complete;
  }

  if (els.awardBidBtn) {
    els.awardBidBtn.classList.remove("hidden");
    els.awardBidBtn.disabled = !hasCandidate || complete;
  }

  if (els.skipBidBtn) {
    els.skipBidBtn.classList.remove("hidden");
    // If any eligible user has no skips left, the group cannot skip the player outright.
    els.skipBidBtn.disabled = !hasCandidate || complete || !everyoneCanStillSkip;
    els.skipBidBtn.title = hasCandidate && !everyoneCanStillSkip
      ? "At least one eligible user has no skips left and must bid above £0m."
      : "";
  }
}

function renderBidInputs() {
  if (!els.bidInputs || !state || state.gameMode !== "bid") return;

  if (!currentCandidate) {
    clearLocalBidInputsV42("Randomise a player to enter bids.");
    setBidActionButtonsV42();
    return;
  }

  const eligibleKeys = new Set(localEligibleBidUsersV43().map(user => safeKey(user.name)));

  els.bidInputs.innerHTML = state.users.map((u, i) => {
    const eligible = eligibleKeys.has(safeKey(u.name));
    const skipsLeft = localBidSkipsLeftV43(u);
    const mustBid = eligible && skipsLeft <= 0;
    return `
      <div class="bid-row">
        <label for="bidUser${i}">
          ${escapeHtml(u.name)}
          <span class="bid-help">
            Budget left: £${u.budget}m • Skips left: ${skipsLeft}/${BID_SKIPS_ALLOWED}${mustBid ? " • must bid above £0m" : ""}
          </span>
        </label>
        <input id="bidUser${i}" type="number" min="0" max="${u.budget}" step="1" value="0" ${eligible ? "" : "disabled"} />
        ${eligible ? "" : `<p class="muted" style="margin:6px 0 0;">Not eligible for ${escapeHtml(currentCandidate.mainPosition)}.</p>`}
      </div>
    `;
  }).join("");

  setBidActionButtonsV42();
}

async function awardHighestBid() {
  // Keep online mode completely separate.
  if (online.enabled) return;
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  v29SafeState();

  const eligibleUsers = localEligibleBidUsersV43();
  if (!eligibleUsers.length) {
    setMessage("No eligible users can bid for this player. Skip or randomise again.");
    setBidActionButtonsV42();
    return;
  }

  const zeroBidUsers = localZeroBidUsersV43(eligibleUsers);
  const zeroBiddersWithNoSkipsLeft = localUsersWithNoSkipsLeftV43(zeroBidUsers);

  if (zeroBiddersWithNoSkipsLeft.length) {
    setMessage(`${zeroBiddersWithNoSkipsLeft.map(u => u.name).join(" and ")} ${zeroBiddersWithNoSkipsLeft.length === 1 ? "has" : "have"} no skips left and must bid above £0m.`);
    setBidActionButtonsV42();
    return;
  }

  let best = null;

  eligibleUsers.forEach((u) => {
    const i = state.users.findIndex(user => safeKey(user.name) === safeKey(u.name));
    const bid = getBid(i);
    if (bid > 0 && bid <= u.budget && (!best || bid > best.bid)) {
      best = { user: u, index: i, bid };
    }
  });

  // If everyone eligible bid zero, everyone eligible loses a skip and the player is skipped.
  if (!best) {
    localIncrementSkipsV43(eligibleUsers);
    const skippedName = currentCandidate.player;
    currentCandidate = null;
    rotateBidNominator();
    clearCandidate("Everyone bid £0m. Player skipped. Click Randomise player to continue.");
    clearLocalBidInputsV42("Randomise the next player to enter bids.");
    setMessage(`${skippedName} was skipped. ${eligibleUsers.map(u => u.name).join(", ")} ${eligibleUsers.length === 1 ? "loses" : "lose"} one skip.`);
    render();
    setBidActionButtonsV42();
    await saveOnlineState();
    return;
  }

  // Any eligible user who bid £0m also loses a skip, even if another user wins the player.
  localIncrementSkipsV43(zeroBidUsers);

  const awardedPlayer = v29NormalisePlayer(currentCandidate);
  if (!awardedPlayer) return;

  best.user.team.push({
    ...awardedPlayer,
    price: best.bid
  });

  best.user.budget = Math.max(0, Number(best.user.budget || 0) - best.bid);
  best.user.spent = Number(best.user.spent || 0) + best.bid;
  state.acceptedPlayerNames.add(awardedPlayer.player);

  const winnerName = best.user.name;
  const playerName = awardedPlayer.player;
  const zeroPenaltyText = zeroBidUsers.length
    ? ` ${zeroBidUsers.map(u => u.name).join(", ")} ${zeroBidUsers.length === 1 ? "loses" : "lose"} one skip for bidding £0m.`
    : "";

  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
    clearLocalBidInputsV42("Bidding complete. Reveal ratings to see the winner.");
  } else {
    rotateBidNominator();
    clearCandidate("Click Randomise player to continue.");
    clearLocalBidInputsV42("Randomise the next player to enter bids.");
    setMessage(`${winnerName} won ${playerName} for £${best.bid}m.${zeroPenaltyText}`);
  }

  render();
  setBidActionButtonsV42();
  await saveOnlineState();
}

async function skipBidPlayer() {
  // Keep online mode completely separate.
  if (online.enabled) return;
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  v29SafeState();

  const eligibleUsers = localEligibleBidUsersV43();
  const usersWithNoSkipsLeft = localUsersWithNoSkipsLeftV43(eligibleUsers);

  if (usersWithNoSkipsLeft.length) {
    setMessage(`${usersWithNoSkipsLeft.map(u => u.name).join(" and ")} ${usersWithNoSkipsLeft.length === 1 ? "has" : "have"} no skips left and must bid above £0m.`);
    setBidActionButtonsV42();
    return;
  }

  localIncrementSkipsV43(eligibleUsers);

  const skippedName = currentCandidate.player;
  currentCandidate = null;

  rotateBidNominator();
  clearCandidate("Player skipped. Click Randomise player to continue.");
  clearLocalBidInputsV42("Randomise the next player to enter bids.");
  setMessage(`${skippedName} was skipped. ${eligibleUsers.map(u => u.name).join(", ")} ${eligibleUsers.length === 1 ? "loses" : "lose"} one skip.`);

  render();
  setBidActionButtonsV42();
  await saveOnlineState();
}

function renderTeams() {
  if (!els.teamsContainer || !state || !Array.isArray(state.users)) return;
  v29SafeState();
  els.teamsContainer.innerHTML = state.users.map((user, index) => {
    const safeUser = v29SafeUser(user, index);
    state.users[index] = safeUser;
    const total = safeUser.team.reduce((sum, p) => sum + Number(p.rating || 0), 0);
    const needs = getNeededPositions(safeUser);
    return `
      <article class="team-card">
        <div class="team-top-row">
          <div>
            <h3>${escapeHtml(safeUser.name)}</h3>
            <div class="team-meta">${needs.length ? `Needs ${needs.join(", ")}` : "Complete"}</div>
          </div>
          <div class="score">${ratingsRevealed ? total : "Hidden"}</div>
        </div>
        ${renderPitch(buildSlots(safeUser))}
        ${state.gameMode === "draft"
          ? `<div class="score">Declines used: ${safeUser.declines}/${DECLINES_ALLOWED}</div>`
          : `<div class="score">Skips used: ${localBidSkipsUsedV43(safeUser)}/${BID_SKIPS_ALLOWED}</div>`}
      </article>
    `;
  }).join("");
}



// --- v44 online blind bid skip lives ---
// Extends the v43 3-skip rule to ONLINE blind bidding.
// If an eligible online user submits £0m, they lose one skip. If they have used all 3 skips, they must bid above £0m.
function onlineBidSkipsUsedV44(user) {
  return Math.max(0, Number(user?.bidSkips || 0));
}

function onlineBidSkipsLeftV44(user) {
  return Math.max(0, BID_SKIPS_ALLOWED - onlineBidSkipsUsedV44(user));
}

function onlineIncrementSkipV44(user) {
  if (!user) return;
  user.bidSkips = Math.min(BID_SKIPS_ALLOWED, onlineBidSkipsUsedV44(user) + 1);
}

function renderOnlineBidControlsV38() {
  if (!online.enabled || !state || state.gameMode !== "bid") return;
  initialiseBlindBidStateV38();
  v29SafeState();

  show(els.draftControls, false);
  show(els.bidControls, true);
  show(els.declinesPill, false);
  show(els.budgetPill, false);

  if (els.bidPickBtn) els.bidPickBtn.classList.add("hidden");
  if (els.awardBidBtn) els.awardBidBtn.classList.add("hidden");
  if (els.skipBidBtn) els.skipBidBtn.classList.add("hidden");

  const me = currentOnlineUserV38();
  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(online.myName);
  const myBid = state.blindBids?.[myKey];
  const submittedCount = eligible.filter(user => state.blindBids?.[safeKey(user.name)]?.submitted).length;
  const totalCount = eligible.length;
  const outcome = state.bidOutcome;

  if (els.bidOrderDisplay) {
    els.bidOrderDisplay.innerHTML = `
      <div class="bid-status-summary">
        <strong>Blind bidding</strong>
        <span>${submittedCount}/${totalCount} eligible bids submitted</span>
      </div>
    `;
  }

  if (!els.bidInputs) return;

  if (!currentCandidate && isGameComplete()) {
    els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`;
    syncRevealButtonV37?.();
    return;
  }

  if (!currentCandidate && !outcome) {
    els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`;
    return;
  }

  const statusRows = state.users.map(user => {
    const key = safeKey(user.name);
    const isEligible = eligibleKeys.has(key);
    const submitted = !!state.blindBids?.[key]?.submitted;
    const budget = Number(user.budget || 0);
    const skipsLeft = onlineBidSkipsLeftV44(user);
    return `
      <div class="bid-row">
        <label>
          ${escapeHtml(user.name)}
          <span class="bid-help">Budget left: £${budget}m • Skips left: ${skipsLeft}/${BID_SKIPS_ALLOWED}</span>
        </label>
        <div class="bid-submit-status ${submitted ? "submitted" : "waiting"}">
          ${isEligible ? (submitted ? "Bid submitted ✅" : (skipsLeft <= 0 ? "Must bid above £0m" : "Waiting for bid")) : "Not eligible for this position"}
        </div>
      </div>
    `;
  }).join("");

  if (outcome) {
    clearBlindBidDraftV39();
    const bidRevealRows = outcome.bids.map(row => `
      <div class="bid-row">
        <label>${escapeHtml(row.name)}</label>
        <div class="bid-submit-status submitted">£${Number(row.bid || 0)}m</div>
      </div>
    `).join("");

    els.bidInputs.innerHTML = `
      <div class="bid-order-card">
        <p class="eyebrow">Bids revealed</p>
        <h3>${escapeHtml(outcome.player?.player || "Player")}</h3>
        <p class="message">
          ${outcome.winnerName
            ? `${escapeHtml(outcome.winnerName)} wins ${escapeHtml(outcome.player?.player || "the player")} for £${outcome.winningBid}m${outcome.tie ? " after a tied highest bid" : ""}.`
            : `No valid bids above £0m. ${escapeHtml(outcome.player?.player || "The player")} was skipped.`}
        </p>
        ${bidRevealRows}
        ${outcome.zeroBidNames?.length ? `<p class="muted">${escapeHtml(outcome.zeroBidNames.join(", "))} ${outcome.zeroBidNames.length === 1 ? "loses" : "lose"} one skip for bidding £0m.</p>` : ""}
        <p class="muted">Next player loading...</p>
      </div>
    `;
    return;
  }

  const canSubmit = !!me && eligibleKeys.has(myKey) && !myBid?.submitted && !state.bidSubmittingLocked;
  const myBudget = Number(me?.budget || 0);
  const mySkipsLeft = onlineBidSkipsLeftV44(me);
  const draftValue = getBlindBidDraftV39("0");

  const submitBox = canSubmit ? `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <h3>${escapeHtml(currentCandidate.player)}</h3>
      <p class="muted">Enter your bid privately. Other users will only see that you have submitted.</p>
      <div class="bid-row">
        <label for="onlineBlindBidInput">
          Your bid
          <span class="bid-help">Budget left: £${myBudget}m • Skips left: ${mySkipsLeft}/${BID_SKIPS_ALLOWED}${mySkipsLeft <= 0 ? " • must bid above £0m" : ""}</span>
        </label>
        <input id="onlineBlindBidInput" type="number" min="0" max="${myBudget}" step="1" value="${escapeHtml(draftValue)}" />
      </div>
      <button id="submitBlindBidBtn" class="btn btn-primary" type="button">Submit blind bid</button>
    </div>
  ` : `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <p class="muted">
        ${myBid?.submitted
          ? "Your bid has been submitted. Waiting for everyone else."
          : eligibleKeys.has(myKey)
            ? "Bidding is locked while results are being calculated."
            : "You are not eligible for this player because your team does not need this position, or you have no budget left."}
      </p>
    </div>
  `;

  els.bidInputs.innerHTML = submitBox + `<div class="bid-order-card"><p class="eyebrow">Submission status</p>${statusRows}</div>`;

  const bidInput = $("onlineBlindBidInput");
  if (bidInput) {
    bidInput.addEventListener("input", event => setBlindBidDraftV39(event.target.value));
    bidInput.addEventListener("change", event => setBlindBidDraftV39(event.target.value));
  }

  $("submitBlindBidBtn")?.addEventListener("click", safe(submitOnlineBlindBidV38));
}

async function submitOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();

  const me = currentOnlineUserV38();
  if (!me) throw new Error("You are not listed in this online game.");

  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(me.name);

  if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible to bid for this player.");
  if (state.blindBids?.[myKey]?.submitted) return;

  const input = $("onlineBlindBidInput");
  const rawValue = input?.value ?? getBlindBidDraftV39("0");
  const rawBid = Number(rawValue || 0);
  const bid = Math.max(0, Math.floor(rawBid));

  if (!Number.isFinite(bid)) throw new Error("Enter a valid bid.");
  if (bid > Number(me.budget || 0)) throw new Error(`Your bid cannot exceed your remaining budget of £${me.budget}m.`);
  if (bid <= 0 && onlineBidSkipsLeftV44(me) <= 0) throw new Error("You have used all 3 skips and must bid above £0m.");

  state.blindBids[myKey] = {
    name: me.name,
    bid,
    submitted: true,
    submittedAt: Date.now()
  };
  clearBlindBidDraftV39();

  const allSubmitted = eligible.every(user => state.blindBids?.[safeKey(user.name)]?.submitted);

  if (allSubmitted) {
    await resolveOnlineBlindBidV38();
  } else {
    renderOnlineBidControlsV38();
    await saveOnlineState(`${me.name} submitted a blind bid.`);
  }
}

async function resolveOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();

  state.bidSubmittingLocked = true;
  const candidate = v29NormalisePlayer(currentCandidate);
  const eligible = eligibleBidUsersV38(candidate);
  const bids = eligible.map(user => {
    const entry = state.blindBids?.[safeKey(user.name)] || { name: user.name, bid: 0, submitted: false };
    return {
      name: user.name,
      bid: Math.max(0, Math.floor(Number(entry.bid || 0))),
      budget: Number(user.budget || 0)
    };
  });

  const zeroBidNames = [];
  bids.forEach(row => {
    if (row.bid <= 0) {
      const user = state.users.find(u => safeKey(u.name) === safeKey(row.name));
      if (user) {
        onlineIncrementSkipV44(user);
        zeroBidNames.push(user.name);
      }
    }
  });

  let validBids = bids.filter(row => row.bid > 0 && row.bid <= row.budget);
  validBids.sort((a, b) => b.bid - a.bid || a.name.localeCompare(b.name));

  let winnerName = null;
  let winningBid = 0;
  let tie = false;

  if (validBids.length) {
    const highest = validBids[0].bid;
    const tied = validBids.filter(row => row.bid === highest);
    tie = tied.length > 1;
    const winnerRow = tied[Math.floor(Math.random() * tied.length)];
    winnerName = winnerRow.name;
    winningBid = winnerRow.bid;

    const winner = state.users.find(user => safeKey(user.name) === safeKey(winnerName));
    if (winner && candidate) {
      winner.team.push({ ...candidate, price: winningBid });
      winner.budget = Math.max(0, Number(winner.budget || 0) - winningBid);
      winner.spent = Number(winner.spent || 0) + winningBid;
      state.acceptedPlayerNames.add(candidate.player);
    }
  }

  state.bidOutcome = {
    player: candidate,
    bids,
    winnerName,
    winningBid,
    tie,
    zeroBidNames,
    resolvedAt: Date.now()
  };

  currentCandidate = null;
  renderOnlineBidControlsV38();
  renderTeams();
  const zeroText = zeroBidNames.length ? ` ${zeroBidNames.join(", ")} ${zeroBidNames.length === 1 ? "loses" : "lose"} one skip.` : "";
  await saveOnlineState(winnerName ? `${winnerName} won ${candidate.player} for £${winningBid}m.${zeroText}` : `${candidate.player} was skipped.${zeroText}`);

  if (isGameComplete()) {
    setTimeout(async () => {
      completeGame();
      render();
      await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
    }, 3500);
  } else {
    setTimeout(async () => {
      await drawOnlineBlindBidCandidateV38();
    }, 3500);
  }
}


// --- v45 online blind bid reserve budget rule ---
// Online bid mode only.
// A user must keep at least £1m for every remaining empty squad slot after winning the current player.
// Example: if they have £50m left and would still need 1 more player after this bid, max bid is £49m.
function onlineMinimumReserveAfterWinV45(user, candidate = currentCandidate) {
  if (!user || !candidate) return 0;
  const needs = getNeededPositions(user);
  if (!needs.includes(candidate.mainPosition)) return 0;
  // Winning this candidate fills exactly one of the needed slots.
  const remainingSlotsAfterWin = Math.max(0, needs.length - 1);
  return remainingSlotsAfterWin;
}
function onlineMaxBidForCandidateV45(user, candidate = currentCandidate) {
  const budget = Math.max(0, Math.floor(Number(user?.budget || 0)));
  const reserve = onlineMinimumReserveAfterWinV45(user, candidate);
  return Math.max(0, budget - reserve);
}
function onlineBidReserveHelpTextV45(user, candidate = currentCandidate) {
  const reserve = onlineMinimumReserveAfterWinV45(user, candidate);
  const maxBid = onlineMaxBidForCandidateV45(user, candidate);
  if (reserve > 0) {
    return `Max bid: £${maxBid}m • Keeps £${reserve}m for ${reserve} remaining player${reserve === 1 ? "" : "s"}`;
  }
  return `Max bid: £${maxBid}m`;
}
function renderOnlineBidControlsV38() {
  if (!online.enabled || !state || state.gameMode !== "bid") return;
  initialiseBlindBidStateV38();
  v29SafeState();
  show(els.draftControls, false);
  show(els.bidControls, true);
  show(els.declinesPill, false);
  show(els.budgetPill, false);
  if (els.bidPickBtn) els.bidPickBtn.classList.add("hidden");
  if (els.awardBidBtn) els.awardBidBtn.classList.add("hidden");
  if (els.skipBidBtn) els.skipBidBtn.classList.add("hidden");
  const me = currentOnlineUserV38();
  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(online.myName);
  const myBid = state.blindBids?.[myKey];
  const submittedCount = eligible.filter(user => state.blindBids?.[safeKey(user.name)]?.submitted).length;
  const totalCount = eligible.length;
  const outcome = state.bidOutcome;
  if (els.bidOrderDisplay) {
    els.bidOrderDisplay.innerHTML = `
      <div class="bid-status-summary">
        <strong>Blind bidding</strong>
        <span>${submittedCount}/${totalCount} eligible bids submitted</span>
      </div>
    `;
  }
  if (!els.bidInputs) return;
  if (!currentCandidate && isGameComplete()) {
    els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`;
    syncRevealButtonV37?.();
    return;
  }
  if (!currentCandidate && !outcome) {
    els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`;
    return;
  }
  const statusRows = state.users.map(user => {
    const key = safeKey(user.name);
    const isEligible = eligibleKeys.has(key);
    const submitted = !!state.blindBids?.[key]?.submitted;
    const budget = Number(user.budget || 0);
    const skipsLeft = onlineBidSkipsLeftV44(user);
    const maxBid = isEligible && currentCandidate ? onlineMaxBidForCandidateV45(user, currentCandidate) : 0;
    return `
      <div class="bid-row">
        <label>
          ${escapeHtml(user.name)}
          <span class="bid-help">Budget left: £${budget}m • Skips left: ${skipsLeft}/${BID_SKIPS_ALLOWED}${isEligible ? ` • Max bid: £${maxBid}m` : ""}</span>
        </label>
        <div class="bid-submit-status ${submitted ? "submitted" : "waiting"}">
          ${isEligible ? (submitted ? "Bid submitted ✅" : (skipsLeft <= 0 ? "Must bid above £0m" : "Waiting for bid")) : "Not eligible for this position"}
        </div>
      </div>
    `;
  }).join("");
  if (outcome) {
    clearBlindBidDraftV39();
    const bidRevealRows = outcome.bids.map(row => `
      <div class="bid-row">
        <label>${escapeHtml(row.name)}</label>
        <div class="bid-submit-status submitted">£${Number(row.bid || 0)}m</div>
      </div>
    `).join("");
    els.bidInputs.innerHTML = `
      <div class="bid-order-card">
        <p class="eyebrow">Bids revealed</p>
        <h3>${escapeHtml(outcome.player?.player || "Player")}</h3>
        <p class="message">
          ${outcome.winnerName
            ? `${escapeHtml(outcome.winnerName)} wins ${escapeHtml(outcome.player?.player || "the player")} for £${outcome.winningBid}m${outcome.tie ? " after a tied highest bid" : ""}.`
            : `No valid bids above £0m. ${escapeHtml(outcome.player?.player || "The player")} was skipped.`}
        </p>
        ${bidRevealRows}
        ${outcome.zeroBidNames?.length ? `<p class="muted">${escapeHtml(outcome.zeroBidNames.join(", "))} ${outcome.zeroBidNames.length === 1 ? "loses" : "lose"} one skip for bidding £0m.</p>` : ""}
        ${outcome.invalidReserveNames?.length ? `<p class="muted">${escapeHtml(outcome.invalidReserveNames.join(", "))} had bids rejected because they did not leave £1m for each remaining squad slot.</p>` : ""}
        <p class="muted">Next player loading...</p>
      </div>
    `;
    return;
  }
  const canSubmit = !!me && eligibleKeys.has(myKey) && !myBid?.submitted && !state.bidSubmittingLocked;
  const myBudget = Number(me?.budget || 0);
  const mySkipsLeft = onlineBidSkipsLeftV44(me);
  const myMaxBid = me && currentCandidate ? onlineMaxBidForCandidateV45(me, currentCandidate) : 0;
  const reserveHelp = me && currentCandidate ? onlineBidReserveHelpTextV45(me, currentCandidate) : "";
  const draftValue = getBlindBidDraftV39("0");
  const submitBox = canSubmit ? `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <h3>${escapeHtml(currentCandidate.player)}</h3>
      <p class="muted">Enter your bid privately. You must leave at least £1m for each remaining empty squad slot after this player.</p>
      <div class="bid-row">
        <label for="onlineBlindBidInput">
          Your bid
          <span class="bid-help">Budget left: £${myBudget}m • ${escapeHtml(reserveHelp)} • Skips left: ${mySkipsLeft}/${BID_SKIPS_ALLOWED}${mySkipsLeft <= 0 ? " • must bid above £0m" : ""}</span>
        </label>
        <input id="onlineBlindBidInput" type="number" min="0" max="${myMaxBid}" step="1" value="${escapeHtml(draftValue)}" />
      </div>
      <button id="submitBlindBidBtn" class="btn btn-primary" type="button">Submit blind bid</button>
    </div>
  ` : `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <p class="muted">
        ${myBid?.submitted
          ? "Your bid has been submitted. Waiting for everyone else."
          : eligibleKeys.has(myKey)
            ? "Bidding is locked while results are being calculated."
            : "You are not eligible for this player because your team does not need this position, or you have no budget left."}
      </p>
    </div>
  `;
  els.bidInputs.innerHTML = submitBox + `<div class="bid-order-card"><p class="eyebrow">Submission status</p>${statusRows}</div>`;
  const bidInput = $("onlineBlindBidInput");
  if (bidInput) {
    bidInput.addEventListener("input", event => setBlindBidDraftV39(event.target.value));
    bidInput.addEventListener("change", event => setBlindBidDraftV39(event.target.value));
  }
  $("submitBlindBidBtn")?.addEventListener("click", safe(submitOnlineBlindBidV38));
}
async function submitOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();
  const me = currentOnlineUserV38();
  if (!me) throw new Error("You are not listed in this online game.");
  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(me.name);
  if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible to bid for this player.");
  if (state.blindBids?.[myKey]?.submitted) return;
  const input = $("onlineBlindBidInput");
  const rawValue = input?.value ?? getBlindBidDraftV39("0");
  const rawBid = Number(rawValue || 0);
  const bid = Math.max(0, Math.floor(rawBid));
  if (!Number.isFinite(bid)) throw new Error("Enter a valid bid.");
  if (bid > Number(me.budget || 0)) throw new Error(`Your bid cannot exceed your remaining budget of £${me.budget}m.`);
  const maxBid = onlineMaxBidForCandidateV45(me, currentCandidate);
  const reserve = onlineMinimumReserveAfterWinV45(me, currentCandidate);
  if (bid > maxBid) {
    throw new Error(`Your maximum bid is £${maxBid}m because you must keep £${reserve}m for your remaining squad slot${reserve === 1 ? "" : "s"}.`);
  }
  if (bid <= 0 && onlineBidSkipsLeftV44(me) <= 0) throw new Error("You have used all 3 skips and must bid above £0m.");
  state.blindBids[myKey] = {
    name: me.name,
    bid,
    submitted: true,
    submittedAt: Date.now()
  };
  clearBlindBidDraftV39();
  const allSubmitted = eligible.every(user => state.blindBids?.[safeKey(user.name)]?.submitted);
  if (allSubmitted) {
    await resolveOnlineBlindBidV38();
  } else {
    renderOnlineBidControlsV38();
    await saveOnlineState(`${me.name} submitted a blind bid.`);
  }
}
async function resolveOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();
  state.bidSubmittingLocked = true;
  const candidate = v29NormalisePlayer(currentCandidate);
  const eligible = eligibleBidUsersV38(candidate);
  const bids = eligible.map(user => {
    const entry = state.blindBids?.[safeKey(user.name)] || { name: user.name, bid: 0, submitted: false };
    return {
      name: user.name,
      bid: Math.max(0, Math.floor(Number(entry.bid || 0))),
      budget: Number(user.budget || 0),
      maxBid: onlineMaxBidForCandidateV45(user, candidate)
    };
  });
  const zeroBidNames = [];
  bids.forEach(row => {
    if (row.bid <= 0) {
      const user = state.users.find(u => safeKey(u.name) === safeKey(row.name));
      if (user) {
        onlineIncrementSkipV44(user);
        zeroBidNames.push(user.name);
      }
    }
  });
  const invalidReserveNames = bids
    .filter(row => row.bid > 0 && row.bid > row.maxBid)
    .map(row => row.name);
  let validBids = bids.filter(row => row.bid > 0 && row.bid <= row.budget && row.bid <= row.maxBid);
  validBids.sort((a, b) => b.bid - a.bid || a.name.localeCompare(b.name));
  let winnerName = null;
  let winningBid = 0;
  let tie = false;
  if (validBids.length) {
    const highest = validBids[0].bid;
    const tied = validBids.filter(row => row.bid === highest);
    tie = tied.length > 1;
    const winnerRow = tied[Math.floor(Math.random() * tied.length)];
    winnerName = winnerRow.name;
    winningBid = winnerRow.bid;
    const winner = state.users.find(user => safeKey(user.name) === safeKey(winnerName));
    if (winner && candidate) {
      winner.team.push({ ...candidate, price: winningBid });
      winner.budget = Math.max(0, Number(winner.budget || 0) - winningBid);
      winner.spent = Number(winner.spent || 0) + winningBid;
      state.acceptedPlayerNames.add(candidate.player);
    }
  }
  state.bidOutcome = {
    player: candidate,
    bids,
    winnerName,
    winningBid,
    tie,
    zeroBidNames,
    invalidReserveNames,
    resolvedAt: Date.now()
  };
  currentCandidate = null;
  renderOnlineBidControlsV38();
  renderTeams();
  const zeroText = zeroBidNames.length ? ` ${zeroBidNames.join(", ")} ${zeroBidNames.length === 1 ? "loses" : "lose"} one skip.` : "";
  const reserveText = invalidReserveNames.length ? ` ${invalidReserveNames.join(", ")} had bids rejected for not leaving enough money to finish their team.` : "";
  await saveOnlineState(winnerName ? `${winnerName} won ${candidate.player} for £${winningBid}m.${zeroText}${reserveText}` : `${candidate.player} was skipped.${zeroText}${reserveText}`);
  if (isGameComplete()) {
    setTimeout(async () => {
      completeGame();
      render();
      await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
    }, 3500);
  } else {
    setTimeout(async () => {
      await drawOnlineBlindBidCandidateV38();
    }, 3500);
  }
}

function init() {
  injectEntryPanel();
  wireEvents();
  updateSetupForMode();
  loadPlayers();
}

init();

