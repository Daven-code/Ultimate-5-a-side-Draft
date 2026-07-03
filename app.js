
const DECLINES_ALLOWED = 3;
const AUCTION_BUDGET = 100;
const BID_SKIPS_ALLOWED = 3;

// Firebase is used only for online rooms. Local play still works without it.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAcqef5WtEuICYihdza6l_gcad7UUjIjS0",
  authDomain: "ultimate-5-a-side-draft.firebaseapp.com",
  databaseURL: "https://ultimate-5-a-side-draft-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ultimate-5-a-side-draft",
  storageBucket: "ultimate-5-a-side-draft.firebasestorage.app",
  messagingSenderId: "947937131392",
  appId: "1:947937131392:web:c2a228b6697cf397439f65",
  measurementId: "G-22516PSZD7"
};

let selectedGameMode = "draft";
let players = [];
let state = null;
let currentCandidate = null;
let ratingsRevealed = false;
let applyingRemote = false;

const online = {
  enabled: false,
  isHost: false,
  roomId: null,
  ref: null,
  myName: "",
  loaded: false
};

const samplePlayers = [
  { Player: "Lionel Messi", Game_Year: 2012, Rating_OVR: 94, Position: "CF", Main_Position: "FWD", Club: "FC Barcelona", Nation: "Argentina" },
  { Player: "Cristiano Ronaldo", Game_Year: 2012, Rating_OVR: 92, Position: "LW", Main_Position: "FWD", Club: "Real Madrid", Nation: "Portugal" },
  { Player: "Gianluigi Buffon", Game_Year: 2005, Rating_OVR: 97, Position: "GK", Main_Position: "GK", Club: "Juventus", Nation: "Italy" },
  { Player: "Sergio Ramos", Game_Year: 2015, Rating_OVR: 87, Position: "CB", Main_Position: "DEF", Club: "Real Madrid", Nation: "Spain" },
  { Player: "Xavi", Game_Year: 2012, Rating_OVR: 92, Position: "CM", Main_Position: "MID", Club: "FC Barcelona", Nation: "Spain" },
  { Player: "Kevin De Bruyne", Game_Year: 2021, Rating_OVR: 91, Position: "CM", Main_Position: "MID", Club: "Manchester City", Nation: "Belgium" },
  { Player: "Thierry Henry", Game_Year: 2005, Rating_OVR: 97, Position: "ST", Main_Position: "FWD", Club: "Arsenal", Nation: "France" }
];

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
  } catch {
    players = normalisePlayers(samplePlayers);
    if (els.loadStatus) {
      els.loadStatus.textContent = "Using fallback sample players. Keep players.json in the project folder.";
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

function injectOnlineStyles() {
  if (document.getElementById("onlineStyles")) return;
  const style = document.createElement("style");
  style.id = "onlineStyles";
  style.textContent = `
    .online-room-panel { margin-bottom: 18px; }
    .online-room-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 14px; display: grid; gap: 10px; }
    .online-room-actions { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
    .online-room-status { margin: 2px 0 0; color: #475569; font-weight: 800; font-size: .88rem; line-height: 1.35; }
    .online-room-link { margin: 0; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; border-radius: 12px; padding: 9px 10px; font-weight: 900; overflow-wrap: anywhere; }
    .lobby-card { max-width: 760px; margin: 42px auto; text-align: center; }
    .lobby-code { display: inline-block; margin: 10px 0; padding: 10px 16px; background: #0f172a; color: #fff; border-radius: 14px; font-size: 1.4rem; letter-spacing: .12em; font-weight: 950; }
    .lobby-link { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 12px; overflow-wrap: anywhere; color: #1e3a8a; font-weight: 850; }
    .joined-list { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    .joined-pill { background: #dcfce7; color: #166534; border-radius: 999px; padding: 7px 11px; font-weight: 900; }
    .lobby-setup { margin-top: 18px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: #f8fafc; text-align: left; }
    .lobby-setup-title { margin: 0 0 10px; font-weight: 950; color: #0f172a; }
    .lobby-mode-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
    .lobby-mode-card { border: 2px solid #e2e8f0; background: #fff; border-radius: 16px; padding: 12px; text-align: left; cursor: pointer; font-weight: 900; color: #0f172a; }
    .lobby-mode-card span { display: block; margin-top: 4px; color: #64748b; font-size: .82rem; font-weight: 750; line-height: 1.25; }
    .lobby-mode-card.selected { border-color: #22c55e; background: #f0fdf4; box-shadow: 0 10px 24px rgba(34,197,94,.12); }
    .lobby-checkbox { display: flex; gap: 8px; align-items: center; color: #334155; font-weight: 850; margin: 10px 0 14px; }
    .lobby-start-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .turn-lock-note { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 14px; padding: 10px; font-weight: 900; margin-top: 10px; }
    @media (max-width: 620px) { .online-room-actions, .lobby-mode-cards { grid-template-columns: 1fr; } }
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
      <p id="onlineRoomStatus" class="online-room-status">Create a room, then share the link. Each person joins using their own name.</p>
      <p id="onlineRoomLink" class="online-room-link hidden"></p>
    </div>`;
  setupCard.insertBefore(panel, setupCard.firstChild);
  document.getElementById("createOnlineRoomBtn").addEventListener("click", createOnlineRoom);
  document.getElementById("joinOnlineRoomBtn").addEventListener("click", () => joinOnlineRoom(document.getElementById("joinRoomCode").value.trim().toUpperCase()));

  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  if (room) {
    document.getElementById("joinRoomCode").value = room.toUpperCase();
    setOnlineStatus(`Room code detected: ${room.toUpperCase()}. Type your player name, then click Join room.`);
  }
}

function ensureLobby() {
  let lobby = document.getElementById("onlineLobbyPanel");
  if (lobby) return lobby;
  const shell = document.querySelector(".app-shell") || document.body;
  lobby = document.createElement("section");
  lobby.id = "onlineLobbyPanel";
  lobby.className = "card lobby-card hidden";
  shell.insertBefore(lobby, els.gamePanel);
  return lobby;
}

function showLobby(mode, data = {}) {
  const lobby = ensureLobby();
  const invite = data.invite || `${location.origin}${location.pathname}?room=${online.roomId}`;
  const joined = data.participants || [];
  lobby.innerHTML = mode === "host" ? `
    <p class="eyebrow">Online room created</p>
    <h2>Waiting for players to join</h2>
    <p class="muted">Share this link. Joined players appear below. When everyone is in, choose the game and start directly from here.</p>
    <div class="lobby-code">${online.roomId}</div>
    <p class="lobby-link">${invite}</p>
    <button id="copyInviteBtn" class="btn btn-secondary" type="button">Copy invite link</button>
    <div class="joined-list">${joined.map(n => `<span class="joined-pill">${escapeHtml(n)}</span>`).join("") || `<span class="joined-pill">${escapeHtml(online.myName || "Host")}</span>`}</div>
    <div class="lobby-setup">
      <p class="lobby-setup-title">Start online game</p>
      <div id="lobbyModeCards" class="lobby-mode-cards">
        <button type="button" class="lobby-mode-card ${selectedGameMode === "draft" ? "selected" : ""}" data-mode="draft">Ultimate Draft 5-a-side<span>Each player controls their own turn from their device.</span></button>
        <button type="button" class="lobby-mode-card ${selectedGameMode === "bid" ? "selected" : ""}" data-mode="bid">Bid for your Ultimate 5-a-side Team<span>Host-assisted for now; all devices still update live.</span></button>
      </div>
      <label id="lobbyExcludeDeclinesLabel" class="lobby-checkbox ${selectedGameMode === "bid" ? "hidden" : ""}">
        <input id="lobbyExcludeDeclines" type="checkbox" checked />
        Exclude declined players
      </label>
      <div class="lobby-start-row">
        <button id="startOnlineGameBtn" class="btn btn-primary" type="button">Start online game</button>
        <button id="editLocalSetupBtn" class="btn btn-secondary" type="button">Edit local setup instead</button>
      </div>
    </div>
  ` : `
    <p class="eyebrow">Online room joined</p>
    <h2>Waiting for the host</h2>
    <p class="muted">You joined as <strong>${escapeHtml(online.myName)}</strong>. Keep this page open. Once the host starts, your controls will unlock when it is your turn.</p>
    <div class="lobby-code">${online.roomId}</div>
    <div class="joined-list">${joined.map(n => `<span class="joined-pill">${escapeHtml(n)}</span>`).join("")}</div>
  `;
  els.setupPanel.classList.add("hidden");
  els.gamePanel.classList.add("hidden");
  els.resultsPanel.classList.add("hidden");
  lobby.classList.remove("hidden");
  document.getElementById("copyInviteBtn")?.addEventListener("click", () => navigator.clipboard?.writeText(invite));
  document.getElementById("lobbyModeCards")?.addEventListener("click", event => {
    const card = event.target.closest(".lobby-mode-card");
    if (!card) return;
    selectedGameMode = card.dataset.mode;
    showLobby("host", { participants: joined, invite });
  });
  document.getElementById("startOnlineGameBtn")?.addEventListener("click", startOnlineGameFromLobby);
  document.getElementById("editLocalSetupBtn")?.addEventListener("click", () => {
    lobby.classList.add("hidden");
    els.setupPanel.classList.remove("hidden");
    updateSetupForMode();
    populateNamesFromParticipants();
  });
}

function setOnlineStatus(text) {
  const el = document.getElementById("onlineRoomStatus");
  if (el) el.textContent = text;
}

function setOnlineLink(text) {
  const el = document.getElementById("onlineRoomLink");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("hidden", !text);
}

function randomRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function firebaseConfigured() {
  return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL;
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
  if (!firebaseConfigured()) throw new Error("Firebase is not configured yet.");
  if (online.loaded) return;
  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js");
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  online.loaded = true;
}

async function createOnlineRoom() {
  try {
    const name = document.getElementById("onlineRoomName")?.value?.trim();
    if (!name) throw new Error("Type your name first.");
    await ensureFirebase();
    online.enabled = true;
    online.isHost = true;
    online.myName = name;
    online.roomId = randomRoomId();
    online.ref = firebase.database().ref(`rooms/${online.roomId}`);
    const invite = `${location.origin}${location.pathname}?room=${online.roomId}`;
    await online.ref.set({
      createdAt: Date.now(),
      hostName: name,
      participants: { [safeKey(name)]: name },
      state: null,
      currentCandidate: null,
      ratingsRevealed: false,
      message: "Room created. Waiting for players."
    });
    subscribeToRoom();
    setOnlineStatus(`Room created: ${online.roomId}`);
    setOnlineLink(`Share this link: ${invite}`);
    showLobby("host", { invite, participants: [name] });
  } catch (err) {
    setOnlineStatus(err.message);
  }
}

async function joinOnlineRoom(code) {
  try {
    const name = document.getElementById("onlineRoomName")?.value?.trim();
    if (!name) throw new Error("Type your player name first. This should match the name the host uses in setup.");
    if (!code) throw new Error("Enter a room code first.");
    await ensureFirebase();
    online.enabled = true;
    online.isHost = false;
    online.myName = name;
    online.roomId = code;
    online.ref = firebase.database().ref(`rooms/${online.roomId}`);
    await online.ref.child(`participants/${safeKey(name)}`).set(name);
    subscribeToRoom();
    showLobby("player", { participants: [name] });
  } catch (err) {
    setOnlineStatus(err.message);
  }
}

function subscribeToRoom() {
  if (!online.ref) return;
  online.ref.off();
  online.ref.on("value", snapshot => {
    const data = snapshot.val();
    if (!data || applyingRemote) return;
    const participants = Object.values(data.participants || {});
    if (!data.state) {
      showLobby(online.isHost ? "host" : "player", { participants, invite: `${location.origin}${location.pathname}?room=${online.roomId}` });
      return;
    }
    applyRemoteData(data);
  });
}

function safeKey(value) {
  return String(value).trim().toLowerCase().replace(/[.#$\/[\]]/g, "_");
}


function participantNamesFromSnapshot(snapshot) {
  const names = Object.values(snapshot.val() || {}).map(name => String(name).trim()).filter(Boolean);
  const unique = [];
  names.forEach(name => {
    if (!unique.some(existing => safeKey(existing) === safeKey(name))) unique.push(name);
  });
  return unique;
}

async function startOnlineGameFromLobby() {
  if (!online.enabled || !online.isHost || !online.ref) return;
  const snapshot = await online.ref.child("participants").once("value");
  const names = participantNamesFromSnapshot(snapshot);
  const minUsers = selectedGameMode === "bid" ? 2 : 1;
  if (names.length < minUsers) {
    alert(selectedGameMode === "bid" ? "Bid mode needs at least 2 joined players." : "At least 1 player must join.");
    return;
  }
  const activeNames = names.slice(0, 4);
  const gameMode = selectedGameMode;
  ratingsRevealed = false;
  currentCandidate = null;
  state = {
    gameMode,
    userCount: activeNames.length,
    currentUserIndex: 0,
    excludeDeclines: gameMode === "draft" && !!document.getElementById("lobbyExcludeDeclines")?.checked,
    users: activeNames.map(name => ({
      name,
      team: [],
      declines: 0,
      declinedNames: new Set(),
      budget: AUCTION_BUDGET,
      spent: 0,
      bidSkips: 0
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
    state.bidOrder = shuffleArray([...Array(activeNames.length).keys()]);
    state.currentUserIndex = state.bidOrder[0];
  }
  ensureLobby().classList.add("hidden");
  els.setupPanel.classList.add("hidden");
  els.gamePanel.classList.remove("hidden");
  els.resultsPanel.classList.add("hidden");
  els.revealBtn.classList.add("hidden");
  updateGameControls();
  clearCandidate(gameMode === "bid" ? "Click “Randomise player” to start the auction." : "Click “Pick player” to begin.");
  render();
  await saveOnlineState("Online game started.");
}

function populateNamesFromParticipants() {
  if (!online.ref || !online.isHost) return;
  online.ref.child("participants").once("value", snapshot => {
    const names = Object.values(snapshot.val() || {});
    if (!names.length) return;
    const count = Math.min(4, Math.max(selectedGameMode === "bid" ? 2 : 1, names.length));
    els.userCount.value = String(count);
    renderUserNameInputs();
    names.slice(0, count).forEach((name, i) => {
      const input = document.getElementById(`userName${i}`);
      if (input) input.value = name;
    });
  });
}

function serialiseState() {
  if (!state) return null;
  return {
    ...state,
    acceptedPlayerNames: [...state.acceptedPlayerNames],
    users: state.users.map(user => ({ ...user, declinedNames: [...user.declinedNames] }))
  };
}

function restoreState(raw) {
  if (!raw) return null;
  return {
    ...raw,
    acceptedPlayerNames: new Set(raw.acceptedPlayerNames || []),
    users: (raw.users || []).map(user => ({ ...user, declinedNames: new Set(user.declinedNames || []) }))
  };
}

async function saveOnlineState(messageOverride = null) {
  if (!online.enabled || !online.ref || applyingRemote) return;
  await online.ref.update({
    updatedAt: Date.now(),
    state: serialiseState(),
    currentCandidate,
    ratingsRevealed,
    message: messageOverride ?? els.message.textContent ?? ""
  });
}

function applyRemoteData(data) {
  applyingRemote = true;
  state = restoreState(data.state);
  currentCandidate = data.currentCandidate || null;
  ratingsRevealed = !!data.ratingsRevealed;
  ensureLobby().classList.add("hidden");
  els.setupPanel.classList.add("hidden");
  els.gamePanel.classList.remove("hidden");
  if (ratingsRevealed) els.resultsPanel.classList.remove("hidden");
  else els.resultsPanel.classList.add("hidden");
  updateGameControls();
  render();
  if (currentCandidate) renderCandidate(currentCandidate);
  else clearCandidate(data.message || "Waiting for the next action...");
  if (ratingsRevealed) renderResults();
  els.message.textContent = data.message || "";
  applyingRemote = false;
  applyOnlinePermissions();
}

function currentPlayerCanAct() {
  if (!online.enabled) return true;
  if (!state) return false;
  const user = currentUser();
  return user && safeKey(user.name) === safeKey(online.myName);
}

function applyOnlinePermissions() {
  if (!online.enabled || !state) return;
  const canAct = currentPlayerCanAct();
  const noteText = canAct ? `It is your turn, ${online.myName}.` : `Waiting for ${currentUser()?.name || "the current player"}. You joined as ${online.myName}.`;
  let note = document.getElementById("turnLockNote");
  if (!note && els.message) {
    note = document.createElement("div");
    note.id = "turnLockNote";
    note.className = "turn-lock-note";
    els.message.insertAdjacentElement("afterend", note);
  }
  if (note) note.textContent = noteText;

  if (state.gameMode === "draft") {
    if (!canAct) {
      els.pickBtn.disabled = true;
      els.acceptBtn.disabled = true;
      els.declineBtn.disabled = true;
    } else {
      els.pickBtn.disabled = !!currentCandidate || isGameComplete();
      els.acceptBtn.disabled = !currentCandidate;
      els.declineBtn.disabled = !currentCandidate || currentUser().declines >= DECLINES_ALLOWED;
    }
  }

  // Bid mode remains shared-screen/host-assisted for now. Draft mode is fully turn-based online.
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
    const input = document.getElementById(`userName${i}`);
    return input?.value?.trim() || `User ${i + 1}`;
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
      name: names[i],
      team: [],
      declines: 0,
      declinedNames: new Set(),
      budget: AUCTION_BUDGET,
      spent: 0,
      bidSkips: 0
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
  ensureLobby().classList.add("hidden");
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
  ensureLobby().classList.add("hidden");
  els.setupPanel.classList.remove("hidden");
  els.gamePanel.classList.add("hidden");
  els.resultsPanel.classList.add("hidden");
  els.message.textContent = "";
  updateSetupForMode();
  if (online.enabled) saveOnlineState("Game reset.");
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
  if (online.enabled && !currentPlayerCanAct()) return applyOnlinePermissions();
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
  applyOnlinePermissions();
}

function acceptPlayer() {
  if (!currentCandidate || !state || state.gameMode !== "draft") return;
  if (online.enabled && !currentPlayerCanAct()) return applyOnlinePermissions();
  const user = currentUser();
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
  if (online.enabled && !currentPlayerCanAct()) return applyOnlinePermissions();
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
  const pool = players.filter(p => !state.acceptedPlayerNames.has(p.player) && needs.includes(p.mainPosition));
  if (!pool.length) { clearCandidate("No available player for the current nominator. Rotating nominator."); rotateBidNominator(); render(); return; }
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
    let helper = isComplete ? "Team complete" : !needsPosition ? `Does not need ${currentCandidate.mainPosition}` : user.budget <= 0 ? "No budget left" : mustBid ? "No skips left — must bid above £0m" : `Budget left: £${user.budget}m • Skips left: ${BID_SKIPS_ALLOWED - user.bidSkips}`;
    return `<div class="bid-row ${eligible ? "" : "ineligible"}"><label for="bidUser${index}">${escapeHtml(user.name)}<span class="bid-help ${mustBid ? "must-bid" : ""}">${helper}</span></label><input id="bidUser${index}" class="bid-input" type="number" min="${mustBid ? 1 : 0}" max="${user.budget}" step="1" value="0" ${eligible ? "" : "disabled"} /></div>`;
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
  best.user.team.push({ ...currentCandidate, price: best.bid });
  best.user.budget -= best.bid;
  best.user.spent += best.bid;
  state.acceptedPlayerNames.add(currentCandidate.player);
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
  saveOnlineState("Game complete. Reveal ratings to see the winner.");
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
  applyOnlinePermissions();
}

function renderBidOrder() { if (!state || state.gameMode !== "bid") return; els.bidOrderDisplay.innerHTML = state.bidOrder.map((userIndex, orderIndex) => `<span class="order-chip ${userIndex === state.currentUserIndex ? "current" : ""}">${orderIndex + 1}. ${escapeHtml(state.users[userIndex].name)}</span>`).join(""); }

function renderCandidate(p) {
  els.candidateCard.classList.remove("blank");
  els.candidateCard.innerHTML = `<p class="eyebrow">Random candidate</p><h3 class="player-name">${escapeHtml(p.player)}</h3><div class="badge-row"><span class="badge dark">${p.mainPosition}</span><span class="badge">${escapeHtml(p.position)}</span><span class="badge">${p.year}</span></div><div class="detail-grid"><div class="detail"><span>Club</span>${escapeHtml(p.club)}</div><div class="detail"><span>Nation</span>${escapeHtml(p.nation)}</div></div>`;
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

function createSummaryCanvas() { const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 700; const ctx = canvas.getContext("2d"); ctx.fillStyle = "#0f172a"; ctx.fillRect(0,0,1200,700); ctx.fillStyle = "#fff"; ctx.font = "900 42px Arial"; ctx.fillText("5-a-side Results", 50, 70); const scored = getFinalScores(); ctx.font = "700 24px Arial"; scored.forEach((row, i) => ctx.fillText(`${i+1}. ${row.user.name} - ${row.total}`, 60, 130 + i*45)); return canvas; }
function canvasToBlob(canvas) { return new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95)); }
async function saveSummaryImage() { if (!state || !ratingsRevealed) { alert("Reveal the scores first, then save the summary picture."); return; } const canvas = createSummaryCanvas(); const link = document.createElement("a"); link.download = state.gameMode === "bid" ? "5-a-side-bid-results.png" : "5-a-side-draft-results.png"; link.href = canvas.toDataURL("image/png"); link.click(); }
async function shareSummaryImage() { if (!state || !ratingsRevealed) { alert("Reveal the scores first, then share the summary picture."); return; } const canvas = createSummaryCanvas(); const blob = await canvasToBlob(canvas); const file = new File([blob], "5-a-side-results.png", { type: "image/png" }); if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ title: "5-a-side Results", files: [file] }); else await saveSummaryImage(); }
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
