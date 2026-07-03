const DECLINES_ALLOWED = 3;
const AUCTION_BUDGET = 100;
const BID_SKIPS_ALLOWED = 3;
let selectedGameMode = "draft";

const samplePlayers = [
  { Player: "Lionel Messi", Game_Year: 2012, Rating_OVR: 94, Position: "CF", Main_Position: "FWD", Club: "FC Barcelona", Nation: "Argentina" },
  { Player: "Cristiano Ronaldo", Game_Year: 2012, Rating_OVR: 92, Position: "LW", Main_Position: "FWD", Club: "Real Madrid", Nation: "Portugal" },
  { Player: "Gianluigi Buffon", Game_Year: 2005, Rating_OVR: 97, Position: "GK", Main_Position: "GK", Club: "Juventus", Nation: "Italy" },
  { Player: "Iker Casillas", Game_Year: 2009, Rating_OVR: 91, Position: "GK", Main_Position: "GK", Club: "Real Madrid C.F.", Nation: "Spain" },
  { Player: "Sergio Ramos", Game_Year: 2015, Rating_OVR: 87, Position: "CB", Main_Position: "DEF", Club: "Real Madrid", Nation: "Spain" },
  { Player: "Virgil van Dijk", Game_Year: 2020, Rating_OVR: 90, Position: "CB", Main_Position: "DEF", Club: "Liverpool", Nation: "Netherlands" },
  { Player: "Xavi", Game_Year: 2012, Rating_OVR: 92, Position: "CM", Main_Position: "MID", Club: "FC Barcelona", Nation: "Spain" },
  { Player: "Andrés Iniesta", Game_Year: 2013, Rating_OVR: 90, Position: "CAM", Main_Position: "MID", Club: "FC Barcelona", Nation: "Spain" },
  { Player: "Kevin De Bruyne", Game_Year: 2021, Rating_OVR: 91, Position: "CM", Main_Position: "MID", Club: "Manchester City", Nation: "Belgium" },
  { Player: "Thierry Henry", Game_Year: 2005, Rating_OVR: 97, Position: "ST", Main_Position: "FWD", Club: "Arsenal", Nation: "France" }
];

let players = [];
let state = null;
let currentCandidate = null;
let ratingsRevealed = false;


