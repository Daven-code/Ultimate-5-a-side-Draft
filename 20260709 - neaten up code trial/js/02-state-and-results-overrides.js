/* ============================================================
   02-state-and-results-overrides.js
   STATE/RESULTS OVERRIDES: safe state normalisation, smoother draft flow, reset logic, finished results, reveal controls

   Refactor note:
   This file is loaded as a normal browser script, not an ES module.
   Files must remain in the order listed in index.html because the
   original working app.js used sequential overrides.
   ============================================================ */

// --- v29 targeted local draft fix and safe state overrides ---
// These override earlier functions while preserving the existing visual layout and app structure.
function v29Array(value) {
  return Array.isArray(value) ? value : [];
}

function v29Set(value) {
  return value instanceof Set ? value : new Set(v29Array(value));
}

function v29NormalisePlayer(p, idx = 0) {
  if (!p) return null;
  const position = p.Position ?? p.position ?? p.POS ?? p.pos ?? "";
  const main = p.Main_Position ?? p.mainPosition ?? p.MainPosition ?? p.main_position ?? "";
  const player = String(p.Player ?? p.player ?? p.Name ?? p.name ?? "").trim();
  if (!player) return null;
  return {
    id: p.id ?? idx + 1,
    player,
    year: Number(p.Game_Year ?? p.year ?? p.Year ?? p.gameYear ?? 0),
    rating: Number(p.Rating_OVR ?? p.rating ?? p.OVR ?? p.ovr ?? p.Rating ?? 0),
    position: String(position || main || "").trim(),
    mainPosition: normalisePosition(main, position),
    club: String(p.Club ?? p.club ?? "").trim(),
    nation: String(p.Nation ?? p.nation ?? "").trim(),
    ...(p.price !== undefined ? { price: Number(p.price) } : {})
  };
}

function v29SafeUser(user, index = 0) {
  const team = v29Array(user?.team).map((p, i) => v29NormalisePlayer(p, i)).filter(Boolean);
  return {
    name: user?.name || `User ${index + 1}`,
    team,
    declines: Number(user?.declines || 0),
    declinedNames: v29Set(user?.declinedNames),
    budget: Number(user?.budget ?? AUCTION_BUDGET),
    spent: Number(user?.spent || 0),
    bidSkips: Number(user?.bidSkips || 0)
  };
}

function v29SafeState() {
  if (!state) return;
  state.users = v29Array(state.users).map((user, index) => v29SafeUser(user, index));
  state.userCount = state.users.length;
  state.currentUserIndex = state.users.length
    ? Math.min(Math.max(Number(state.currentUserIndex || 0), 0), state.users.length - 1)
    : 0;
  state.acceptedPlayerNames = v29Set(state.acceptedPlayerNames);
  state.history = v29Array(state.history);
  state.bidOrder = v29Array(state.bidOrder);
  state.bidRoundIndex = Number(state.bidRoundIndex || 0);
}

function serialiseState() {
  if (!state) return null;
  v29SafeState();
  return {
    ...state,
    acceptedPlayerNames: [...state.acceptedPlayerNames],
    users: state.users.map((user, index) => {
      const safeUser = v29SafeUser(user, index);
      return {
        ...safeUser,
        declinedNames: [...safeUser.declinedNames]
      };
    })
  };
}

function restoreState(raw) {
  if (!raw) return null;
  const users = v29Array(raw.users).map((user, index) => v29SafeUser(user, index));
  const safeIndex = users.length
    ? Math.min(Math.max(Number(raw.currentUserIndex || 0), 0), users.length - 1)
    : 0;
  return {
    ...raw,
    users,
    userCount: users.length,
    currentUserIndex: safeIndex,
    acceptedPlayerNames: new Set(v29Array(raw.acceptedPlayerNames)),
    history: v29Array(raw.history),
    bidOrder: v29Array(raw.bidOrder),
    bidRoundIndex: Number(raw.bidRoundIndex || 0)
  };
}

