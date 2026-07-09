/* ============================================================
   04-live-auction-and-year-filter.js
   LIVE AUCTION + YEAR FILTERS: online live auction, reset button behaviour, year range slicer and filtered player pool wrappers

   Refactor note:
   This file is loaded as a normal browser script, not an ES module.
   Files must remain in the order listed in index.html because the
   original working app.js used sequential overrides.
   ============================================================ */

/* ============================================================
   QUICK EDIT GUIDE - YEAR FILTERS AND EASY SOLO POOL

   Key function: filteredPlayersStep5()
   - Standard Solo uses the selected year range.
   - Ultimate Solo uses all years.
   - Easy Solo uses the selected year range, then keeps only the
     top rated players per year/position.

   To change Easy Solo limits, search for:
   const limit = position === "MID" ? 10 : 5;
   ============================================================ */

// --- step2 online bid mode selector and live auction ---
// Online bid mode now has two options:
// 1) Blind bidding - existing behaviour retained.
// 2) Live auction - visible highest bid, users can bid higher or pass/no.
// Live auction skip rule: before any first bid is made for a player, pressing No/Pass uses one of that user's 3 skips.
(function () {
  let selectedOnlineBidModeStep2 = "blind";

  const blindRenderOnlineBidControlsStep2 = renderOnlineBidControlsV38;
  const blindDrawOnlineBidCandidateStep2 = drawOnlineBlindBidCandidateV38;

  function userKeyStep2(userOrName) {
    return safeKey(typeof userOrName === "string" ? userOrName : userOrName?.name);
  }

  function getLiveAuctionStep2() {
    if (!state.liveAuction || typeof state.liveAuction !== "object" || Array.isArray(state.liveAuction)) {
      state.liveAuction = {};
    }
    if (!state.liveAuction.passedKeys || typeof state.liveAuction.passedKeys !== "object") {
      state.liveAuction.passedKeys = {};
    }
    if (!state.liveAuction.noFirstBidKeys || typeof state.liveAuction.noFirstBidKeys !== "object") {
      state.liveAuction.noFirstBidKeys = {};
    }
    state.liveAuction.highestKey = state.liveAuction.highestKey || "";
    state.liveAuction.highestName = state.liveAuction.highestName || "";
    state.liveAuction.highestBid = Number(state.liveAuction.highestBid || 0);
    state.liveAuction.outcome = state.liveAuction.outcome || null;
    return state.liveAuction;
  }

  function resetLiveAuctionStep2() {
    state.liveAuction = {
      passedKeys: {},
      noFirstBidKeys: {},
      highestKey: "",
      highestName: "",
      highestBid: 0,
      outcome: null,
      openedAt: Date.now()
    };
    return state.liveAuction;
  }

  function onlineLiveEligibleUsersStep2(candidate = currentCandidate) {
    if (!state || !candidate) return [];
    v29SafeState();
    return state.users.filter(user => {
      const maxBid = onlineMaxBidForCandidateV45(user, candidate);
      return getNeededPositions(user).includes(candidate.mainPosition) && maxBid > 0;
    });
  }

  function currentOnlineUserStep2() {
    if (!online.enabled || !state) return null;
    v29SafeState();
    return state.users.find(user => userKeyStep2(user) === safeKey(online.myName)) || null;
  }

  function liveAuctionAllDoneStep2(eligible, auction) {
    if (!eligible.length) return true;
    if (auction.highestBid > 0) {
      return eligible.every(user => {
        const key = userKeyStep2(user);
        return key === auction.highestKey || !!auction.passedKeys[key];
      });
    }
    return eligible.every(user => !!auction.passedKeys[userKeyStep2(user)]);
  }

  function livePassedNamesStep2(auction) {
    if (!state?.users) return [];
    return state.users
      .filter(user => auction.passedKeys?.[userKeyStep2(user)])
      .map(user => user.name);
  }

  function liveNoFirstBidNamesStep2(auction) {
    if (!state?.users) return [];
    return state.users
      .filter(user => auction.noFirstBidKeys?.[userKeyStep2(user)])
      .map(user => user.name);
  }

  function injectOnlineBidModeStylesStep2() {
    if ($("onlineBidModeStylesStep2")) return;
    const style = document.createElement("style");
    style.id = "onlineBidModeStylesStep2";
    style.textContent = `
      .online-bid-mode-step2 {
        margin: 12px 0 14px;
        padding: 12px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
      }
      .online-bid-mode-step2.hidden { display: none !important; }
      .online-bid-mode-title-step2 {
        margin: 0 0 8px;
        color: #0f172a;
        font-weight: 950;
      }
      .online-bid-mode-grid-step2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .online-bid-mode-card-step2 {
        border: 2px solid #e2e8f0;
        border-radius: 14px;
        background: #f8fafc;
        padding: 11px;
        cursor: pointer;
        text-align: left;
        color: #0f172a;
        font-weight: 950;
      }
      .online-bid-mode-card-step2 span {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: .8rem;
        line-height: 1.25;
        font-weight: 750;
      }
      .online-bid-mode-card-step2.selected {
        border-color: #2563eb;
        background: #eff6ff;
        box-shadow: 0 10px 24px rgba(37,99,235,.12);
      }
      .live-auction-panel-step2 {
        display: grid;
        gap: 12px;
      }
      .live-auction-top-step2 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 14px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 18px;
      }
      .live-auction-top-step2 h3 { margin: 2px 0 4px; }
      .live-highest-step2 {
        text-align: right;
        font-weight: 950;
        color: #1d4ed8;
        font-size: 1.2rem;
      }
      .live-auction-actions-step2 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 10px;
        align-items: end;
      }
      .live-status-list-step2 {
        display: grid;
        gap: 8px;
      }
      .live-status-row-step2 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 9px 10px;
      }
      .live-status-pill-step2 {
        border-radius: 999px;
        padding: 5px 9px;
        font-weight: 950;
        font-size: .82rem;
        white-space: nowrap;
        background: #e2e8f0;
        color: #334155;
      }
      .live-status-pill-step2.highest { background: #dbeafe; color: #1d4ed8; }
      .live-status-pill-step2.passed { background: #fee2e2; color: #991b1b; }
      .live-status-pill-step2.ready { background: #dcfce7; color: #166534; }
      @media (max-width: 720px) {
        .online-bid-mode-grid-step2,
        .live-auction-top-step2,
        .live-auction-actions-step2,
        .live-status-row-step2 {
          grid-template-columns: 1fr;
        }
        .live-highest-step2 { text-align: left; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectOnlineBidModeSelectorStep2() {
    injectOnlineBidModeStylesStep2();
    const lobbySetup = document.querySelector("#onlineLobbyPanel .lobby-setup");
    if (!lobbySetup || $("onlineBidModeSelectorStep2")) return;
    const holder = document.createElement("div");
    holder.id = "onlineBidModeSelectorStep2";
    holder.className = `online-bid-mode-step2 ${selectedGameMode === "bid" ? "" : "hidden"}`;
    holder.innerHTML = `
      <p class="online-bid-mode-title-step2">Online bidding style</p>
      <div class="online-bid-mode-grid-step2">
        <button type="button" class="online-bid-mode-card-step2 ${selectedOnlineBidModeStep2 === "blind" ? "selected" : ""}" data-online-bid-mode="blind">
          Blind bidding
          <span>Everyone submits privately, then bids are revealed together.</span>
        </button>
        <button type="button" class="online-bid-mode-card-step2 ${selectedOnlineBidModeStep2 === "live" ? "selected" : ""}" data-online-bid-mode="live">
          Live auction
          <span>Bids are visible. Users can bid higher or say no until a winner is left.</span>
        </button>
      </div>
    `;
    const exclude = $("lobbyExcludeDeclinesLabel");
    if (exclude && exclude.parentNode === lobbySetup) {
      lobbySetup.insertBefore(holder, exclude);
    } else {
      const start = $("startOnlineGameBtn");
      if (start && start.parentNode === lobbySetup) lobbySetup.insertBefore(holder, start);
      else lobbySetup.appendChild(holder);
    }
    holder.addEventListener("click", event => {
      const card = event.target.closest(".online-bid-mode-card-step2");
      if (!card) return;
      selectedOnlineBidModeStep2 = card.dataset.onlineBidMode === "live" ? "live" : "blind";
      holder.querySelectorAll(".online-bid-mode-card-step2").forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.onlineBidMode === selectedOnlineBidModeStep2);
      });
    });
  }

  const originalShowLobbyStep2 = showLobby;
  showLobby = function (...args) {
    const result = originalShowLobbyStep2.apply(this, args);
    const mode = args[0];
    if (mode === "host") {
      injectOnlineBidModeSelectorStep2();
    }
    return result;
  };

  async function startOnlineGameFromLobbyStep2() {
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
      state.onlineBidMode = selectedOnlineBidModeStep2 === "live" ? "live" : "blind";
      if (state.onlineBidMode === "live") {
        resetLiveAuctionStep2();
        await drawOnlineLiveBidCandidateStep2();
      } else {
        state.blindBids = {};
        state.bidOutcome = null;
        state.bidSubmittingLocked = false;
        await blindDrawOnlineBidCandidateStep2();
      }
    } else {
      await saveOnlineState("Online game started.");
    }
  }
  startOnlineGameFromLobby = startOnlineGameFromLobbyStep2;

  async function drawOnlineLiveBidCandidateStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid") return;
    await ensurePlayersReady();
    v29SafeState();
    state.onlineBidMode = "live";
    if (isGameComplete()) {
      completeGame();
      render();
      await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
      return;
    }
    const neededPositions = new Set();
    allOnlineBidUsersV38().forEach(user => getNeededPositions(user).forEach(pos => neededPositions.add(pos)));
    const accepted = state.acceptedPlayerNames instanceof Set ? state.acceptedPlayerNames : new Set();
    const pool = players.filter(p => neededPositions.has(p.mainPosition) && !accepted.has(p.player));
    if (!pool.length) {
      completeGame();
      render();
      await saveOnlineState("No more eligible players. Reveal ratings to see the winner.");
      return;
    }
    currentCandidate = pool[Math.floor(Math.random() * pool.length)];
    resetLiveAuctionStep2();
    renderCandidate(currentCandidate);
    renderOnlineLiveBidControlsStep2();
    setMessage(`Live auction open for ${currentCandidate.player}.`);
    await saveOnlineState(`Live auction open for ${currentCandidate.player}.`);
  }

  drawOnlineBlindBidCandidateV38 = async function () {
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      await drawOnlineLiveBidCandidateStep2();
      return;
    }
    await blindDrawOnlineBidCandidateStep2();
  };

  function renderOnlineLiveBidControlsStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live") return;
    const auction = getLiveAuctionStep2();
    show(els.draftControls, false);
    show(els.bidControls, true);
    show(els.declinesPill, false);
    show(els.budgetPill, false);
    if (els.bidPickBtn) els.bidPickBtn.classList.add("hidden");
    if (els.awardBidBtn) els.awardBidBtn.classList.add("hidden");
    if (els.skipBidBtn) els.skipBidBtn.classList.add("hidden");

    if (els.bidOrderDisplay) {
      els.bidOrderDisplay.innerHTML = `
        <div class="bid-status-summary">
          <strong>Live auction</strong>
          <span>${auction.highestBid > 0 ? `Highest bid: £${auction.highestBid}m by ${escapeHtml(auction.highestName)}` : "Waiting for the first bid"}</span>
        </div>
      `;
    }
    if (!els.bidInputs) return;

    if (!currentCandidate && isGameComplete()) {
      els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`;
      syncRevealButtonV37?.();
      return;
    }

    if (auction.outcome) {
      const noFirstNames = auction.outcome.noFirstBidNames || [];
      els.bidInputs.innerHTML = `
        <div class="bid-order-card">
          <p class="eyebrow">Auction result</p>
          <h3>${escapeHtml(auction.outcome.player?.player || "Player")}</h3>
          <p class="message">
            ${auction.outcome.type === "awarded"
              ? `${escapeHtml(auction.outcome.winnerName)} wins ${escapeHtml(auction.outcome.player?.player || "the player")} for £${auction.outcome.amount}m.`
              : `${escapeHtml(auction.outcome.player?.player || "The player")} was skipped.`}
          </p>
          ${noFirstNames.length ? `<p class="muted">${escapeHtml(noFirstNames.join(", "))} ${noFirstNames.length === 1 ? "loses" : "lose"} one skip for saying no before a first bid.</p>` : ""}
          <p class="muted">Next player loading...</p>
        </div>
      `;
      return;
    }

    if (!currentCandidate) {
      els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`;
      return;
    }

    const me = currentOnlineUserStep2();
    const myKey = safeKey(online.myName);
    const eligible = onlineLiveEligibleUsersStep2();
    const eligibleKeys = new Set(eligible.map(user => userKeyStep2(user)));
    const isEligible = eligibleKeys.has(myKey);
    const hasPassed = !!auction.passedKeys?.[myKey];
    const isHighest = auction.highestKey && auction.highestKey === myKey;
    const myBudget = Number(me?.budget || 0);
    const mySkipsLeft = onlineBidSkipsLeftV44(me);
    const myMaxBid = me ? onlineMaxBidForCandidateV45(me, currentCandidate) : 0;
    const minNextBid = Math.max(1, Number(auction.highestBid || 0) + 1);
    const canBid = !!me && isEligible && !hasPassed && !isHighest && myMaxBid >= minNextBid;
    const canPass = !!me && isEligible && !hasPassed && !isHighest && (auction.highestBid > 0 || mySkipsLeft > 0);

    const actionBox = canBid || canPass ? `
      <div class="bid-order-card live-auction-panel-step2">
        <div class="live-auction-top-step2">
          <div>
            <p class="eyebrow">Your action</p>
            <h3>${escapeHtml(currentCandidate.player)}</h3>
            <p class="muted">
              ${auction.highestBid > 0
                ? `Bid more than £${auction.highestBid}m or say no.`
                : `Make the first bid, or say no. Saying no before a first bid uses one skip.`}
            </p>
          </div>
          <div class="live-highest-step2">
            ${auction.highestBid > 0 ? `£${auction.highestBid}m<br><span class="muted">${escapeHtml(auction.highestName)}</span>` : "No bids yet"}
          </div>
        </div>
        <div class="live-auction-actions-step2">
          <div class="bid-row">
            <label for="onlineLiveBidInput">
              Your bid
              <span class="bid-help">Budget: £${myBudget}m • Max bid: £${myMaxBid}m • Skips left: ${mySkipsLeft}/${BID_SKIPS_ALLOWED}</span>
            </label>
            <input id="onlineLiveBidInput" type="number" min="${minNextBid}" max="${myMaxBid}" step="1" value="${Math.min(myMaxBid, minNextBid)}" ${canBid ? "" : "disabled"} />
          </div>
          <button id="submitLiveBidBtnStep2" class="btn btn-primary" type="button" ${canBid ? "" : "disabled"}>Bid</button>
          <button id="passLiveBidBtnStep2" class="btn btn-danger" type="button" ${canPass ? "" : "disabled"}>${auction.highestBid > 0 ? "No / Pass" : "No first bid"}</button>
        </div>
      </div>
    ` : `
      <div class="bid-order-card">
        <p class="eyebrow">Your action</p>
        <p class="muted">
          ${isHighest
            ? "You are currently the highest bidder. Waiting for the others to bid more or say no."
            : hasPassed
              ? "You have passed on this player. Waiting for the auction to finish."
              : isEligible
                ? "You cannot bid at the moment. You may have no valid budget left for this player, or you have no skips left before the first bid."
                : "You are not eligible for this player because your team does not need this position, or you have no available budget."}
        </p>
      </div>
    `;

    const statusRows = state.users.map(user => {
      const key = userKeyStep2(user);
      const userEligible = eligibleKeys.has(key);
      const userSkipsLeft = onlineBidSkipsLeftV44(user);
      const userMaxBid = currentCandidate ? onlineMaxBidForCandidateV45(user, currentCandidate) : 0;
      let status = "Not eligible";
      let cls = "";
      if (auction.highestKey === key) {
        status = `Highest £${auction.highestBid}m`;
        cls = "highest";
      } else if (auction.passedKeys?.[key]) {
        status = auction.noFirstBidKeys?.[key] ? "No first bid" : "Passed";
        cls = "passed";
      } else if (userEligible) {
        status = auction.highestBid > 0 ? "Can bid or pass" : (userSkipsLeft > 0 ? "Can first bid or no" : "Must first bid");
        cls = "ready";
      }
      return `
        <div class="live-status-row-step2">
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <div class="bid-help">Budget: £${Number(user.budget || 0)}m • Max: £${userMaxBid}m • Skips left: ${userSkipsLeft}/${BID_SKIPS_ALLOWED}</div>
          </div>
          <span class="live-status-pill-step2 ${cls}">${escapeHtml(status)}</span>
        </div>
      `;
    }).join("");

    els.bidInputs.innerHTML = actionBox + `<div class="bid-order-card"><p class="eyebrow">Auction status</p><div class="live-status-list-step2">${statusRows}</div></div>`;
    $("submitLiveBidBtnStep2")?.addEventListener("click", safe(submitOnlineLiveBidStep2));
    $("passLiveBidBtnStep2")?.addEventListener("click", safe(passOnlineLiveBidStep2));
  }

  async function submitOnlineLiveBidStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live" || !currentCandidate) return;
    v29SafeState();
    const auction = getLiveAuctionStep2();
    const me = currentOnlineUserStep2();
    if (!me) throw new Error("You are not listed in this online game.");
    const myKey = userKeyStep2(me);
    const eligibleKeys = new Set(onlineLiveEligibleUsersStep2().map(user => userKeyStep2(user)));
    if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible to bid for this player.");
    if (auction.passedKeys?.[myKey]) throw new Error("You have already passed on this player.");
    if (auction.highestKey === myKey) throw new Error("You are already the highest bidder.");
    const input = $("onlineLiveBidInput");
    const bid = Math.max(0, Math.floor(Number(input?.value || 0)));
    const minBid = Math.max(1, Number(auction.highestBid || 0) + 1);
    const maxBid = onlineMaxBidForCandidateV45(me, currentCandidate);
    if (!Number.isFinite(bid) || bid < minBid) throw new Error(`Your bid must be at least £${minBid}m.`);
    if (bid > maxBid) throw new Error(`Your maximum bid is £${maxBid}m because you must keep enough money to finish your team.`);
    auction.highestKey = myKey;
    auction.highestName = me.name;
    auction.highestBid = bid;
    renderOnlineLiveBidControlsStep2();
    await saveOnlineState(`${me.name} bid £${bid}m for ${currentCandidate.player}.`);
    await maybeResolveOnlineLiveAuctionStep2();
  }

  async function passOnlineLiveBidStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live" || !currentCandidate) return;
    v29SafeState();
    const auction = getLiveAuctionStep2();
    const me = currentOnlineUserStep2();
    if (!me) throw new Error("You are not listed in this online game.");
    const myKey = userKeyStep2(me);
    const eligibleKeys = new Set(onlineLiveEligibleUsersStep2().map(user => userKeyStep2(user)));
    if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible for this player.");
    if (auction.highestKey === myKey) throw new Error("You are currently winning. Wait for someone else to bid more or pass.");
    if (auction.passedKeys?.[myKey]) return;
    if (auction.highestBid <= 0) {
      if (onlineBidSkipsLeftV44(me) <= 0) {
        throw new Error("You have used all 3 skips and must make the first bid above £0m.");
      }
      me.bidSkips = Math.min(BID_SKIPS_ALLOWED, Number(me.bidSkips || 0) + 1);
      auction.noFirstBidKeys[myKey] = true;
    }
    auction.passedKeys[myKey] = true;
    renderOnlineLiveBidControlsStep2();
    await saveOnlineState(auction.highestBid > 0 ? `${me.name} passed on ${currentCandidate.player}.` : `${me.name} said no before a first bid and used one skip.`);
    await maybeResolveOnlineLiveAuctionStep2();
  }

  async function maybeResolveOnlineLiveAuctionStep2() {
    if (!state || state.onlineBidMode !== "live" || !currentCandidate) return;
    const auction = getLiveAuctionStep2();
    const eligible = onlineLiveEligibleUsersStep2();
    if (!liveAuctionAllDoneStep2(eligible, auction)) return;
    const candidate = v29NormalisePlayer(currentCandidate);
    if (!candidate) return;
    const noFirstBidNames = liveNoFirstBidNamesStep2(auction);
    if (auction.highestBid > 0 && auction.highestKey) {
      const winner = state.users.find(user => userKeyStep2(user) === auction.highestKey);
      if (winner) {
        winner.team.push({ ...candidate, price: auction.highestBid });
        winner.budget = Math.max(0, Number(winner.budget || 0) - auction.highestBid);
        winner.spent = Number(winner.spent || 0) + auction.highestBid;
        state.acceptedPlayerNames.add(candidate.player);
      }
      auction.outcome = {
        type: "awarded",
        player: candidate,
        winnerName: winner?.name || auction.highestName,
        amount: auction.highestBid,
        passedNames: livePassedNamesStep2(auction),
        noFirstBidNames,
        resolvedAt: Date.now()
      };
      currentCandidate = null;
      renderOnlineLiveBidControlsStep2();
      renderTeams();
      await saveOnlineState(`${auction.outcome.winnerName} won ${candidate.player} for £${auction.highestBid}m.`);
    } else {
      auction.outcome = {
        type: "skipped",
        player: candidate,
        passedNames: livePassedNamesStep2(auction),
        noFirstBidNames,
        resolvedAt: Date.now()
      };
      currentCandidate = null;
      renderOnlineLiveBidControlsStep2();
      renderTeams();
      await saveOnlineState(`${candidate.player} was skipped.`);
    }

    if (isGameComplete()) {
      setTimeout(async () => {
        completeGame();
        render();
        await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
      }, 3000);
    } else {
      setTimeout(async () => {
        await drawOnlineLiveBidCandidateStep2();
      }, 3000);
    }
  }

  renderOnlineBidControlsV38 = function () {
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      renderOnlineLiveBidControlsStep2();
      return;
    }
    blindRenderOnlineBidControlsStep2();
  };

  const originalRenderStep2 = render;
  render = function (...args) {
    const result = originalRenderStep2.apply(this, args);
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      renderOnlineLiveBidControlsStep2();
    }
    return result;
  };

  const originalApplyRemoteDataStep2 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = originalApplyRemoteDataStep2.apply(this, args);
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      renderOnlineLiveBidControlsStep2();
    }
    return result;
  };
})();

// --- step3 reset button available after mode selection ---
// Reset button behaviour:
// - Hidden only on the very first front page.
// - Shown after choosing Local setup.
// - Shown in online room/lobby screens.
// - Shown throughout local and online games/results.
(function () {
  function hideResetButtonStep3() {
    if (els?.resetBtn) els.resetBtn.style.display = "none";
  }

  function showResetButtonStep3() {
    if (els?.resetBtn) els.resetBtn.style.display = "";
  }

  document.addEventListener('click', function (event) {
    if (event.target?.closest?.('#startLocalGameBtn')) {
      setTimeout(showResetButtonStep3, 0);
    }
    if (event.target?.closest?.('#createOnlineRoomBtn, #joinOnlineRoomBtn')) {
      setTimeout(showResetButtonStep3, 0);
    }
  }, true);

  const previousShowLobbyStep3 = showLobby;
  showLobby = function (...args) {
    const result = previousShowLobbyStep3.apply(this, args);
    showResetButtonStep3();
    return result;
  };

  const previousStartNewGameStep3 = startNewGame;
  startNewGame = function (...args) {
    const result = previousStartNewGameStep3.apply(this, args);
    showResetButtonStep3();
    return result;
  };

  const previousRenderStep3 = render;
  render = function (...args) {
    const result = previousRenderStep3.apply(this, args);
    if (state) showResetButtonStep3();
    return result;
  };

  const previousApplyRemoteDataStep3 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep3.apply(this, args);
    if (state || online.enabled) showResetButtonStep3();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === 'function') {
    const previousShowFinishedResultsPageStep3 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = previousShowFinishedResultsPageStep3.apply(this, args);
      showResetButtonStep3();
      return result;
    };
  }

  const previousResetGameStep3 = resetGame;
  resetGame = function (...args) {
    window.challengePreset = "standard";
    const result = previousResetGameStep3.apply(this, args);
    hideResetButtonStep3();
    return result;
  };

  if (!state) hideResetButtonStep3();
})();

// --- step4 year range slicer for player pool ---
// Adds a dynamic year-range slicer before every game starts.
// The selected range is locked into state.yearRange at game start and all random-player pools use it.
(function () {
  let selectedYearRangeStep4 = null;

  function availableYearsStep4() {
    const rows = Array.isArray(players) && players.length ? players : samplePlayers.map((p, i) => v29NormalisePlayer(p, i)).filter(Boolean);
    const years = [...new Set(rows.map(p => Number(p.year || p.Game_Year || 0)).filter(Boolean))].sort((a, b) => a - b);
    return years.length ? years : [2005, 2026];
  }

  function clampYearRangeStep4(start, end) {
    const years = availableYearsStep4();
    const min = years[0] || 2005;
    const max = years[years.length - 1] || 2026;
    let a = Number(start ?? min);
    let b = Number(end ?? max);
    if (!Number.isFinite(a)) a = min;
    if (!Number.isFinite(b)) b = max;
    a = Math.max(min, Math.min(max, Math.round(a)));
    b = Math.max(min, Math.min(max, Math.round(b)));
    if (a > b) [a, b] = [b, a];
    return { start: a, end: b, min, max };
  }

  function currentYearRangeStep4() {
    return selectedYearRangeStep4 || clampYearRangeStep4();
  }

  function getYearRangeFromInputsStep4(prefix) {
    return clampYearRangeStep4($(`${prefix}YearStartStep4`)?.value, $(`${prefix}YearEndStep4`)?.value);
  }

  function filteredPlayersForRangeStep4(range = state?.yearRange || currentYearRangeStep4()) {
    const r = clampYearRangeStep4(range.start, range.end);
    return (Array.isArray(players) ? players : []).filter(p => Number(p.year || 0) >= r.start && Number(p.year || 0) <= r.end);
  }

  function filteredCountTextStep4(range) {
    const count = filteredPlayersForRangeStep4(range).length;
    
  }

  function setSliderVisualStep4(prefix, range) {
    const fill = $(`${prefix}YearFillStep4`);
    if (!fill) return;
    const total = Math.max(1, range.max - range.min);
    const left = ((range.start - range.min) / total) * 100;
    const right = 100 - ((range.end - range.min) / total) * 100;
    fill.style.left = `${left}%`;
    fill.style.right = `${right}%`;
  }

  function updateYearSliderLabelsStep4(prefix, range) {
    const label = $(`${prefix}YearLabelStep4`);
    const count = $(`${prefix}YearCountStep4`);
    const start = $(`${prefix}YearStartValueStep4`);
    const end = $(`${prefix}YearEndValueStep4`);
    if (label) label.textContent = `${range.start} - ${range.end}`;
    if (count) count.textContent = filteredCountTextStep4(range);
    if (start) start.textContent = String(range.start);
    if (end) end.textContent = String(range.end);
    setSliderVisualStep4(prefix, range);
  }

  function yearSlicerHtmlStep4(prefix, title = "Player year range") {
    const r = currentYearRangeStep4();
    return `
      <div id="${prefix}YearSlicerStep4" class="year-slicer-step4">
        <div class="year-slicer-head-step4">
          <div>
            <label>${escapeHtml(title)}</label>
            <p class="muted year-slicer-help-step4">Choose the years which you want the players to be included from.</p>
          </div>
          <div class="year-slicer-summary-step4">
            <strong id="${prefix}YearLabelStep4">${r.start} - ${r.end}</strong>
            <span id="${prefix}YearCountStep4">${filteredCountTextStep4(r)}</span>
          </div>
        </div>
        <div class="year-slicer-values-step4">
          <span>From <strong id="${prefix}YearStartValueStep4">${r.start}</strong></span>
          <span>To <strong id="${prefix}YearEndValueStep4">${r.end}</strong></span>
        </div>
        <div class="year-slider-shell-step4">
          <div class="year-track-step4"></div>
          <div id="${prefix}YearFillStep4" class="year-fill-step4"></div>
          <input id="${prefix}YearStartStep4" class="year-range-step4" type="range" min="${r.min}" max="${r.max}" step="1" value="${r.start}" aria-label="Start year" />
          <input id="${prefix}YearEndStep4" class="year-range-step4" type="range" min="${r.min}" max="${r.max}" step="1" value="${r.end}" aria-label="End year" />
        </div>
      </div>
    `;
  }

  function wireYearSlicerStep4(prefix) {
    const start = $(`${prefix}YearStartStep4`);
    const end = $(`${prefix}YearEndStep4`);
    if (!start || !end) return;

    const apply = () => {
      const range = getYearRangeFromInputsStep4(prefix);
      selectedYearRangeStep4 = range;
      start.value = String(range.start);
      end.value = String(range.end);
      updateYearSliderLabelsStep4(prefix, range);
    };

    start.addEventListener("input", apply);
    end.addEventListener("input", apply);
    start.addEventListener("change", apply);
    end.addEventListener("change", apply);
    apply();
  }

  function injectYearSlicerStylesStep4() {
    if ($("yearSlicerStylesStep4")) return;
    const style = document.createElement("style");
    style.id = "yearSlicerStylesStep4";
    style.textContent = `
      .year-slicer-step4 {
        margin: 14px 0;
        padding: 15px;
        border: 1px solid #dbeafe;
        border-radius: 20px;
        background: linear-gradient(135deg, #eff6ff, #f8fafc);
        box-shadow: 0 10px 28px rgba(15,23,42,.08);
      }
      .year-slicer-head-step4 {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        flex-wrap: wrap;
      }
      .year-slicer-head-step4 label {
        margin: 0;
        color: #0f172a;
        font-weight: 950;
      }
      .year-slicer-help-step4 {
        margin: 4px 0 0;
        font-size: .86rem;
      }
      .year-slicer-summary-step4 {
        display: grid;
        gap: 2px;
        text-align: right;
      }
      .year-slicer-summary-step4 strong {
        color: #1d4ed8;
        font-size: 1.08rem;
        font-weight: 950;
      }
      .year-slicer-summary-step4 span {
        color: #64748b;
        font-size: .82rem;
        font-weight: 850;
      }
      .year-slicer-values-step4 {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin: 12px 0 8px;
        color: #334155;
        font-weight: 850;
      }
      .year-slider-shell-step4 {
        position: relative;
        height: 36px;
      }
      .year-track-step4,
      .year-fill-step4 {
        position: absolute;
        left: 0;
        right: 0;
        top: 16px;
        height: 7px;
        border-radius: 999px;
      }
      .year-track-step4 { background: #cbd5e1; }
      .year-fill-step4 { background: linear-gradient(90deg, #22c55e, #2563eb); }
      .year-range-step4 {
        position: absolute;
        left: 0;
        top: 6px;
        width: 100%;
        height: 26px;
        background: transparent;
        pointer-events: none;
        appearance: none;
        -webkit-appearance: none;
      }
      .year-range-step4::-webkit-slider-thumb {
        pointer-events: auto;
        appearance: none;
        -webkit-appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #ffffff;
        border: 3px solid #2563eb;
        box-shadow: 0 4px 12px rgba(15,23,42,.24);
        cursor: pointer;
      }
      .year-range-step4::-moz-range-thumb {
        pointer-events: auto;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ffffff;
        border: 3px solid #2563eb;
        box-shadow: 0 4px 12px rgba(15,23,42,.24);
        cursor: pointer;
      }
      @media (max-width: 720px) {
        .year-slicer-summary-step4 { text-align: left; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectLocalYearSlicerStep4() {
    injectYearSlicerStylesStep4();
    const panel = document.querySelector(".setup-panel-card");
    if (!panel) return;
    let holder = $("localYearSlicerHolderStep4");
    if (!holder) {
      holder = document.createElement("div");
      holder.id = "localYearSlicerHolderStep4";
      const before = els.userNameFields || els.excludeDeclinesLabel || els.startBtn;
      if (before && before.parentNode === panel) panel.insertBefore(holder, before);
      else panel.appendChild(holder);
    }
    holder.innerHTML = yearSlicerHtmlStep4("local", "Player year range");
    wireYearSlicerStep4("local");
  }

  function injectOnlineYearSlicerStep4() {
    injectYearSlicerStylesStep4();
    const lobbySetup = document.querySelector("#onlineLobbyPanel .lobby-setup");
    if (!lobbySetup) return;
    let holder = $("onlineYearSlicerHolderStep4");
    if (!holder) {
      holder = document.createElement("div");
      holder.id = "onlineYearSlicerHolderStep4";
      const bidSelector = $("onlineBidModeSelectorStep2");
      const startButton = $("startOnlineGameBtn");
      if (bidSelector && bidSelector.parentNode === lobbySetup) lobbySetup.insertBefore(holder, bidSelector);
      else if (startButton && startButton.parentNode === lobbySetup) lobbySetup.insertBefore(holder, startButton);
      else lobbySetup.appendChild(holder);
    }
    holder.innerHTML = yearSlicerHtmlStep4("online", "Player year range");
    wireYearSlicerStep4("online");
  }

  const previousLoadPlayersStep4 = loadPlayers;
  loadPlayers = async function (...args) {
    const result = await previousLoadPlayersStep4.apply(this, args);
    selectedYearRangeStep4 = selectedYearRangeStep4 || clampYearRangeStep4();
    if (!state) {
      injectLocalYearSlicerStep4();
      if (online.enabled && online.isHost) injectOnlineYearSlicerStep4();
    }
    return result;
  };

  const previousUpdateSetupForModeStep4 = updateSetupForMode;
  updateSetupForMode = function (...args) {
    const result = previousUpdateSetupForModeStep4.apply(this, args);
    if (!state) injectLocalYearSlicerStep4();
    return result;
  };

  const previousShowLobbyStep4 = showLobby;
  showLobby = function (...args) {
    const result = previousShowLobbyStep4.apply(this, args);
    const mode = args[0];
    if (mode === "host") injectOnlineYearSlicerStep4();
    return result;
  };

  function lockRangeBeforeStartStep4(isOnlineGame) {
    const range = isOnlineGame ? getYearRangeFromInputsStep4("online") : getYearRangeFromInputsStep4("local");
    selectedYearRangeStep4 = range;
    return { start: range.start, end: range.end };
  }

  const previousStartNewGameStep4 = startNewGame;
  startNewGame = function (gameMode, names, isOnlineGame) {
    const lockedRange = lockRangeBeforeStartStep4(isOnlineGame);
    const result = previousStartNewGameStep4(gameMode, names, isOnlineGame);
    if (state) state.yearRange = lockedRange;
    return result;
  };

  function withFilteredPlayersStep4(fn) {
    const originalPlayers = players;
    if (state?.yearRange) {
      const filtered = filteredPlayersForRangeStep4(state.yearRange);
      players = filtered.length ? filtered : [];
    }
    try {
      return fn();
    } finally {
      players = originalPlayers;
    }
  }

  const previousPickRandomPlayerStep4 = pickRandomPlayer;
  pickRandomPlayer = async function (...args) {
    return await withFilteredPlayersStep4(() => previousPickRandomPlayerStep4.apply(this, args));
  };

  const previousOnlineDrawCandidateStep4 = typeof onlineDrawCandidateForCurrentTurnV32 === "function" ? onlineDrawCandidateForCurrentTurnV32 : null;
  if (previousOnlineDrawCandidateStep4) {
    onlineDrawCandidateForCurrentTurnV32 = function (...args) {
      return withFilteredPlayersStep4(() => previousOnlineDrawCandidateStep4.apply(this, args));
    };
  }

  const previousBidRandomPlayerStep4 = bidRandomPlayer;
  bidRandomPlayer = async function (...args) {
    return await withFilteredPlayersStep4(() => previousBidRandomPlayerStep4.apply(this, args));
  };

  const previousDrawOnlineBlindBidCandidateStep4 = drawOnlineBlindBidCandidateV38;
  drawOnlineBlindBidCandidateV38 = async function (...args) {
    return await withFilteredPlayersStep4(() => previousDrawOnlineBlindBidCandidateStep4.apply(this, args));
  };

  const previousRenderCandidateStep4 = renderCandidate;
  renderCandidate = function (p) {
    previousRenderCandidateStep4(p);
    const r = state?.yearRange;
    if (r && els.candidateCard && p?.year) {
      const note = document.createElement("p");
      note.className = "muted";
      note.style.marginTop = "8px";
      note.textContent = `Pool: ${r.start} - ${r.end}`;
      els.candidateCard.appendChild(note);
    }
  };

  const previousSerialiseStateStep4 = serialiseState;
  serialiseState = function (...args) {
    const raw = previousSerialiseStateStep4.apply(this, args);
    if (raw && state?.yearRange) raw.yearRange = { start: state.yearRange.start, end: state.yearRange.end };
    return raw;
  };

  const previousRestoreStateStep4 = restoreState;
  restoreState = function (...args) {
    const restored = previousRestoreStateStep4.apply(this, args);
    if (restored?.yearRange) restored.yearRange = { start: Number(restored.yearRange.start), end: Number(restored.yearRange.end) };
    return restored;
  };

  const previousResetGameStep4 = resetGame;
  resetGame = function (...args) {
    const result = previousResetGameStep4.apply(this, args);
    selectedYearRangeStep4 = clampYearRangeStep4();
    setTimeout(() => {
      injectLocalYearSlicerStep4();
    }, 0);
    return result;
  };

  ensurePlayersReady().then(() => {
    selectedYearRangeStep4 = selectedYearRangeStep4 || clampYearRangeStep4();
    if (!state) injectLocalYearSlicerStep4();
  });
})();

// --- step5 async-safe year range filtering fix ---
// Fixes Step 4 issue where the slicer UI worked but async random-pick functions could see the full player list.
// This version filters through helper functions and async-safe wrappers so local/online pools respect state.yearRange.
(function () {
  function activeYearRangeStep5() {
    if (state?.yearRange) return state.yearRange;
    return null;
  }

  function playerInActiveYearRangeStep5(player) {
    const range = activeYearRangeStep5();
    if (!range) return true;
    const year = Number(player?.year || player?.Game_Year || 0);
    return year >= Number(range.start) && year <= Number(range.end);
  }

  function filteredPlayersStep5() {

    const filtered =
        (Array.isArray(players) ? players : [])
            .filter(playerInActiveYearRangeStep5);

    // Ultimate Solo Mode = all players
    if (window.challengePreset === "ultimate") {
        return filtered;
    }

    // Easy Solo Challenge
    // Top 5 rated players per position per year
    if (window.challengePreset === "easy") {

        const grouped = {};

        filtered.forEach(player => {

            const key =
                `${player.year}_${player.mainPosition}`;

            if (!grouped[key]) {
                grouped[key] = [];
            }

            grouped[key].push(player);

        });

        if (window.challengePreset === "easy") {

    const grouped = {};

    filtered.forEach(player => {

        const key =
            `${player.year}_${player.mainPosition}`;

        if (!grouped[key]) {
            grouped[key] = [];
        }

        grouped[key].push(player);

    });

    return Object.entries(grouped)
        .flatMap(([key, group]) => {

            const position =
                key.split("_")[1];

            const limit =
                position === "MID" ? 10 : 5;

            return group
                .sort((a, b) => b.rating - a.rating)
                .slice(0, limit);

        });
}
    }

    // Standard Solo Challenge
    return filtered;
}

  async function withFilteredPlayersAsyncStep5(fn) {
    const originalPlayers = players;
    if (state?.yearRange) {
      players = filteredPlayersStep5();
    }
    try {
      return await fn();
    } finally {
      players = originalPlayers;
    }
  }

  // Re-wrap the key async functions. These wrappers are intentionally placed after Step 4,
  // so they override the earlier non-async-safe wrappers.
  const previousPickRandomPlayerStep5 = pickRandomPlayer;
  pickRandomPlayer = async function (...args) {
    return await withFilteredPlayersAsyncStep5(() => previousPickRandomPlayerStep5.apply(this, args));
  };

  if (typeof onlineDrawCandidateForCurrentTurnV32 === "function") {
    const previousOnlineDrawCandidateStep5 = onlineDrawCandidateForCurrentTurnV32;
    onlineDrawCandidateForCurrentTurnV32 = function (...args) {
      const originalPlayers = players;
      if (state?.yearRange) players = filteredPlayersStep5();
      try {
        return previousOnlineDrawCandidateStep5.apply(this, args);
      } finally {
        players = originalPlayers;
      }
    };
  }

  const previousBidRandomPlayerStep5 = bidRandomPlayer;
  bidRandomPlayer = async function (...args) {
    return await withFilteredPlayersAsyncStep5(() => previousBidRandomPlayerStep5.apply(this, args));
  };

  const previousDrawOnlineBlindBidCandidateStep5 = drawOnlineBlindBidCandidateV38;
  drawOnlineBlindBidCandidateV38 = async function (...args) {
    return await withFilteredPlayersAsyncStep5(() => previousDrawOnlineBlindBidCandidateStep5.apply(this, args));
  };

  // If Step 2 live auction is present, it ultimately calls drawOnlineBlindBidCandidateV38 in some flows.
  // This helper also gives a direct, reliable filtered pool function for any later candidate draw code.
  window.getUltimate5AsideFilteredPlayersForCurrentGame = filteredPlayersStep5;

  // Add a small visible status in-game so it is obvious which pool is active.
  const previousRenderStep5 = render;
  render = function (...args) {
    const result = previousRenderStep5.apply(this, args);
    const range = state?.yearRange;
    if (range && els?.message) {
      let pill = document.getElementById("activeYearRangePillStep5");
      if (!pill) {
        pill = document.createElement("div");
        pill.id = "activeYearRangePillStep5";
        pill.className = "turn-lock-note";
        pill.style.background = "#eff6ff";
        pill.style.borderColor = "#bfdbfe";
        pill.style.color = "#1e3a8a";
        els.message.insertAdjacentElement("afterend", pill);
      }
      const count = filteredPlayersStep5().length;
      pill.textContent = `Active player pool: ${range.start} - ${range.end} (${count} players)`;
    }
    return result;
  };

  const previousResetGameStep5 = resetGame;
  resetGame = function (...args) {
    const result = previousResetGameStep5.apply(this, args);
    const pill = document.getElementById("activeYearRangePillStep5");
    if (pill) pill.remove();
    return result;
  };
})();

// --- step6 rebind first randomise buttons to filtered handlers ---
// Fixes the remaining first-pick issue.
// Reason: the original Pick player / Randomise player click listeners were wired during init()
// before the year-filter override functions were appended. The first click could therefore use
// the old unfiltered handler, while later auto-picks used the new filtered handler.
(function () {
  function bindFilteredClickStep6(button, handler) {
    if (!button || button.dataset.step6FilteredBound === "1") return;
    button.dataset.step6FilteredBound = "1";
    button.addEventListener("click", function (event) {
      // Capture phase: stop the original init-time listener and call the current filtered handler instead.
      event.preventDefault();
      event.stopImmediatePropagation();
      safe(handler)();
    }, true);
  }

  bindFilteredClickStep6(els.pickBtn, function () {
    return pickRandomPlayer();
  });

  bindFilteredClickStep6(els.bidPickBtn, function () {
    return bidRandomPlayer();
  });
})();