// ============================== 
// Online room support - Firebase Realtime Database
// ==============================
// 1) Create a Firebase project, then create a Realtime Database.
// 2) Replace the placeholder values below with your Firebase web app config.
// 3) For testing only, use temporary database rules. Lock this down before wider sharing.
const FIREBASE_CONFIG = {
  apiKey: "PASTE_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PASTE_DATABASE_NAME.europe-west1.firebasedatabase.app",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

const online = {
  enabled: false,
  isHost: false,
  roomId: null,
  ref: null,
  applyingRemote: false,
  loaded: false
};

function firebaseConfigured() {
  return FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("PASTE_") && FIREBASE_CONFIG.databaseURL && !FIREBASE_CONFIG.databaseURL.includes("PASTE_");
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(script => script.src === src)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensureFirebase() {
  if (!firebaseConfigured()) throw new Error("Firebase has not been configured yet. Paste your Firebase config into app.js first.");
  if (online.loaded) return;
  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js");
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  online.loaded = true;
}


function injectOnlineStyles() {
  if (document.getElementById("onlineRoomStyles")) return;
  const style = document.createElement("style");
  style.id = "onlineRoomStyles";
  style.textContent = `
    .online-room-panel { margin-bottom: 18px; }
    .online-room-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 14px; display: grid; gap: 10px; }
    .online-room-actions { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
    .online-room-status { margin: 2px 0 0; color: #475569; font-weight: 800; font-size: .88rem; line-height: 1.35; }
    .online-room-link { margin: 0; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; border-radius: 12px; padding: 9px 10px; font-weight: 900; overflow-wrap: anywhere; }
    @media (max-width: 620px) { .online-room-actions { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

function injectOnlinePanel() {
  injectOnlineStyles();
  const setupCard = document.querySelector(".setup-panel-card") || els.setupPanel;
  if (!setupCard || document.getElementById("onlineRoomPanel")) return;
  const panel = document.createElement("div");
  panel.id = "onlineRoomPanel";
  panel.className = "online-room-panel";
  panel.innerHTML = `
    <label>Online room</label>
    <div class="online-room-box">
      <div class="online-room-actions">
        <input id="onlineRoomName" type="text" placeholder="Your name" />
        <button id="createOnlineRoomBtn" type="button" class="btn btn-secondary">Create online room</button>
      </div>
      <div class="online-room-actions">
        <input id="joinRoomCode" type="text" placeholder="Room code" />
        <button id="joinOnlineRoomBtn" type="button" class="btn btn-secondary">Join room</button>
      </div>
      <p id="onlineRoomStatus" class="online-room-status">Online rooms need Firebase configured in app.js. Local play still works normally.</p>
      <p id="onlineRoomLink" class="online-room-link"></p>
    </div>`;
  setupCard.insertBefore(panel, setupCard.firstChild);

  document.getElementById("createOnlineRoomBtn").addEventListener("click", createOnlineRoom);
  document.getElementById("joinOnlineRoomBtn").addEventListener("click", () => joinOnlineRoom(document.getElementById("joinRoomCode").value.trim().toUpperCase()));

  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  if (room) {
    document.getElementById("joinRoomCode").value = room.toUpperCase();
    setOnlineStatus(`Room code detected: ${room.toUpperCase()}. Add your name, then click Join room.`);
  }
}

function setOnlineStatus(text) {
  const el = document.getElementById("onlineRoomStatus");
  if (el) el.textContent = text;
}

function setOnlineLink(text) {
  const el = document.getElementById("onlineRoomLink");
  if (el) el.textContent = text;
}

function roomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function createOnlineRoom() {
  try {
    await ensureFirebase();
    online.enabled = true;
    online.isHost = true;
    online.roomId = roomId();
    online.ref = firebase.database().ref(`rooms/${online.roomId}`);
    const invite = `${location.origin}${location.pathname}?room=${online.roomId}`;
    await online.ref.set({
      createdAt: Date.now(),
      hostName: document.getElementById("onlineRoomName")?.value?.trim() || "Host",
      state: null,
      currentCandidate: null,
      ratingsRevealed: false,
      message: "Room created. Host can now set up and start the game."
    });
    subscribeToRoom();
    setOnlineStatus(`Online room created. You are the host. Room code: ${online.roomId}`);
    setOnlineLink(`Share this link: ${invite}`);
  } catch (err) {
    setOnlineStatus(err.message);
  }
}

async function joinOnlineRoom(code) {
  try {
    if (!code) throw new Error("Enter a room code first.");
    await ensureFirebase();
    online.enabled = true;
    online.isHost = false;
    online.roomId = code;
    online.ref = firebase.database().ref(`rooms/${online.roomId}`);
    subscribeToRoom();
    setOnlineStatus(`Joined room ${online.roomId}. The host controls the game and your screen will update live.`);
    setOnlineLink("");
  } catch (err) {
    setOnlineStatus(err.message);
  }
}

function subscribeToRoom() {
  if (!online.ref) return;
  online.ref.off();
  online.ref.on("value", snapshot => {
    const data = snapshot.val();
    if (!data || online.applyingRemote || online.isHost) return;
    applyRemoteData(data);
  });
}

function serialiseState() {
  if (!state) return null;
  return {
    ...state,
    acceptedPlayerNames: [...state.acceptedPlayerNames],
    users: state.users.map(user => ({
      ...user,
      declinedNames: [...user.declinedNames]
    }))
  };
}

function restoreState(raw) {
  if (!raw) return null;
  return {
    ...raw,
    acceptedPlayerNames: new Set(raw.acceptedPlayerNames || []),
    users: (raw.users || []).map(user => ({
      ...user,
      declinedNames: new Set(user.declinedNames || [])
    }))
  };
}

async function saveOnlineState(messageOverride = null) {
  if (!online.enabled || !online.isHost || !online.ref || online.applyingRemote) return;
  await online.ref.update({
    updatedAt: Date.now(),
    state: serialiseState(),
    currentCandidate,
    ratingsRevealed,
    message: messageOverride ?? els.message.textContent ?? ""
  });
}

function applyRemoteData(data) {
  online.applyingRemote = true;
  state = restoreState(data.state);
  currentCandidate = data.currentCandidate || null;
  ratingsRevealed = !!data.ratingsRevealed;

  if (!state) {
    setOnlineStatus(data.message || `Connected to room ${online.roomId}. Waiting for the host to start.`);
    online.applyingRemote = false;
    return;
  }

  els.setupPanel.classList.add("hidden");
  els.gamePanel.classList.remove("hidden");
  if (ratingsRevealed) els.resultsPanel.classList.remove("hidden");
  else els.resultsPanel.classList.add("hidden");

  updateGameControls();
  render();
  if (currentCandidate) renderCandidate(currentCandidate);
  else clearCandidate(data.message || "Waiting for the host...");
  if (ratingsRevealed) renderResults();
  els.message.textContent = data.message || "";
  applyOnlineControlLock();
  online.applyingRemote = false;
}

function applyOnlineControlLock() {
  if (!online.enabled || online.isHost) return;
  [els.pickBtn, els.acceptBtn, els.declineBtn, els.bidPickBtn, els.awardBidBtn, els.skipBidBtn, els.revealBtn].forEach(btn => {
    if (btn) btn.disabled = true;
  });
}


const els = {
  setupPanel: document.getElementById("setupPanel"),
  gamePanel: document.getElementById("gamePanel"),
  resultsPanel: document.getElementById("resultsPanel"),
  gameModeCards: document.getElementById("gameModeCards"),
  gameModeDescription: document.getElementById("gameModeDescription"),
  userCount: document.getElementById("userCount"),
  userNameFields: document.getElementById("userNameFields"),
  excludeDeclines: document.getElementById("excludeDeclines"),
  excludeDeclinesLabel: document.getElementById("excludeDeclinesLabel"),
  startBtn: document.getElementById("startBtn"),
  resetBtn: document.getElementById("resetBtn"),
  pickBtn: document.getElementById("pickBtn"),
  acceptBtn: document.getElementById("acceptBtn"),
  declineBtn: document.getElementById("declineBtn"),
  revealBtn: document.getElementById("revealBtn"),
  shareSummaryBtn: document.getElementById("shareSummaryBtn"),
  saveSummaryBtn: document.getElementById("saveSummaryBtn"),
  draftControls: document.getElementById("draftControls"),
  bidControls: document.getElementById("bidControls"),
  bidPickBtn: document.getElementById("bidPickBtn"),
  awardBidBtn: document.getElementById("awardBidBtn"),
  skipBidBtn: document.getElementById("skipBidBtn"),
  bidInputs: document.getElementById("bidInputs"),
  bidOrderDisplay: document.getElementById("bidOrderDisplay"),
  turnEyebrow: document.getElementById("turnEyebrow"),
  currentUserLabel: document.getElementById("currentUserLabel"),
  declinesPill: document.getElementById("declinesPill"),
  declinesLeft: document.getElementById("declinesLeft"),
  budgetPill: document.getElementById("budgetPill"),
  currentBudgetLeft: document.getElementById("currentBudgetLeft"),
  candidateCard: document.getElementById("candidateCard"),
  message: document.getElementById("message"),
  teamsContainer: document.getElementById("teamsContainer"),
  resultsContainer: document.getElementById("resultsContainer"),
  loadStatus: document.getElementById("loadStatus")
};

async function loadPlayers() {
  try {
    const response = await fetch("players.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    players = normalisePlayers(await response.json());
  } catch (err) {
    players = normalisePlayers(samplePlayers);
    if (els.loadStatus) {
      els.loadStatus.textContent = "Using fallback sample players. Run via Live Server/GitHub Pages and keep players.json in the folder.";
      els.loadStatus.style.display = "block";
    }
  }
}

function normalisePlayers(data) {
  return data.map((p, idx) => ({
    id: idx + 1,
    player: p.Player ?? p.player,
    year: Number(p.Game_Year ?? p.year),
    rating: Number(p.Rating_OVR ?? p.rating),
    position: p.Position ?? p.position,
    mainPosition: p.Main_Position ?? p.mainPosition,
    club: p.Club ?? p.club ?? "",
    nation: p.Nation ?? p.nation ?? ""
  })).filter(p => p.player && p.mainPosition && p.rating);
}

function updateSetupForMode() {
  const mode = selectedGameMode;
  document.querySelectorAll(".game-mode-card").forEach(card => card.classList.toggle("selected", card.dataset.mode === mode));
  els.userCount.innerHTML = "";
  const minUsers = mode === "bid" ? 2 : 1;
  for (let i = minUsers; i <= 4; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i} user${i > 1 ? "s" : ""}`;
    els.userCount.appendChild(opt);
  }
  els.gameModeDescription.textContent = mode === "bid"
    ? "Each user starts with £100m. Bid for random players and complete a GK, DEF, MID, MID and FWD."
    : "Classic draft mode. Accept or decline random players to complete your team.";
  els.excludeDeclinesLabel.classList.toggle("hidden", mode === "bid");
  renderUserNameInputs();
}

function renderUserNameInputs() {
  const count = Number(els.userCount.value || 1);
  els.userNameFields.innerHTML = Array.from({ length: count }, (_, i) => `
    <div>
      <label for="userName${i}">User ${i + 1} name</label>
      <input id="userName${i}" type="text" value="User ${i + 1}" placeholder="User ${i + 1}" />
    </div>
  `).join("");
}

function getUserNames(userCount) {
  return Array.from({ length: userCount }, (_, i) => {
    const value = document.getElementById(`userName${i}`)?.value?.trim();
    return value || `User ${i + 1}`;
  });
}

function startGame() {
  const gameMode = selectedGameMode;
  const userCount = Number(els.userCount.value);
  const names = getUserNames(userCount);
  ratingsRevealed = false;
  currentCandidate = null;
  state = {
    gameMode,
    userCount,
    currentUserIndex: 0,
    excludeDeclines: gameMode === "draft" && els.excludeDeclines.checked,
    users: Array.from({ length: userCount }, (_, i) => ({
      name: names[i], team: [], declines: 0, declinedNames: new Set(), budget: AUCTION_BUDGET, spent: 0, bidSkips: 0
    })),
    acceptedPlayerNames: new Set(),
    history: [],
    bidOrder: [],
    bidRoundIndex: 0
  };

  if (gameMode === "draft") {
    state.users = shuffleArray(state.users);
    state.currentUserIndex = 0;
  }
  if (gameMode === "bid") {
    state.bidOrder = shuffleArray([...Array(userCount).keys()]);
    state.currentUserIndex = state.bidOrder[0];
  }

  els.setupPanel.classList.add("hidden");
  els.gamePanel.classList.remove("hidden");
  els.resultsPanel.classList.add("hidden");
  els.revealBtn.classList.add("hidden");
  updateGameControls();
  clearCandidate(gameMode === "bid" ? "Click “Randomise player” to start the auction." : "Click “Pick player” to begin.");
  render();
  saveOnlineState("Game started.");
}

function resetGame() {
  state = null;
  currentCandidate = null;
  ratingsRevealed = false;
  els.setupPanel.classList.remove("hidden");
  els.gamePanel.classList.add("hidden");
  els.resultsPanel.classList.add("hidden");
  els.message.textContent = "";
  updateSetupForMode();
}

function updateGameControls() {
  const isBid = state?.gameMode === "bid";
  els.turnEyebrow.textContent = isBid ? "Current nominator" : "Current turn";
  els.draftControls.classList.toggle("hidden", isBid);
  els.bidControls.classList.toggle("hidden", !isBid);
  els.declinesPill.classList.toggle("hidden", isBid);
  els.budgetPill.classList.toggle("hidden", !isBid);
}

function currentUser() { return state.users[state.currentUserIndex]; }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

function getNeededPositions(user) {
  const needs = [];
  const count = pos => user.team.filter(p => p.mainPosition === pos).length;
  if (count("GK") < 1) needs.push("GK");
  if (count("DEF") < 1) needs.push("DEF");
  if (count("MID") < 2) needs.push("MID");
  if (count("FWD") < 1) needs.push("FWD");
  return needs;
}

function pickRandomPlayer() {
  if (!state || state.gameMode !== "draft" || isGameComplete()) return;

  // FIX: once a player is showing, do not allow unlimited re-randomising via the Pick Player button.
  if (currentCandidate) {
    els.message.textContent = "Please accept or decline the current player before picking another.";
    return;
  }

  const user = currentUser();
  const needs = getNeededPositions(user);
  if (needs.length === 0) { moveToNextUser(); return pickRandomPlayer(); }

  const pool = players.filter(p => {
    if (!needs.includes(p.mainPosition)) return false;
    if (state.acceptedPlayerNames.has(p.player)) return false;
    if (state.excludeDeclines && user.declinedNames.has(p.player)) return false;
    return true;
  });
  if (pool.length === 0) {
    clearCandidate("No available player for the positions this user still needs.");
    return;
  }
  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  els.pickBtn.disabled = true;
  els.acceptBtn.disabled = false;
  els.declineBtn.disabled = user.declines >= DECLINES_ALLOWED;
  els.message.textContent = user.declines >= DECLINES_ALLOWED
    ? `${user.name} has used all 3 declines and must accept this player.`
    : `${user.name} needs: ${needs.join(", ")}`;
  saveOnlineState();
}

function acceptPlayer() {
  if (!currentCandidate || !state || state.gameMode !== "draft") return;
  const user = currentUser();
  if (!getNeededPositions(user).includes(currentCandidate.mainPosition)) { currentCandidate = null; pickRandomPlayer(); return; }
  if (state.acceptedPlayerNames.has(currentCandidate.player)) { currentCandidate = null; pickRandomPlayer(); return; }
  user.team.push(currentCandidate);
  state.acceptedPlayerNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "ACCEPT", player: currentCandidate });
  currentCandidate = null;
  if (isGameComplete()) completeGame(); else { moveToNextUser(); pickRandomPlayer(); }
  render();
  saveOnlineState();
}