function getNeededPositions(user) {
  const safeUser = v29SafeUser(user || {}, 0);
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  safeUser.team.forEach(player => {
    const p = normalisePosition(player.mainPosition || player.position);
    if (counts[p] !== undefined) counts[p] += 1;
  });
  const needed = [];
  TEAM_SHAPE.forEach(pos => {
    if (counts[pos] > 0) counts[pos] -= 1;
    else needed.push(pos);
  });
  return needed;
}

function isGameComplete() {
  v29SafeState();
  return !!state && state.users.every(user => getNeededPositions(user).length === 0);
}

function setDraftActionButtons() {
  if (!state || state.gameMode !== "draft") return;
  const canAct = !online.enabled || currentPlayerCanAct();
  const user = currentUser();
  if (els.pickBtn) els.pickBtn.disabled = !canAct || !!currentCandidate || isGameComplete();
  if (els.acceptBtn) els.acceptBtn.disabled = !canAct || !currentCandidate;
  if (els.declineBtn) els.declineBtn.disabled = !canAct || !currentCandidate || (user?.declines || 0) >= DECLINES_ALLOWED;
}

async function pickRandomPlayer() {
  await ensurePlayersReady();
  if (!state || state.gameMode !== "draft") return;
  v29SafeState();

  if (isGameComplete()) {
    completeGame();
    return;
  }

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  if (currentCandidate) {
    setMessage("Please accept or decline the current player before picking another.");
    setDraftActionButtons();
    return;
  }

  const user = currentUser();
  if (!user) {
    setMessage("No current user found.");
    return;
  }

  const needs = getNeededPositions(user);
  if (!needs.length) {
    moveToNextUser();
    await pickRandomPlayer();
    return;
  }

  const pool = players.filter(p => {
    if (!needs.includes(p.mainPosition)) return false;
    if (state.acceptedPlayerNames.has(p.player)) return false;
    if (state.excludeDeclines && user.declinedNames.has(p.player)) return false;
    return true;
  });

  if (!pool.length) {
    clearCandidate(`No available player found for ${user.name}. They need: ${needs.join(", ")}.`);
    await saveOnlineState();
    setDraftActionButtons();
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  setMessage(`${user.name} needs: ${needs.join(", ")}`);
  render();
  setDraftActionButtons();
  await saveOnlineState();
}

async function acceptPlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  const picked = v29NormalisePlayer(currentCandidate);
  if (!picked) return;

  user.team.push(picked);
  state.acceptedPlayerNames.add(picked.player);
  state.history.push({ user: user.name, decision: "ACCEPT", player: picked });
  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
  } else {
    moveToNextUser();
    clearCandidate("Click Pick player to continue.");
  }

  render();
  setDraftActionButtons();
  await saveOnlineState();
}

async function declinePlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  if (user.declines >= DECLINES_ALLOWED) {
    setMessage(`${user.name} has no declines left and must accept this player.`);
    setDraftActionButtons();
    return;
  }

  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;

  clearCandidate("Click Pick player to try another player.");
  render();
  setDraftActionButtons();
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
  setDraftActionButtons();
  applyOnlinePermissions();
}

