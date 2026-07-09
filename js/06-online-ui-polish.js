/* ============================================================
   06-online-ui-polish.js
   ONLINE UI POLISH: online game layout refresh, board fit, mobile action highlighting and online header cleanup

   Refactor note:
   This file is loaded as a normal browser script, not an ES module.
   Files must remain in the order listed in index.html because the
   original working app.js used sequential overrides.
   ============================================================ */

// --- step12 online game UI refresh ---
// Improves the online in-game screens without changing game logic.
// Focus: clearer action area, cleaner bid input, smaller tip/helper text, compact room badge and better hierarchy.
(function () {
  function injectOnlineRefreshStylesStep12() {
    if ($("onlineRefreshStylesStep12")) return;
    const style = document.createElement("style");
    style.id = "onlineRefreshStylesStep12";
    style.textContent = `
      body.online-game-active-step12 #gamePanel.game-grid {
        max-width: 1320px;
        width: min(1320px, calc(100vw - 32px));
        margin-left: auto;
        margin-right: auto;
        grid-template-columns: minmax(0, 1.45fr) minmax(360px, .82fr) !important;
        gap: 22px;
        align-items: start;
      }

      body.online-game-active-step12 .draft-card {
        padding: 22px !important;
        border: 1px solid rgba(255,255,255,.40);
        box-shadow: 0 24px 70px rgba(15,23,42,.18);
      }

      body.online-game-active-step12 .teams-card {
        padding: 18px !important;
        background: rgba(255,255,255,.92);
        border: 1px solid rgba(226,232,240,.95);
        box-shadow: 0 20px 52px rgba(15,23,42,.12);
      }

      body.online-game-active-step12 .turn-row {
        align-items: center;
        padding: 14px;
        border-radius: 20px;
        background: linear-gradient(135deg, rgba(239,246,255,.96), rgba(240,253,244,.92));
        border: 1px solid rgba(191,219,254,.95);
        margin-bottom: 14px;
      }

      body.online-game-active-step12 .turn-row h2 {
        margin: 2px 0 0;
        font-size: clamp(1.7rem, 3.2vw, 2.7rem);
        line-height: 1.05;
      }

      body.online-game-active-step12 .turn-row .eyebrow {
        font-size: .72rem;
        letter-spacing: .09em;
      }

      body.online-game-active-step12 .player-card {
        min-height: 280px;
        padding: 24px !important;
        border-radius: 28px !important;
      }

      body.online-game-active-step12 .player-card .player-name {
        font-size: clamp(2rem, 4vw, 3.35rem);
        line-height: 1.02;
      }

      body.online-game-active-step12 .player-card .badge-row {
        margin-top: 12px;
      }

      body.online-game-active-step12 .player-card .detail-grid {
        gap: 12px;
      }

      body.online-game-active-step12 #bidControls.bid-controls {
        display: grid;
        gap: 12px;
      }

      body.online-game-active-step12 #bidControls > .bid-order-card:first-child {
        padding: 12px 14px !important;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      body.online-game-active-step12 .bid-status-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      body.online-game-active-step12 .bid-status-summary strong {
        font-size: 1rem;
        color: #0f172a;
      }

      body.online-game-active-step12 .bid-status-summary span {
        font-size: .76rem;
        color: #64748b;
        font-weight: 850;
      }

      body.online-game-active-step12 .bid-warning,
      body.online-game-active-step12 .warning-note,
      body.online-game-active-step12 .muted,
      body.online-game-active-step12 .bid-help,
      body.online-game-active-step12 .turn-lock-note {
        font-size: .76rem !important;
        line-height: 1.3 !important;
      }

      body.online-game-active-step12 .bid-warning,
      body.online-game-active-step12 .warning-note {
        padding: 8px 10px !important;
        margin: 0 !important;
        border-radius: 12px;
        opacity: .86;
      }

      body.online-game-active-step12 #bidInputs {
        display: grid;
        gap: 12px;
      }

      body.online-game-active-step12 #bidInputs > .bid-order-card,
      body.online-game-active-step12 .live-auction-panel-step2,
      body.online-game-active-step12 #bidInputs > .bid-order-card:first-child {
        border-radius: 22px !important;
        border: 1px solid #dbeafe !important;
        background: linear-gradient(180deg, #ffffff, #f8fafc) !important;
        box-shadow: 0 16px 38px rgba(15,23,42,.10);
        padding: 16px !important;
      }

      body.online-game-active-step12 #bidInputs > .bid-order-card:first-child .eyebrow,
      body.online-game-active-step12 .live-auction-panel-step2 .eyebrow {
        color: #2563eb;
        font-size: .72rem;
        letter-spacing: .09em;
      }

      body.online-game-active-step12 #bidInputs > .bid-order-card:first-child h3,
      body.online-game-active-step12 .live-auction-panel-step2 h3 {
        font-size: clamp(1.35rem, 2.8vw, 2rem);
        margin: 4px 0 6px;
        color: #0f172a;
      }

      body.online-game-active-step12 .bid-row {
        gap: 8px;
        padding: 10px !important;
        border-radius: 16px !important;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      body.online-game-active-step12 .bid-row label {
        font-size: .92rem;
        font-weight: 950;
        color: #0f172a;
      }

      body.online-game-active-step12 input[type="number"]#onlineBlindBidInput,
      body.online-game-active-step12 input[type="number"]#onlineLiveBidInput,
      body.online-game-active-step12 .bid-row input[type="number"] {
        min-height: 54px;
        border-radius: 16px;
        font-size: 1.45rem;
        font-weight: 950;
        text-align: center;
        color: #0f172a;
        border: 2px solid #bfdbfe;
        background: #ffffff;
      }

      body.online-game-active-step12 #submitBlindBidBtn,
      body.online-game-active-step12 #submitLiveBidBtnStep2,
      body.online-game-active-step12 #passLiveBidBtnStep2 {
        min-height: 50px;
        border-radius: 16px;
        font-size: 1rem;
        font-weight: 950;
      }

      body.online-game-active-step12 .live-auction-top-step2 {
        border-radius: 18px;
        padding: 13px !important;
        background: #eff6ff !important;
      }

      body.online-game-active-step12 .live-highest-step2 {
        font-size: 1.45rem !important;
        line-height: 1.1;
      }

      body.online-game-active-step12 .live-auction-actions-step2 {
        grid-template-columns: minmax(0, 1fr) minmax(96px, auto) minmax(96px, auto) !important;
        gap: 10px !important;
      }

      body.online-game-active-step12 .live-status-row-step2 {
        padding: 8px 10px !important;
      }

      body.online-game-active-step12 .live-status-pill-step2,
      body.online-game-active-step12 .bid-submit-status {
        font-size: .72rem !important;
        border-radius: 999px;
        padding: 5px 8px;
        font-weight: 950;
      }

      body.online-game-active-step12 .teams-card .section-title-row h2 {
        font-size: 1.45rem;
      }

      body.online-game-active-step12 .teams-card .section-title-row .eyebrow {
        font-size: .72rem;
        letter-spacing: .08em;
      }

      body.online-game-active-step12 .team-card {
        padding: 13px !important;
        border-radius: 18px !important;
      }

      body.online-game-active-step12 .team-card h3 {
        font-size: 1rem;
      }

      body.online-game-active-step12 .team-meta,
      body.online-game-active-step12 .team-card .score {
        font-size: .76rem;
      }

      body.online-game-active-step12 .teams-card .pitch {
        min-height: 330px;
      }

      .online-room-mini-step12 {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border-radius: 999px;
        padding: 6px 10px;
        background: rgba(15,23,42,.88);
        color: #ffffff;
        font-size: .72rem;
        font-weight: 950;
        letter-spacing: .02em;
        box-shadow: 0 10px 26px rgba(15,23,42,.18);
        white-space: nowrap;
      }

      body.online-game-active-step12 .turn-row .online-room-mini-step12 {
        margin-left: auto;
      }

      body.online-game-active-step12 #message.message {
        font-size: .86rem;
        font-weight: 850;
        color: #334155;
      }

      @media (max-width: 980px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(760px, calc(100vw - 24px));
        }

        body.online-game-active-step12 .teams-card {
          order: 2;
        }

        body.online-game-active-step12 .draft-card {
          order: 1;
        }

        body.online-game-active-step12 .live-auction-actions-step2 {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 640px) {
        body.online-game-active-step12 .turn-row {
          grid-template-columns: 1fr;
        }

        body.online-game-active-step12 .turn-row .online-room-mini-step12 {
          margin-left: 0;
          width: fit-content;
        }

        body.online-game-active-step12 .player-card {
          min-height: 240px;
          padding: 18px !important;
        }

        body.online-game-active-step12 #bidInputs > .bid-order-card,
        body.online-game-active-step12 .live-auction-panel-step2 {
          padding: 13px !important;
        }

        body.online-game-active-step12 input[type="number"]#onlineBlindBidInput,
        body.online-game-active-step12 input[type="number"]#onlineLiveBidInput,
        body.online-game-active-step12 .bid-row input[type="number"] {
          min-height: 50px;
          font-size: 1.25rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isOnlineGameActiveStep12() {
    return !!state && !!online.enabled && !ratingsRevealed;
  }

  function setOnlineBodyClassStep12() {
    document.body.classList.toggle("online-game-active-step12", isOnlineGameActiveStep12());
  }

  function addOnlineRoomBadgeStep12() {
    if (!isOnlineGameActiveStep12()) return;
    const row = document.querySelector(".draft-card .turn-row");
    if (!row) return;
    let badge = $("onlineRoomMiniStep12");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "onlineRoomMiniStep12";
      badge.className = "online-room-mini-step12";
      row.appendChild(badge);
    }
    badge.textContent = online.roomId ? `Room: ${online.roomId}` : "Online game";
  }

  function simplifyOnlineLabelsStep12() {
    if (!isOnlineGameActiveStep12()) return;
    if (state?.gameMode === "bid") {
      if (els.turnEyebrow) els.turnEyebrow.textContent = state.onlineBidMode === "live" ? "Live auction" : "Blind bidding";
      if (els.currentUserLabel) els.currentUserLabel.textContent = currentCandidate ? "Make your bid" : "Online bidding";
    } else {
      if (els.turnEyebrow) els.turnEyebrow.textContent = "Online draft";
    }
  }

  function refreshOnlineUiStep12() {
    injectOnlineRefreshStylesStep12();
    setOnlineBodyClassStep12();
    addOnlineRoomBadgeStep12();
    simplifyOnlineLabelsStep12();
  }

  const previousRenderStep12 = render;
  render = function (...args) {
    const result = previousRenderStep12.apply(this, args);
    refreshOnlineUiStep12();
    return result;
  };

  const previousApplyRemoteDataStep12 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep12.apply(this, args);
    refreshOnlineUiStep12();
    return result;
  };

  const previousRenderOnlineBidControlsStep12 = renderOnlineBidControlsV38;
  renderOnlineBidControlsV38 = function (...args) {
    const result = previousRenderOnlineBidControlsStep12.apply(this, args);
    refreshOnlineUiStep12();
    return result;
  };

  const previousResetStep12 = resetGame;
  resetGame = function (...args) {
    const result = previousResetStep12.apply(this, args);
    document.body.classList.remove("online-game-active-step12");
    const badge = $("onlineRoomMiniStep12");
    if (badge) badge.remove();
    return result;
  };

  injectOnlineRefreshStylesStep12();
  refreshOnlineUiStep12();
})();

// --- step13 online pitch overflow desktop fix ---
// Fixes online desktop issue where the draft-board/pitch panel could overflow off the right side.
// Keeps the improved bidding/action UI from Step 12.
(function () {
  function injectOnlinePitchOverflowFixStep13() {
    if ($("onlinePitchOverflowFixStep13")) return;
    const style = document.createElement("style");
    style.id = "onlinePitchOverflowFixStep13";
    style.textContent = `
      body.online-game-active-step12 #gamePanel.game-grid {
        box-sizing: border-box;
        max-width: 1240px !important;
        width: min(1240px, calc(100vw - 40px)) !important;
        grid-template-columns: minmax(0, 1.42fr) minmax(0, .78fr) !important;
        overflow-x: hidden;
      }

      body.online-game-active-step12 .draft-card,
      body.online-game-active-step12 .teams-card,
      body.online-game-active-step12 .team-card,
      body.online-game-active-step12 .pitch {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box;
      }

      body.online-game-active-step12 .teams-card {
        overflow: hidden !important;
      }

      body.online-game-active-step12 #teamsContainer.teams-container {
        width: 100%;
        max-width: 100%;
        overflow: hidden;
      }

      body.online-game-active-step12 .team-card {
        width: 100%;
        overflow: hidden;
      }

      body.online-game-active-step12 .teams-card .pitch {
        width: 100% !important;
        min-height: 300px !important;
        overflow: hidden !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player {
        max-width: 112px !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player .name,
      body.online-game-active-step12 .teams-card .pitch-player .club,
      body.online-game-active-step12 .teams-card .pitch-player .year,
      body.online-game-active-step12 .teams-card .pitch-player .rating,
      body.online-game-active-step12 .teams-card .pitch-player .price {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Preserve mobile behaviour, which already looked fine. */
      @media (max-width: 980px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          width: min(760px, calc(100vw - 24px)) !important;
          grid-template-columns: 1fr !important;
          overflow-x: visible;
        }

        body.online-game-active-step12 .teams-card .pitch {
          min-height: 330px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const previousRenderStep13 = render;
  render = function (...args) {
    const result = previousRenderStep13.apply(this, args);
    injectOnlinePitchOverflowFixStep13();
    return result;
  };

  const previousApplyRemoteDataStep13 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep13.apply(this, args);
    injectOnlinePitchOverflowFixStep13();
    return result;
  };

  injectOnlinePitchOverflowFixStep13();
})();

// --- step14 online draft board fit and scroll all teams ---
// Fixes the online draft board/pitch sidebar so each pitch fits without being clipped,
// and all online teams remain accessible inside a tidy scrollable draft-board panel.
(function () {
  function injectOnlineBoardFitStylesStep14() {
    if ($("onlineBoardFitStylesStep14")) return;
    const style = document.createElement("style");
    style.id = "onlineBoardFitStylesStep14";
    style.textContent = `
      body.online-game-active-step12 #gamePanel.game-grid {
        max-width: 1320px !important;
        width: min(1320px, calc(100vw - 40px)) !important;
        grid-template-columns: minmax(0, 1.35fr) minmax(390px, .88fr) !important;
        align-items: start !important;
        overflow: visible !important;
      }

      body.online-game-active-step12 .teams-card {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: visible !important;
        padding: 18px !important;
      }

      body.online-game-active-step12 #teamsContainer.teams-container {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 14px !important;
        width: 100% !important;
        max-width: 100% !important;
        max-height: calc(100vh - 230px);
        overflow-y: auto !important;
        overflow-x: hidden !important;
        padding-right: 8px;
        scrollbar-gutter: stable;
      }

      body.online-game-active-step12 #teamsContainer.teams-container::-webkit-scrollbar {
        width: 8px;
      }
      body.online-game-active-step12 #teamsContainer.teams-container::-webkit-scrollbar-track {
        background: rgba(226,232,240,.85);
        border-radius: 999px;
      }
      body.online-game-active-step12 #teamsContainer.teams-container::-webkit-scrollbar-thumb {
        background: rgba(100,116,139,.65);
        border-radius: 999px;
      }

      body.online-game-active-step12 .team-card {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: visible !important;
        box-sizing: border-box !important;
        padding: 14px !important;
      }

      body.online-game-active-step12 .teams-card .pitch {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        min-height: 420px !important;
        max-height: none !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player {
        position: absolute !important;
        width: min(118px, 30%) !important;
        min-width: 86px !important;
        max-width: 118px !important;
        box-sizing: border-box !important;
        transform: translate(-50%, -50%) !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player.gk {
        left: 50% !important;
        top: 88% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.def {
        left: 50% !important;
        top: 68% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.mid1 {
        left: 32% !important;
        top: 50% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.mid2 {
        left: 68% !important;
        top: 50% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.fwd {
        left: 50% !important;
        top: 22% !important;
        right: auto !important;
        bottom: auto !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player .pos,
      body.online-game-active-step12 .teams-card .pitch-player .name,
      body.online-game-active-step12 .teams-card .pitch-player .club,
      body.online-game-active-step12 .teams-card .pitch-player .year,
      body.online-game-active-step12 .teams-card .pitch-player .rating,
      body.online-game-active-step12 .teams-card .pitch-player .price {
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      body.online-game-active-step12 .teams-card .section-title-row {
        position: sticky;
        top: 0;
        z-index: 5;
        background: rgba(255,255,255,.92);
        backdrop-filter: blur(8px);
        border-radius: 16px;
        padding-bottom: 8px;
        margin-bottom: 10px;
      }

      @media (min-width: 981px) and (max-width: 1180px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          grid-template-columns: minmax(0, 1.2fr) minmax(360px, .9fr) !important;
          width: min(1180px, calc(100vw - 28px)) !important;
          gap: 18px !important;
        }
        body.online-game-active-step12 .teams-card .pitch {
          min-height: 390px !important;
        }
        body.online-game-active-step12 #teamsContainer.teams-container {
          max-height: calc(100vh - 220px);
        }
      }

      @media (max-width: 980px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(760px, calc(100vw - 24px)) !important;
        }
        body.online-game-active-step12 #teamsContainer.teams-container {
          max-height: none !important;
          overflow: visible !important;
          padding-right: 0 !important;
        }
        body.online-game-active-step12 .teams-card .pitch {
          min-height: 420px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const previousRenderStep14 = render;
  render = function (...args) {
    const result = previousRenderStep14.apply(this, args);
    injectOnlineBoardFitStylesStep14();
    return result;
  };

  const previousApplyRemoteDataStep14 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep14.apply(this, args);
    injectOnlineBoardFitStylesStep14();
    return result;
  };

  injectOnlineBoardFitStylesStep14();
})();

// --- step16 mobile action highlight, online board header polish and live skip fix ---
// 1) Adds a real in-card "YOUR GO" banner so phones show the active action area reliably.
// 2) Makes the online Draft Board/Teams header look more polished across all online modes.
// 3) Adds extra skip synchronisation for live auction "No first bid" so the counter updates correctly.
(function () {
  function injectStep16Styles() {
    if ($("step16OnlinePolishStyles")) return;
    const style = document.createElement("style");
    style.id = "step16OnlinePolishStyles";
    style.textContent = `
      /* More robust action highlighting, including real mobile Safari/iPhone rendering. */
      .online-action-needed-step15 {
        border: 3px solid #22c55e !important;
        box-shadow: 0 0 0 5px rgba(34,197,94,.18), 0 18px 44px rgba(15,23,42,.16) !important;
        background: linear-gradient(180deg, #ffffff, #f0fdf4) !important;
      }
      .online-action-banner-step16 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        margin: -2px 0 12px;
        padding: 10px 12px;
        border-radius: 16px;
        background: linear-gradient(135deg, #22c55e, #bbf7d0);
        color: #052e16;
        font-weight: 950;
        font-size: .9rem;
        box-shadow: 0 12px 28px rgba(34,197,94,.20);
        box-sizing: border-box;
      }
      .online-action-banner-step16 span:last-child {
        font-size: .72rem;
        opacity: .86;
      }
      @media (max-width: 720px) {
        .online-action-banner-step16 {
          position: sticky;
          top: 8px;
          z-index: 20;
          font-size: .95rem;
          padding: 12px;
          margin-bottom: 14px;
        }
        .online-action-needed-step15 {
          border-width: 4px !important;
          box-shadow: 0 0 0 5px rgba(34,197,94,.22), 0 12px 36px rgba(15,23,42,.18) !important;
        }
      }

      /* Professional online Draft Board header. */
      body.online-game-active-step12 .teams-card > .section-title-row {
        position: sticky;
        top: 0;
        z-index: 8;
        margin: -4px -4px 16px !important;
        padding: 16px 16px !important;
        border-radius: 22px !important;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #2563eb) !important;
        color: #ffffff !important;
        box-shadow: 0 18px 44px rgba(15,23,42,.18);
        border: 1px solid rgba(255,255,255,.18);
        backdrop-filter: blur(10px);
      }
      body.online-game-active-step12 .teams-card > .section-title-row > div {
        display: grid;
        gap: 4px;
      }
      body.online-game-active-step12 .teams-card > .section-title-row .eyebrow {
        display: inline-flex;
        width: fit-content;
        padding: 5px 9px;
        border-radius: 999px;
        background: rgba(255,255,255,.16);
        color: #bfdbfe !important;
        font-size: .68rem !important;
        letter-spacing: .11em !important;
        font-weight: 950;
      }
      body.online-game-active-step12 .teams-card > .section-title-row h2 {
        margin: 0;
        color: #ffffff !important;
        font-size: 1.55rem !important;
        line-height: 1.05;
        font-weight: 950;
      }
      body.online-game-active-step12 .teams-card > .section-title-row h2::after {
        content: "Live teams";
        display: block;
        margin-top: 4px;
        font-size: .78rem;
        line-height: 1.2;
        color: rgba(255,255,255,.76);
        font-weight: 800;
      }
      body.online-game-active-step12 .teams-card > .section-title-row #revealBtn:not(.hidden) {
        background: #ffffff !important;
        color: #1d4ed8 !important;
        border: 0 !important;
        box-shadow: 0 10px 28px rgba(15,23,42,.18);
      }
      @media (max-width: 720px) {
        body.online-game-active-step12 .teams-card > .section-title-row {
          margin: 0 0 14px !important;
          padding: 14px !important;
          border-radius: 20px !important;
        }
        body.online-game-active-step12 .teams-card > .section-title-row h2 {
          font-size: 1.38rem !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function safeKeyStep16(value) {
    return typeof safeKey === "function" ? safeKey(value) : String(value || "").trim().toLowerCase();
  }

  function clampSkipsStep16(value) {
    const n = Math.max(0, Math.floor(Number(value || 0)));
    return Math.min(BID_SKIPS_ALLOWED, n);
  }

  function normaliseSkipsStep16() {
    if (!state?.users) return;
    state.users.forEach(user => {
      user.bidSkips = clampSkipsStep16(user.bidSkips);
    });
  }

  function syncLiveNoFirstSkipsStep16() {
    if (!state || !online.enabled || state.gameMode !== "bid" || state.onlineBidMode !== "live") return;
    const auction = state.liveAuction;
    if (!auction?.noFirstBidKeys || !state.users) return;
    Object.keys(auction.noFirstBidKeys).forEach(key => {
      if (!auction.noFirstBidKeys[key]) return;
      const user = state.users.find(u => safeKeyStep16(u.name) === key);
      if (!user) return;
      // If the no-first-bid marker exists but the counter has not moved at all, repair it.
      // This catches phone/browser timing cases where the state marker saved but the skip counter did not.
      if (clampSkipsStep16(user.bidSkips) < 1) user.bidSkips = 1;
      user.bidSkips = clampSkipsStep16(user.bidSkips);
    });
  }

  function addRealActionBannerStep16() {
    document.querySelectorAll(".online-action-banner-step16").forEach(n => n.remove());
    if (!online.enabled || !state || state.gameMode !== "bid" || ratingsRevealed) return;
    const card = document.querySelector(".online-action-needed-step15");
    if (!card) return;
    const banner = document.createElement("div");
    banner.className = "online-action-banner-step16";
    const isLive = state.onlineBidMode === "live";
    banner.innerHTML = `<span>YOUR GO</span><span>${isLive ? "Bid or pass" : "Submit your bid"}</span>`;
    card.insertBefore(banner, card.firstChild);
  }

  function polishBoardHeaderTextStep16() {
    if (!online.enabled || !state) return;
    const eyebrow = document.querySelector(".teams-card > .section-title-row .eyebrow");
    const title = document.querySelector(".teams-card > .section-title-row h2");
    if (eyebrow) eyebrow.textContent = "Draft board";
    if (title) title.textContent = "Teams";
  }

  function applyStep16() {
    injectStep16Styles();
    normaliseSkipsStep16();
    syncLiveNoFirstSkipsStep16();
    polishBoardHeaderTextStep16();
    // Wait a frame so Step 15 has had chance to add the active class.
    setTimeout(addRealActionBannerStep16, 0);
  }

  const previousRenderStep16 = render;
  render = function (...args) {
    const result = previousRenderStep16.apply(this, args);
    applyStep16();
    return result;
  };

  const previousApplyRemoteDataStep16 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep16.apply(this, args);
    applyStep16();
    return result;
  };

  const previousRenderOnlineBidControlsStep16 = renderOnlineBidControlsV38;
  renderOnlineBidControlsV38 = function (...args) {
    const result = previousRenderOnlineBidControlsStep16.apply(this, args);
    applyStep16();
    return result;
  };

  const previousResetStep16 = resetGame;
  resetGame = function (...args) {
    const result = previousResetStep16.apply(this, args);
    document.querySelectorAll(".online-action-banner-step16").forEach(n => n.remove());
    return result;
  };

  applyStep16();
})();

// --- step17 online headers action highlight cleanup and skip hardening ---
// Polishes online headers, restores a clear active-input highlight, removes duplicate helper/status text,
// and hardens live-auction skip behaviour.
(function () {
  function injectStep17Styles() {
    if ($("step17OnlineHeaderActionStyles")) return;
    const style = document.createElement("style");
    style.id = "step17OnlineHeaderActionStyles";
    style.textContent = `
      /* Make the main online action title match the polished draft-board header style. */
      body.online-game-active-step12 .draft-card > .turn-row,
      body.online-game-active-step12 .teams-card > .section-title-row {
        position: sticky;
        top: 0;
        z-index: 12;
        margin: -4px -4px 18px !important;
        padding: 16px 16px !important;
        border-radius: 22px !important;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #2563eb) !important;
        color: #ffffff !important;
        box-shadow: 0 18px 44px rgba(15,23,42,.20) !important;
        border: 1px solid rgba(255,255,255,.18) !important;
        backdrop-filter: blur(10px);
      }
      body.online-game-active-step12 .draft-card > .turn-row .eyebrow,
      body.online-game-active-step12 .teams-card > .section-title-row .eyebrow {
        display: inline-flex !important;
        width: fit-content !important;
        padding: 5px 9px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,.16) !important;
        color: #bfdbfe !important;
        font-size: .68rem !important;
        letter-spacing: .11em !important;
        font-weight: 950 !important;
      }
      body.online-game-active-step12 .draft-card > .turn-row h2,
      body.online-game-active-step12 .teams-card > .section-title-row h2 {
        margin: 0 !important;
        color: #ffffff !important;
        font-size: clamp(1.5rem, 2.8vw, 2.25rem) !important;
        line-height: 1.05 !important;
        font-weight: 950 !important;
      }
      body.online-game-active-step12 .draft-card > .turn-row .lives-pill,
      body.online-game-active-step12 .draft-card > .turn-row .online-room-mini-step12 {
        background: rgba(255,255,255,.16) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255,255,255,.18) !important;
      }
      body.online-game-active-step12 .teams-card > .section-title-row h2::after {
        content: "Live teams";
        display: block;
        margin-top: 4px;
        font-size: .78rem;
        line-height: 1.2;
        color: rgba(255,255,255,.76);
        font-weight: 800;
      }

      /* Strong, reliable highlight for the exact online bidding section the user must use. */
      body.online-game-active-step12 .online-action-needed-step17 {
        position: relative !important;
        border: 4px solid #22c55e !important;
        box-shadow: 0 0 0 6px rgba(34,197,94,.18), 0 22px 54px rgba(15,23,42,.20) !important;
        background: linear-gradient(180deg, #ffffff, #f0fdf4) !important;
      }
      .online-action-banner-step17 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        margin: -2px 0 14px;
        padding: 12px 14px;
        border-radius: 16px;
        background: linear-gradient(135deg, #16a34a, #86efac);
        color: #052e16;
        font-weight: 950;
        font-size: .95rem;
        box-shadow: 0 12px 28px rgba(34,197,94,.24);
        box-sizing: border-box;
      }
      .online-action-banner-step17 span:last-child {
        font-size: .76rem;
        opacity: .88;
      }
      body.online-game-active-step12 .online-action-needed-step17 input[type="number"] {
        border-color: #16a34a !important;
        box-shadow: 0 0 0 5px rgba(34,197,94,.16) !important;
      }
      body.online-game-active-step12 .online-action-needed-step17 .btn-primary,
      body.online-game-active-step12 .online-action-needed-step17 #submitLiveBidBtnStep2,
      body.online-game-active-step12 .online-action-needed-step17 #submitBlindBidBtn {
        box-shadow: 0 12px 30px rgba(37,99,235,.25) !important;
      }
      @media (max-width: 720px) {
        body.online-game-active-step12 .draft-card > .turn-row,
        body.online-game-active-step12 .teams-card > .section-title-row {
          margin: 0 0 14px !important;
          padding: 14px !important;
          border-radius: 20px !important;
        }
        body.online-game-active-step12 .draft-card > .turn-row h2,
        body.online-game-active-step12 .teams-card > .section-title-row h2 {
          font-size: 1.45rem !important;
        }
        .online-action-banner-step17 {
          position: sticky;
          top: 8px;
          z-index: 30;
          padding: 13px 14px;
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function clampSkipsStep17(value) {
    const n = Math.max(0, Math.floor(Number(value || 0)));
    return Math.min(BID_SKIPS_ALLOWED, n);
  }

  function userKeyStep17(value) {
    return typeof safeKey === "function" ? safeKey(value) : String(value || "").trim().toLowerCase();
  }

  // Make the global skip helper robust for all online bidding calls.
  if (typeof onlineIncrementSkipV44 === "function") {
    onlineIncrementSkipV44 = function (user) {
      if (!user) return;
      user.bidSkips = clampSkipsStep17(Number(user.bidSkips || 0) + 1);
    };
  }
  if (typeof onlineBidSkipsLeftV44 === "function") {
    onlineBidSkipsLeftV44 = function (user) {
      return Math.max(0, BID_SKIPS_ALLOWED - clampSkipsStep17(user?.bidSkips));
    };
  }
  if (typeof onlineBidSkipsUsedV44 === "function") {
    onlineBidSkipsUsedV44 = function (user) {
      return clampSkipsStep17(user?.bidSkips);
    };
  }

  function findActionCardStep17() {
    if (!online.enabled || !state || state.gameMode !== "bid" || ratingsRevealed) return null;
    const blindBtn = $("submitBlindBidBtn");
    if (blindBtn && !blindBtn.disabled) return blindBtn.closest(".bid-order-card");
    const liveBidBtn = $("submitLiveBidBtnStep2");
    const livePassBtn = $("passLiveBidBtnStep2");
    if ((liveBidBtn && !liveBidBtn.disabled) || (livePassBtn && !livePassBtn.disabled)) {
      return (liveBidBtn || livePassBtn).closest(".live-auction-panel-step2, .bid-order-card");
    }
    return null;
  }

  function applyActionHighlightStep17() {
    document.querySelectorAll(".online-action-needed-step17").forEach(card => card.classList.remove("online-action-needed-step17"));
    document.querySelectorAll(".online-action-banner-step17").forEach(n => n.remove());
    const card = findActionCardStep17();
    if (!card) return;
    card.classList.add("online-action-needed-step17");
    const banner = document.createElement("div");
    banner.className = "online-action-banner-step17";
    const isLive = state?.onlineBidMode === "live";
    banner.innerHTML = `<span>YOUR GO</span><span>${isLive ? "Bid or pass" : "Submit your bid"}</span>`;
    card.insertBefore(banner, card.firstChild);
  }

  function polishHeadersStep17() {
    if (!online.enabled || !state) return;
    const boardEyebrow = document.querySelector(".teams-card > .section-title-row .eyebrow");
    const boardTitle = document.querySelector(".teams-card > .section-title-row h2");
    if (boardEyebrow) boardEyebrow.textContent = "Draft board";
    if (boardTitle) boardTitle.textContent = "Teams";
  }

  function removeDuplicateHelperTextStep17() {
    if (!online.enabled || !state) return;
    if (els?.message) {
      const txt = (els.message.textContent || "").trim();
      if (/^Live auction open for/i.test(txt) || /^It is your turn/i.test(txt) || /^Active player pool/i.test(txt)) {
        els.message.textContent = "";
      }
    }
    const pill = document.getElementById("activeYearRangePillStep5");
    if (pill && online.enabled) pill.style.display = "none";
  }

  function soloPoolTextNoCountStep17() {
    const pill = document.getElementById("activeYearRangePillStep5");
    if (!pill || online.enabled) return;
    pill.style.display = "";
    pill.textContent = pill.textContent.replace(/\s*\(\d+\s+players\)/i, "");
  }

  function repairNoFirstBidSkipStep17() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live") return;
    const auction = state.liveAuction;
    if (!auction?.noFirstBidKeys || !state.users) return;
    Object.keys(auction.noFirstBidKeys).forEach(key => {
      if (!auction.noFirstBidKeys[key]) return;
      const user = state.users.find(u => userKeyStep17(u.name) === key);
      if (!user) return;
      // If no-first-bid is recorded but the skip counter did not move, repair to at least 1.
      if (clampSkipsStep17(user.bidSkips) < 1) user.bidSkips = 1;
      user.bidSkips = clampSkipsStep17(user.bidSkips);
    });
  }

  function applyStep17() {
    injectStep17Styles();
    repairNoFirstBidSkipStep17();
    polishHeadersStep17();
    removeDuplicateHelperTextStep17();
    soloPoolTextNoCountStep17();
    setTimeout(applyActionHighlightStep17, 0);
  }

  const previousRenderStep17 = render;
  render = function (...args) {
    const result = previousRenderStep17.apply(this, args);
    applyStep17();
    return result;
  };

  const previousApplyRemoteDataStep17 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep17.apply(this, args);
    applyStep17();
    return result;
  };

  const previousRenderOnlineBidControlsStep17 = renderOnlineBidControlsV38;
  renderOnlineBidControlsV38 = function (...args) {
    const result = previousRenderOnlineBidControlsStep17.apply(this, args);
    applyStep17();
    return result;
  };

  const previousSetMessageStep17 = setMessage;
  setMessage = function (message) {
    const txt = String(message || "");
    if (online.enabled && (/^Live auction open for/i.test(txt) || /^It is your turn/i.test(txt) || /^Active player pool/i.test(txt))) {
      return previousSetMessageStep17.call(this, "");
    }
    return previousSetMessageStep17.apply(this, arguments);
  };

  const previousResetStep17 = resetGame;
  resetGame = function (...args) {
    const result = previousResetStep17.apply(this, args);
    document.querySelectorAll(".online-action-banner-step17").forEach(n => n.remove());
    return result;
  };

  applyStep17();
})();