function declinePlayer() {
  if (!currentCandidate || !state || state.gameMode !== "draft") return;
  const user = currentUser();
  if (user.declines >= DECLINES_ALLOWED) {
    els.message.textContent = `${user.name} has no declines left and must accept this player.`;
    els.declineBtn.disabled = true;
    return;
  }
  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;
  pickRandomPlayer();
  render();
  saveOnlineState();
}

function bidRandomPlayer() {
  if (!state || state.gameMode !== "bid" || isGameComplete()) return;
  if (currentCandidate) { els.message.textContent = "Award or skip the current player before randomising another."; return; }
  ensureCurrentNominatorCanNominate();
  const nominator = currentUser();
  const needs = getNeededPositions(nominator);
  const pool = players.filter(p => {
    if (!needs.includes(p.mainPosition)) return false;
    if (state.acceptedPlayerNames.has(p.player)) return false;
    return state.users.some(u => getNeededPositions(u).includes(p.mainPosition) && u.budget > 0);
  });
  if (pool.length === 0) { clearCandidate("No available player for the current nominator. Rotating nominator."); rotateBidNominator(); render(); return; }
  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  renderBidInputs();
  els.awardBidBtn.disabled = false;
  els.skipBidBtn.disabled = false;
  els.message.textContent = `${nominator.name} nominated a ${currentCandidate.mainPosition}. Enter bids in £m.`;
  saveOnlineState();
}