function buildSlots(user) {
  const safeUser = v29SafeUser(user || {}, 0);
  const mids = safeUser.team.filter(p => p.mainPosition === "MID");
  return [
    { label: "GK", player: safeUser.team.find(p => p.mainPosition === "GK") },
    { label: "DEF", player: safeUser.team.find(p => p.mainPosition === "DEF") },
    { label: "MID", player: mids[0] },
    { label: "MID", player: mids[1] },
    { label: "FWD", player: safeUser.team.find(p => p.mainPosition === "FWD") }
  ];
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
          : ""}
      </article>
    `;
  }).join("");
}

function getFinalScores() {
  if (!state || !Array.isArray(state.users)) return [];
  v29SafeState();
  return state.users
    .map((user, index) => {
      const safeUser = v29SafeUser(user, index);
      return {
        user: safeUser,
        total: safeUser.team.reduce((sum, p) => sum + Number(p.rating || 0), 0)
      };
    })
    .sort((a, b) => b.total - a.total);
}



// --- v30 smoother local draft flow overrides ---
// After Accept or Decline, immediately randomise the next eligible player so the game flows smoothly.
async function acceptPlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  const picked = v29NormalisePlayer(currentCandidate);
  if (!picked) return;

  user.team.push(picked);
  state.acceptedPlayerNames.add(picked.player);
  state.history.push({ user: user.name, decision: "ACCEPT", player: picked });
  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
    render();
    await saveOnlineState();
    return;
  }

  moveToNextUser();
  render();
  setDraftActionButtons();
  await saveOnlineState();

  // Smooth flow: automatically pick the next player for the next user's turn.
  await pickRandomPlayer();
}

async function declinePlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  if (user.declines >= DECLINES_ALLOWED) {
    setMessage(`${user.name} has no declines left and must accept this player.`);
    setDraftActionButtons();
    return;
  }

  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;

  render();
  setDraftActionButtons();
  await saveOnlineState();

  // Smooth flow: automatically pick another player for the same user's turn.
  await pickRandomPlayer();
}



// --- v32 explicit local + online draft flow overrides ---
// This fixes the v31 recursion bug. No delegation/cached function references are used.
function onlineDrawCandidateForCurrentTurnV32(messagePrefix = null) {
  if (!online.enabled || !state || state.gameMode !== "draft") return false;
  v29SafeState();

  if (isGameComplete()) {
    completeGame();
    return false;
  }

  const user = currentUser();
  if (!user) {
    setMessage("No current user found.");
    return false;
  }

  const needs = getNeededPositions(user);
  if (!needs.length) {
    moveToNextUser();
    return onlineDrawCandidateForCurrentTurnV32(messagePrefix);
  }

  const pool = players.filter(p => {
    if (!needs.includes(p.mainPosition)) return false;
    if (state.acceptedPlayerNames.has(p.player)) return false;
    if (state.excludeDeclines && user.declinedNames.has(p.player)) return false;
    return true;
  });

  if (!pool.length) {
    currentCandidate = null;
    clearCandidate(`No available player found for ${user.name}. They need: ${needs.join(", ")}.`);
    return false;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  setMessage(messagePrefix || `${user.name} needs: ${needs.join(", ")}`);
  render();
  applyOnlinePermissions();
  return true;
}

async function acceptPlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  const picked = v29NormalisePlayer(currentCandidate);
  if (!picked) return;

  user.team.push(picked);
  state.acceptedPlayerNames.add(picked.player);
  state.history.push({ user: user.name, decision: "ACCEPT", player: picked });
  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
    render();
    await saveOnlineState("Game complete. Reveal ratings to see the winner.");
    return;
  }

  moveToNextUser();

  if (online.enabled) {
    onlineDrawCandidateForCurrentTurnV32();
    await saveOnlineState();
  } else {
    // Preserve the working v30 local behaviour: automatically pick the next player.
    render();
    setDraftActionButtons();
    await saveOnlineState();
    await pickRandomPlayer();
  }
}

async function declinePlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  if (user.declines >= DECLINES_ALLOWED) {
    setMessage(`${user.name} has no declines left and must accept this player.`);
    if (online.enabled) applyOnlinePermissions();
    else setDraftActionButtons();
    return;
  }

  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;

  if (online.enabled) {
    onlineDrawCandidateForCurrentTurnV32();
    await saveOnlineState();
  } else {
    // Preserve the working v30 local behaviour: automatically pick another player for the same user.
    render();
    setDraftActionButtons();
    await saveOnlineState();
    await pickRandomPlayer();
  }
}



// --- v33 finished-results page and improved share/save image overrides ---
function injectFinishedStylesV33() {
  if ($("finishedResultsStylesV33")) return;
  const style = document.createElement("style");
  style.id = "finishedResultsStylesV33";
  style.textContent = `
    .results-card.finished-results-page {
      max-width: 1180px;
      margin: 24px auto;
      animation: finishedPop .35s ease-out;
    }
    @keyframes finishedPop {
      from { transform: translateY(10px); opacity: .3; }
      to { transform: translateY(0); opacity: 1; }
    }
    .finished-hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
      padding: 18px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(34,197,94,.16), rgba(14,165,233,.14));
      border: 1px solid rgba(255,255,255,.35);
      margin-bottom: 18px;
    }
    .finished-hero h2 {
      margin: 4px 0 6px;
      font-size: clamp(2rem, 5vw, 3.4rem);
    }
    .winner-badge-large {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 999px;
      background: #fef3c7;
      color: #92400e;
      font-weight: 950;
      box-shadow: 0 12px 28px rgba(146,64,14,.18);
      white-space: nowrap;
    }
    .finished-results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .finished-team-card {
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(226,232,240,.95);
      border-radius: 22px;
      padding: 16px;
      box-shadow: 0 18px 48px rgba(15,23,42,.12);
    }
    .finished-team-card.winner {
      border-color: #f59e0b;
      box-shadow: 0 18px 52px rgba(245,158,11,.22);
    }
    .finished-team-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .finished-rank {
      font-weight: 950;
      color: #64748b;
      font-size: .86rem;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .finished-score {
      font-weight: 950;
      font-size: 2rem;
      line-height: 1;
      color: #0f172a;
    }
    .finished-player-list {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }
    .finished-player-row {
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 8px 10px;
    }
    .finished-pos {
      font-weight: 950;
      color: #166534;
      background: #dcfce7;
      border-radius: 999px;
      text-align: center;
      padding: 4px 0;
      font-size: .78rem;
    }
    .finished-player-name {
      font-weight: 900;
      color: #0f172a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .finished-player-meta {
      font-size: .78rem;
      color: #64748b;
      font-weight: 750;
    }
    .finished-player-rating {
      font-weight: 950;
      color: #1d4ed8;
    }
    .finished-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    @media (max-width: 720px) {
      .finished-hero { grid-template-columns: 1fr; }
      .finished-actions { justify-content: stretch; }
      .finished-actions .btn { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

function removeTurnLockNoteV33() {
  const note = $("turnLockNote");
  if (note) note.remove();
}

function playerRoleForFinishedV33(player) {
  return player?.mainPosition || player?.position || "";
}

function showFinishedResultsPageV33() {
  if (!state) return;
  injectFinishedStylesV33();
  ratingsRevealed = true;
  currentCandidate = null;
  removeTurnLockNoteV33();
  setMessage("");

  show($("gameEntryPanel"), false);
  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, false);
  show(els.resultsPanel, true);

  if (els.resultsPanel) els.resultsPanel.classList.add("finished-results-page");
  if (els.revealBtn) els.revealBtn.classList.add("hidden");
  if (els.pickBtn) els.pickBtn.disabled = true;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
  if (els.bidPickBtn) els.bidPickBtn.disabled = true;
  if (els.awardBidBtn) els.awardBidBtn.disabled = true;
  if (els.skipBidBtn) els.skipBidBtn.disabled = true;

  renderResults();
  setTimeout(() => els.resultsPanel?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
}

function renderResults() {
  if (!els.resultsContainer || !state) return;
  const scored = getFinalScores();
  const top = scored[0]?.total ?? 0;
  const winnerNames = scored.filter(row => row.total === top).map(row => row.user.name).join(" & ");

  const header = document.querySelector("#resultsPanel .section-title-row");
  if (header) {
    header.innerHTML = `
      <div class="finished-hero">
        <div>
          <p class="eyebrow">Full time</p>
          <h2>Final results</h2>
          <p class="muted">The draft is complete. Ratings are now revealed and the winner is confirmed.</p>
          <div class="winner-badge-large">🏆 Winner: ${escapeHtml(winnerNames || "TBC")} (${top})</div>
        </div>
        <div class="finished-actions">
          <button id="shareSummaryBtn" class="btn btn-primary">Share summary</button>
          <button id="saveSummaryBtn" class="btn btn-secondary">Save picture</button>
          <button id="resetBtnResults" class="btn btn-secondary">New game</button>
        </div>
      </div>
    `;
    $("shareSummaryBtn")?.addEventListener("click", safe(shareSummaryImage));
    $("saveSummaryBtn")?.addEventListener("click", safe(saveSummaryImage));
    $("resetBtnResults")?.addEventListener("click", resetGame);
  }

  els.resultsContainer.className = "finished-results-grid";
  els.resultsContainer.innerHTML = scored.map((row, index) => {
    const isWinner = row.total === top;
    const team = Array.isArray(row.user.team) ? row.user.team : [];
    return `
      <article class="finished-team-card ${isWinner ? "winner" : ""}">
        <div class="finished-team-top">
          <div>
            <div class="finished-rank">${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} place ${isWinner ? "🏆" : ""}</div>
            <h3>${escapeHtml(row.user.name)}</h3>
          </div>
          <div class="finished-score">${row.total}</div>
        </div>
        ${renderPitch(buildSlots(row.user))}
        <div class="finished-player-list">
          ${team.map(player => `
            <div class="finished-player-row">
              <span class="finished-pos">${escapeHtml(playerRoleForFinishedV33(player))}</span>
              <span>
                <span class="finished-player-name">${escapeHtml(player.player)}</span>
                <span class="finished-player-meta">${escapeHtml(shortenClub(player.club))}${player.year ? ` • ${player.year}` : ""}</span>
              </span>
              <span class="finished-player-rating">${player.rating}</span>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

async function revealScores() {
  ratingsRevealed = true;
  currentCandidate = null;
  showFinishedResultsPageV33();
  await saveOnlineState("Scores revealed.");
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
  else clearCandidate(data.message || "Waiting for the next action...");
  renderTeams();
  setMessage(data.message || "");
  applyingRemote = false;
  applyOnlinePermissions();
}

function fitTextV33(ctx, text, x, y, maxWidth, font, color = "#0f172a") {
  ctx.font = font;
  ctx.fillStyle = color;
  let output = String(text || "");
  while (output.length > 3 && ctx.measureText(output).width > maxWidth) {
    output = output.slice(0, -2) + "…";
  }
  ctx.fillText(output, x, y);
}

function roundRectV33(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function createSummaryCanvas() {
  const scored = getFinalScores();
  const teamCount = Math.max(scored.length, 1);
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = Math.max(980, 290 + teamCount * 220);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#052e16");
  bg.addColorStop(.48, "#0f172a");
  bg.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.arc(120 + i * 110, 90 + (i % 3) * 60, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 64px Arial";
  ctx.fillText("Ultimate 5-a-side Draft", 70, 90);
  ctx.font = "800 34px Arial";
  ctx.fillStyle = "#d1fae5";
  ctx.fillText("Final results", 72, 138);

  const winner = scored[0];
  if (winner) {
    ctx.fillStyle = "#fef3c7";
    roundRectV33(ctx, 70, 165, 1460, 82, 26);
    ctx.fill();
    ctx.fillStyle = "#92400e";
    ctx.font = "900 38px Arial";
    ctx.fillText(`🏆 Winner: ${winner.user.name}  •  ${winner.total} points`, 105, 218);
  }

  const x = 70;
  let y = 285;
  const cardW = 1460;
  const cardH = 190;
  const topScore = winner?.total ?? 0;

  scored.forEach((row, idx) => {
    const isWinner = row.total === topScore;
    ctx.fillStyle = isWinner ? "rgba(254,243,199,0.98)" : "rgba(255,255,255,0.94)";
    roundRectV33(ctx, x, y, cardW, cardH, 28);
    ctx.fill();

    ctx.strokeStyle = isWinner ? "#f59e0b" : "rgba(226,232,240,.95)";
    ctx.lineWidth = isWinner ? 6 : 2;
    ctx.stroke();

    ctx.fillStyle = isWinner ? "#92400e" : "#475569";
    ctx.font = "900 28px Arial";
    ctx.fillText(`#${idx + 1}`, x + 32, y + 50);

    fitTextV33(ctx, row.user.name, x + 105, y + 52, 470, "900 38px Arial", "#0f172a");

    ctx.fillStyle = "#1d4ed8";
    ctx.font = "900 52px Arial";
    ctx.fillText(String(row.total), x + cardW - 145, y + 60);
    ctx.font = "800 20px Arial";
    ctx.fillStyle = "#64748b";
    ctx.fillText("TOTAL", x + cardW - 145, y + 88);

    const team = Array.isArray(row.user.team) ? row.user.team : [];
    const startX = x + 30;
    const rowY = y + 104;
    const slotW = 270;
    team.slice(0, 5).forEach((p, i) => {
      const px = startX + i * (slotW + 12);
      ctx.fillStyle = "#f8fafc";
      roundRectV33(ctx, px, rowY, slotW, 62, 16);
      ctx.fill();
      ctx.strokeStyle = "#dbeafe";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#166534";
      roundRectV33(ctx, px + 10, rowY + 11, 46, 40, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 16px Arial";
      ctx.fillText(playerRoleForFinishedV33(p).slice(0, 3), px + 16, rowY + 37);

      fitTextV33(ctx, p.player, px + 66, rowY + 31, 150, "900 18px Arial", "#0f172a");
      fitTextV33(ctx, `${shortenClub(p.club)}${p.year ? " • " + p.year : ""}`, px + 66, rowY + 52, 150, "700 14px Arial", "#64748b");
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "900 24px Arial";
      ctx.fillText(String(p.rating || ""), px + 224, rowY + 38);
    });

    y += cardH + 28;
  });

  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = "700 22px Arial";
  ctx.fillText("Generated from Ultimate 5-a-side Draft", 70, canvas.height - 45);

  return canvas;
}



// --- v34 online turn ownership override ---
// Host can still create/start the room, but cannot accept/decline/pick on behalf of another user.
// Only the player whose name matches the current turn can control that turn.
function currentPlayerCanAct() {
  if (!online.enabled) return true;
  const user = currentUser();
  return !!(user && safeKey(user.name) === safeKey(online.myName));
}

function applyOnlinePermissions() {
  if (!online.enabled || !state) return;

  const user = currentUser();
  const canAct = currentPlayerCanAct();

  let note = $("turnLockNote");

  if (!note && els.message) {
    note = document.createElement("div");
    note.id = "turnLockNote";
    note.className = "turn-lock-note";
    els.message.insertAdjacentElement("afterend", note);
  }

  if (note) {
    note.textContent = canAct
      ? `It is your turn, ${online.myName}.`
      : `Waiting for ${user?.name || "the current player"}. You joined as ${online.myName}.`;
  }

  if (state.gameMode === "draft") {
    if (els.pickBtn) els.pickBtn.disabled = !canAct || !!currentCandidate || isGameComplete();
    if (els.acceptBtn) els.acceptBtn.disabled = !canAct || !currentCandidate;
    if (els.declineBtn) els.declineBtn.disabled = !canAct || !currentCandidate || (currentUser()?.declines || 0) >= DECLINES_ALLOWED;
  }
}



// --- v35 full reset-to-front-page override ---
// This reset fully exits online/local game state and returns to the initial front page.
function resetGame() {
  try {
    if (online.ref && online.subscribed && typeof online.ref.off === "function") {
      online.ref.off();
    }
  } catch (err) {
    console.warn("Could not detach Firebase listener during reset", err);
  }

  state = null;
  currentCandidate = null;
  ratingsRevealed = false;
  applyingRemote = false;

  online.enabled = false;
  online.isHost = false;
  online.roomId = null;
  online.ref = null;
  online.myName = "";
  online.subscribed = false;

  const turnNote = $("turnLockNote");
  if (turnNote) turnNote.remove();

  if (els.message) els.message.textContent = "";
  if (els.candidateCard) clearCandidate("Click “Pick player” to begin.");
  if (els.teamsContainer) els.teamsContainer.innerHTML = "";
  if (els.resultsContainer) els.resultsContainer.innerHTML = "";
  if (els.resultsPanel) els.resultsPanel.classList.remove("finished-results-page");

  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, false);
  show(els.resultsPanel, false);

  injectEntryPanel();
  show($("gameEntryPanel"), true);

  const onlineName = $("onlineRoomName");
  const roomCode = $("joinRoomCode");
  const onlineStatus = $("onlineRoomStatus");
  const onlineLink = $("onlineRoomLink");
  if (onlineName) onlineName.value = "";
  if (roomCode) roomCode.value = "";
  if (onlineStatus) onlineStatus.textContent = "Online games use joined player names automatically.";
  if (onlineLink) {
    onlineLink.textContent = "";
    onlineLink.classList.add("hidden");
  }

  if (els.revealBtn) els.revealBtn.classList.add("hidden");
  if (els.pickBtn) els.pickBtn.disabled = false;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
  if (els.bidPickBtn) els.bidPickBtn.disabled = false;
  if (els.awardBidBtn) els.awardBidBtn.disabled = true;
  if (els.skipBidBtn) els.skipBidBtn.disabled = true;

  // If the user arrived via an online room link, remove ?room=... so reset feels like a true new start.
  try {
    if (window.history && window.location.search) {
      window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
    }
  } catch (err) {
    console.warn("Could not clear room URL during reset", err);
  }

  selectedGameMode = "draft";
  updateSetupForMode();
}



// --- v36 improved 4-player results layout override ---
// Keeps the v35 behaviour but makes the finished results page use a roomier 2-column layout on desktop.
function injectResultsLayoutStylesV36() {
  if ($("finishedResultsLayoutStylesV36")) return;
  const style = document.createElement("style");
  style.id = "finishedResultsLayoutStylesV36";
  style.textContent = `
    .results-card.finished-results-page {
      max-width: 1320px !important;
      width: min(1320px, calc(100vw - 32px));
    }

    .finished-results-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(420px, 1fr)) !important;
      gap: 24px !important;
      align-items: start;
    }

    .finished-team-card {
      min-width: 0;
      padding: 20px !important;
    }

    .finished-team-card .pitch {
      min-height: 360px;
    }

    .finished-player-list {
      gap: 10px !important;
    }

    .finished-player-row {
      grid-template-columns: 52px minmax(0, 1fr) 44px !important;
      min-width: 0;
    }

    .finished-player-name,
    .finished-player-meta {
      display: block;
      min-width: 0;
    }

    @media (max-width: 980px) {
      .finished-results-grid {
        grid-template-columns: 1fr !important;
      }

      .results-card.finished-results-page {
        width: min(760px, calc(100vw - 24px));
      }
    }
  `;
  document.head.appendChild(style);
}

function showFinishedResultsPageV33() {
  if (!state) return;
  injectFinishedStylesV33();
  injectResultsLayoutStylesV36();
  ratingsRevealed = true;
  currentCandidate = null;
  removeTurnLockNoteV33();
  setMessage("");

  show($("gameEntryPanel"), false);
  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, false);
  show(els.resultsPanel, true);

  if (els.resultsPanel) els.resultsPanel.classList.add("finished-results-page");
  if (els.revealBtn) els.revealBtn.classList.add("hidden");
  if (els.pickBtn) els.pickBtn.disabled = true;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
  if (els.bidPickBtn) els.bidPickBtn.disabled = true;
  if (els.awardBidBtn) els.awardBidBtn.disabled = true;
  if (els.skipBidBtn) els.skipBidBtn.disabled = true;

  renderResults();
  setTimeout(() => els.resultsPanel?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
}



// --- v37 allow any online user to reveal final results ---
// Once all teams are complete, every joined online user sees and can click Reveal ratings.
function syncRevealButtonV37() {
  if (!state || !els.revealBtn) return;
  if (ratingsRevealed) {
    els.revealBtn.classList.add("hidden");
    els.revealBtn.disabled = true;
    return;
  }
  const complete = isGameComplete();
  els.revealBtn.classList.toggle("hidden", !complete);
  els.revealBtn.disabled = !complete;
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
  setDraftActionButtons();
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
  setMessage(data.message || "");
  applyingRemote = false;
  applyOnlinePermissions();
  syncRevealButtonV37();
}

function completeGame() {
  currentCandidate = null;
  clearCandidate("Game complete. Reveal ratings to see the winner.");
  syncRevealButtonV37();
  if (els.pickBtn) els.pickBtn.disabled = true;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
  saveOnlineState("Game complete. Reveal ratings to see the winner.");
}