function renderBidInputs() {
  if (!currentCandidate || state.gameMode !== "bid") { els.bidInputs.innerHTML = ""; return; }
  els.bidInputs.innerHTML = state.users.map((user, index) => {
    const needsPosition = getNeededPositions(user).includes(currentCandidate.mainPosition);
    const isComplete = getNeededPositions(user).length === 0;
    const eligible = needsPosition && user.budget > 0 && !isComplete;
    const mustBid = eligible && user.bidSkips >= BID_SKIPS_ALLOWED;
    let helper = "";
    if (isComplete) helper = "Team complete";
    else if (!needsPosition) helper = `Does not need ${currentCandidate.mainPosition}`;
    else if (user.budget <= 0) helper = "No budget left";
    else helper = mustBid ? "No skips left — must bid above £0m" : `Budget left: £${user.budget}m • Skips left: ${BID_SKIPS_ALLOWED - user.bidSkips}`;
    return `<div class="bid-row ${eligible ? "" : "ineligible"}">
      <label for="bidUser${index}">${escapeHtml(user.name)}<span class="bid-help ${mustBid ? "must-bid" : ""}">${helper}</span></label>
      <input id="bidUser${index}" class="bid-input" type="number" min="${mustBid ? 1 : 0}" max="${user.budget}" step="1" value="0" ${eligible ? "" : "disabled"} />
    </div>`;
  }).join("");
}

function getBidForUser(index) { const input = document.getElementById(`bidUser${index}`); return input && !input.disabled ? Number(input.value || 0) : 0; }
function eligibleBidUsersForCandidate() { if (!currentCandidate) return []; return state.users.map((user, index) => ({ user, index })).filter(({ user }) => getNeededPositions(user).includes(currentCandidate.mainPosition) && user.budget > 0 && getNeededPositions(user).length > 0); }
function validateMandatoryBids() { const offenders = eligibleBidUsersForCandidate().filter(({ user, index }) => user.bidSkips >= BID_SKIPS_ALLOWED && getBidForUser(index) <= 0); if (offenders.length) { els.message.textContent = `${offenders.map(o => o.user.name).join(", ")} must bid above £0m because they have used all 3 skips.`; return false; } return true; }
function recordZeroBidSkips(winnerIndex = null) { eligibleBidUsersForCandidate().forEach(({ user, index }) => { if (index === winnerIndex) return; if (getBidForUser(index) <= 0 && user.bidSkips < BID_SKIPS_ALLOWED) user.bidSkips += 1; }); }

function awardHighestBid() {
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  if (!validateMandatoryBids()) return;
  let best = null, tied = false;
  state.users.forEach((user, index) => {
    const bid = getBidForUser(index);
    if (bid > user.budget || !getNeededPositions(user).includes(currentCandidate.mainPosition)) return;
    if (bid > 0 && (!best || bid > best.bid)) { best = { user, index, bid }; tied = false; }
    else if (best && bid === best.bid && bid > 0) tied = true;
  });
  if (!best) { els.message.textContent = "Enter at least one valid bid above £0m, or skip the player."; return; }
  if (tied) { els.message.textContent = "There is a tie for highest bid. Please adjust bids before awarding."; return; }
  recordZeroBidSkips(best.index);
  const playerWithPrice = { ...currentCandidate, price: best.bid };
  best.user.team.push(playerWithPrice);
  best.user.budget -= best.bid;
  best.user.spent += best.bid;
  state.acceptedPlayerNames.add(currentCandidate.player);
  els.message.textContent = `${best.user.name} signed ${currentCandidate.player} for £${best.bid}m.`;
  currentCandidate = null;
  els.awardBidBtn.disabled = true; els.skipBidBtn.disabled = true; els.bidInputs.innerHTML = "";
  if (isGameComplete()) completeGame(); else { rotateBidNominator(); bidRandomPlayer(); }
  render();
  saveOnlineState();
}

function skipBidPlayer() {
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  if (!validateMandatoryBids()) return;
  recordZeroBidSkips(null);
  currentCandidate = null;
  els.awardBidBtn.disabled = true; els.skipBidBtn.disabled = true; els.bidInputs.innerHTML = "";
  rotateBidNominator();
  if (isGameComplete()) completeGame(); else bidRandomPlayer();
  render();
  saveOnlineState();
}

function ensureCurrentNominatorCanNominate() { for (let i = 0; i < state.userCount; i++) { const ix = state.bidOrder[state.bidRoundIndex % state.userCount]; if (getNeededPositions(state.users[ix]).length > 0) { state.currentUserIndex = ix; return; } state.bidRoundIndex += 1; } }
function rotateBidNominator() { for (let i = 0; i < state.userCount; i++) { state.bidRoundIndex += 1; const ix = state.bidOrder[state.bidRoundIndex % state.userCount]; if (getNeededPositions(state.users[ix]).length > 0) { state.currentUserIndex = ix; return; } } }
function moveToNextUser() { for (let offset = 1; offset <= state.userCount; offset++) { const next = (state.currentUserIndex + offset) % state.userCount; if (getNeededPositions(state.users[next]).length > 0) { state.currentUserIndex = next; return; } } }
function isGameComplete() { return !!state && state.users.every(user => getNeededPositions(user).length === 0); }

function completeGame() {
  clearCandidate("Game complete. Reveal ratings to see the winner.");
  els.revealBtn.classList.remove("hidden");
  els.pickBtn.disabled = true;
  els.acceptBtn.disabled = true;
  els.declineBtn.disabled = true;
  els.awardBidBtn.disabled = true;
  els.skipBidBtn.disabled = true;
}

function revealScores() { ratingsRevealed = true; render(); renderResults(); els.resultsPanel.classList.remove("hidden"); els.revealBtn.classList.add("hidden"); saveOnlineState("Scores revealed."); }

function render() {
  if (!state) return;
  updateGameControls();
  const user = currentUser();
  els.currentUserLabel.textContent = user.name;
  if (state.gameMode === "bid") { els.currentBudgetLeft.textContent = `£${user.budget}m`; renderBidOrder(); }
  else { els.declinesLeft.textContent = DECLINES_ALLOWED - user.declines; }
  renderTeams();
  applyOnlineControlLock();
}

function renderBidOrder() { if (!state || state.gameMode !== "bid") return; const currentIndex = state.currentUserIndex; els.bidOrderDisplay.innerHTML = state.bidOrder.map((userIndex, orderIndex) => `<span class="order-chip ${userIndex === currentIndex ? "current" : ""}">${orderIndex + 1}. ${escapeHtml(state.users[userIndex].name)}</span>`).join(""); }

function renderCandidate(p) {
  els.candidateCard.classList.remove("blank");
  els.candidateCard.innerHTML = `<p class="eyebrow">Random candidate</p><h3 class="player-name">${escapeHtml(p.player)}</h3>
    <div class="badge-row"><span class="badge dark">${p.mainPosition}</span><span class="badge">${escapeHtml(p.position)}</span><span class="badge">${p.year}</span></div>
    <div class="detail-grid"><div class="detail"><span>Club</span>${escapeHtml(p.club)}</div><div class="detail"><span>Nation</span>${escapeHtml(p.nation)}</div></div>`;
}

function clearCandidate(text) {
  els.candidateCard.classList.add("blank");
  els.candidateCard.innerHTML = `<p class="muted">${escapeHtml(text)}</p>`;
  els.acceptBtn.disabled = true;
  els.declineBtn.disabled = true;
  if (state?.gameMode === "draft") els.pickBtn.disabled = isGameComplete();
}

function renderTeams() {
  els.teamsContainer.innerHTML = state.users.map(user => {
    const slots = buildSlots(user);
    const total = user.team.reduce((sum, p) => sum + p.rating, 0);
    const complete = getNeededPositions(user).length === 0;
    const budgetText = state.gameMode === "bid" ? `<div class="budget-line">Budget: £${user.budget}m left / £${user.spent}m spent</div><div class="skip-line">Skips: ${user.bidSkips}/${BID_SKIPS_ALLOWED}</div>` : "";
    return `<article class="team-card"><div class="team-top-row"><div><h3>${escapeHtml(user.name)}</h3><div class="team-meta">${complete ? "Complete" : `Needs ${getNeededPositions(user).join(", ")}`}</div>${budgetText}</div><div class="score">${ratingsRevealed ? total : "Hidden"}</div></div>${renderPitch(slots)}${state.gameMode === "draft" ? `<div class="score">Declines used: ${user.declines}/${DECLINES_ALLOWED}</div>` : ""}</article>`;
  }).join("");
}

function renderPitch(slots) { const classMap = ["gk", "def", "mid1", "mid2", "fwd"]; return `<div class="pitch" aria-label="5-a-side pitch"><div class="penalty-box top"></div><div class="penalty-box bottom"></div>${slots.map((slot, index) => renderPitchPlayer(slot, classMap[index])).join("")}</div>`; }
function renderPitchPlayer(slot, cls) {
  if (!slot.player) return `<div class="pitch-player ${cls} empty-slot"><span class="pos">${slot.label}</span><span class="name">Empty</span></div>`;
  const p = slot.player;
  const rating = ratingsRevealed ? `<span class="rating">OVR ${p.rating}</span>` : "";
  const price = state?.gameMode === "bid" && p.price ? `<span class="price">£${p.price}m</span>` : "";
  return `<div class="pitch-player ${cls}"><span class="pos">${slot.label}</span><span class="name">${escapeHtml(shortenName(p.player, 20))}</span><span class="club">${escapeHtml(shortenClub(p.club))}</span><span class="year">${p.year}</span>${rating}${price}</div>`;
}
function buildSlots(user) { const mids = user.team.filter(p => p.mainPosition === "MID"); return [{ label: "GK", player: user.team.find(p => p.mainPosition === "GK") }, { label: "DEF", player: user.team.find(p => p.mainPosition === "DEF") }, { label: "MID", player: mids[0] }, { label: "MID", player: mids[1] }, { label: "FWD", player: user.team.find(p => p.mainPosition === "FWD") }]; }
function shortenName(name, max = 20) { if (!name || name.length <= max) return name || ""; const parts = name.split(" "); if (parts.length >= 2) return `${parts[0][0]}. ${parts.slice(1).join(" ")}`.slice(0, max + 2); return name.slice(0, max) + "…"; }
function shortenClub(club) { const replacements = { "Manchester United": "Man United", "Manchester City": "Man City", "Tottenham Hotspur": "Spurs", "FC Barcelona": "Barcelona", "Real Madrid C.F.": "Real Madrid", "Paris Saint-Germain": "PSG", "Bayern München": "Bayern", "Bayern Munich": "Bayern", "Atlético de Madrid": "Atlético Madrid", "Borussia Dortmund": "Dortmund", "Inter Milan": "Inter", "AC Milan": "Milan", "Newcastle United": "Newcastle" }; const short = replacements[club] || club || ""; return short.length > 18 ? short.slice(0, 17) + "…" : short; }
function getFinalScores() { return state.users.map(user => ({ user, total: user.team.reduce((sum, p) => sum + p.rating, 0) })).sort((a, b) => b.total - a.total); }
function renderResults() { const scored = getFinalScores(); const topScore = scored[0]?.total ?? 0; els.resultsContainer.innerHTML = scored.map(row => `<article class="result-card ${row.total === topScore ? "winner" : ""}"><h3>${escapeHtml(row.user.name)}${row.total === topScore ? " 🏆" : ""}</h3><p class="score">${row.total}</p><p class="muted">${row.user.team.map(p => `${escapeHtml(p.player)} ${p.rating}${p.price ? ` (£${p.price}m)` : ""}`).join(" • ")}</p></article>`).join(""); }

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) { const words = String(text || "").split(" "); let line = ""; let lines = []; for (const word of words) { const testLine = line ? `${line} ${word}` : word; if (ctx.measureText(testLine).width > maxWidth && line) { lines.push(line); line = word; } else line = testLine; } if (line) lines.push(line); if (lines.length > maxLines) { lines = lines.slice(0, maxLines); while (ctx.measureText(lines[maxLines - 1] + "…").width > maxWidth && lines[maxLines - 1].length > 0) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1); lines[maxLines - 1] += "…"; } lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight)); }
function roundRect(ctx, x, y, width, height, radius, fill, stroke) { const r = Math.min(radius, width / 2, height / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath(); if (fill) ctx.fill(); if (stroke) ctx.stroke(); }

function createSummaryCanvas() {
  const scored = getFinalScores();
  const winnerScore = scored[0]?.total || 0;
  const winnerNames = scored.filter(s => s.total === winnerScore).map(s => s.user.name).join(" & ");
  const isBid = state?.gameMode === "bid";
  const scale = 2, width = 1080, headerHeight = 170, userBlockHeight = 300, footerHeight = 70;
  const height = headerHeight + state.users.length * userBlockHeight + footerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale; canvas.height = height * scale;
  const ctx = canvas.getContext("2d"); ctx.scale(scale, scale);
  const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, "#0f172a"); gradient.addColorStop(.55, "#1e3a8a"); gradient.addColorStop(1, "#14532d"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.95)"; roundRect(ctx, 40, 34, width - 80, 112, 26, true, false);
  ctx.fillStyle = "#0f172a"; ctx.font = "900 44px Arial"; ctx.fillText(isBid ? "Bid 5-a-side Results" : "5-a-side Draft Results", 70, 82);
  ctx.font = "700 24px Arial"; ctx.fillStyle = "#475569"; ctx.fillText(isBid ? "£100m budget • Players from 2005–2026" : "Players from 2005–2026", 70, 119);
  ctx.textAlign = "right"; ctx.fillStyle = "#92400e"; ctx.font = "900 26px Arial"; ctx.fillText(`Winner: ${winnerNames}`, width - 70, 84); ctx.fillText(`Score: ${winnerScore}`, width - 70, 119); ctx.textAlign = "left";
  state.users.forEach((user, index) => {
    const y = headerHeight + index * userBlockHeight;
    const score = user.team.reduce((sum, p) => sum + p.rating, 0);
    const isWinner = score === winnerScore;
    ctx.fillStyle = isWinner ? "rgba(255,251,235,0.97)" : "rgba(248,250,252,0.94)"; roundRect(ctx, 40, y + 10, width - 80, userBlockHeight - 24, 24, true, false);
    ctx.fillStyle = isWinner ? "#f59e0b" : "#2563eb"; roundRect(ctx, 60, y + 30, 120, 42, 18, true, false);
    ctx.fillStyle = "#fff"; ctx.font = "900 22px Arial"; ctx.fillText(isWinner ? "WINNER" : "TEAM", 78, y + 58);
    ctx.fillStyle = "#0f172a"; ctx.font = "900 34px Arial"; ctx.fillText(user.name, 200, y + 60);
    if (isBid) { ctx.fillStyle = "#166534"; ctx.font = "800 18px Arial"; ctx.fillText(`Spent £${user.spent}m • £${user.budget}m left • Skips ${user.bidSkips}/${BID_SKIPS_ALLOWED}`, 200, y + 86); }
    ctx.textAlign = "right"; ctx.fillStyle = "#0f172a"; ctx.font = "900 36px Arial"; ctx.fillText(`${score}`, width - 70, y + 60); ctx.font = "700 18px Arial"; ctx.fillStyle = "#64748b"; ctx.fillText("TOTAL", width - 70, y + 84); ctx.textAlign = "left";
    buildSlots(user).forEach((slot, i) => {
      const x = 70 + i * 198, rowY = y + 115, cardW = 184, cardH = 142, p = slot.player;
      ctx.fillStyle = "#fff"; roundRect(ctx, x, rowY, cardW, cardH, 18, true, false); ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; roundRect(ctx, x, rowY, cardW, cardH, 18, false, true);
      ctx.fillStyle = "#0f172a"; roundRect(ctx, x + 12, rowY + 12, 54, 25, 12, true, false); ctx.fillStyle = "#fff"; ctx.font = "900 13px Arial"; ctx.fillText(slot.label, x + 24, rowY + 30);
      if (p) { ctx.fillStyle = "#0f172a"; ctx.font = "900 18px Arial"; wrapCanvasText(ctx, p.player, x + 12, rowY + 62, cardW - 24, 20, 2); ctx.fillStyle = "#475569"; ctx.font = "700 14px Arial"; wrapCanvasText(ctx, shortenClub(p.club), x + 12, rowY + 103, cardW - 24, 16, 1); ctx.fillStyle = "#b45309"; ctx.font = "900 16px Arial"; ctx.fillText(`${p.year} • OVR ${p.rating}${p.price ? ` • £${p.price}m` : ""}`, x + 12, rowY + 128); }
    });
  });
  ctx.fillStyle = "rgba(255,255,255,0.72)"; ctx.font = "700 18px Arial"; ctx.textAlign = "center"; ctx.fillText("Created with the 5-a-side Draft Game", width / 2, height - 30); ctx.textAlign = "left";
  return canvas;
}
function canvasToBlob(canvas) { return new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95)); }
async function saveSummaryImage() { if (!state || !ratingsRevealed) { alert("Reveal the scores first, then save the summary picture."); return; } const canvas = createSummaryCanvas(); const link = document.createElement("a"); link.download = state.gameMode === "bid" ? "5-a-side-bid-results.png" : "5-a-side-draft-results.png"; link.href = canvas.toDataURL("image/png"); link.click(); }
async function shareSummaryImage() { if (!state || !ratingsRevealed) { alert("Reveal the scores first, then share the summary picture."); return; } const canvas = createSummaryCanvas(); const blob = await canvasToBlob(canvas); const file = new File([blob], state.gameMode === "bid" ? "5-a-side-bid-results.png" : "5-a-side-draft-results.png", { type: "image/png" }); if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ title: "5-a-side Results", text: "Here are the final 5-a-side teams and scores.", files: [file] }); return; } catch (err) { if (err.name === "AbortError") return; } } await saveSummaryImage(); alert("Your browser does not support direct image sharing here, so the picture has been downloaded. You can attach it to WhatsApp manually."); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[ch])); }

els.startBtn.addEventListener("click", startGame);
els.resetBtn.addEventListener("click", resetGame);
els.pickBtn.addEventListener("click", pickRandomPlayer);
els.acceptBtn.addEventListener("click", acceptPlayer);
els.declineBtn.addEventListener("click", declinePlayer);
els.bidPickBtn.addEventListener("click", bidRandomPlayer);
els.awardBidBtn.addEventListener("click", awardHighestBid);
els.skipBidBtn.addEventListener("click", skipBidPlayer);
els.revealBtn.addEventListener("click", revealScores);
els.shareSummaryBtn.addEventListener("click", shareSummaryImage);
els.saveSummaryBtn.addEventListener("click", saveSummaryImage);
els.userCount.addEventListener("change", renderUserNameInputs);
els.gameModeCards.addEventListener("click", event => { const card = event.target.closest(".game-mode-card"); if (!card) return; selectedGameMode = card.dataset.mode; updateSetupForMode(); });

injectOnlinePanel();
updateSetupForMode();
loadPlayers();
