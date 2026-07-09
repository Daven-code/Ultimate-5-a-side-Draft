/* ============================================================
   05-solo-modes.js
   SOLO MODES: Standard Solo, Ultimate Solo, Easy Solo, solo setup page, solo in-game layout and results polish

   Refactor note:
   This file is loaded as a normal browser script, not an ES module.
   Files must remain in the order listed in index.html because the
   original working app.js used sequential overrides.
   ============================================================ */

/* ============================================================
   QUICK EDIT GUIDE - SOLO MODE TEXT AND PLAYER POOLS

   Search in this file for:
   - "Ultimate Solo Mode" to change Ultimate Solo page text.
   - "Easy Solo Challenge" to change Easy Solo page text.

   Easy Solo pool limits are controlled in 04-live-auction-and-year-filter.js
   inside function filteredPlayersStep5(). Current intended behaviour:
   - GK/DEF/FWD = top 5 per year
   - MID = top 10 per year

   Ultimate Solo Mode ignores the year filter and uses all players.
   ============================================================ */

// --- step7 solo challenge local mode only ---
// Local play is now a single-player Solo Challenge only.
// Local bidding and local multi-user setup are removed from the UI/flow.
// Online modes are deliberately left unchanged: online draft, blind bidding and live auction remain available.
(function () {
  function injectSoloChallengeStylesStep7() {
    if ($("soloChallengeStylesStep7")) return;
    const style = document.createElement("style");
    style.id = "soloChallengeStylesStep7";
    style.textContent = `
      .solo-local-hidden-step7 { display: none !important; }
      .solo-setup-card-step7 {
        margin: 12px 0 14px;
        padding: 14px;
        background: linear-gradient(135deg, #ecfdf5, #eff6ff);
        border: 1px solid #bfdbfe;
        border-radius: 18px;
      }
      .solo-setup-card-step7 h3 {
        margin: 0 0 6px;
        color: #0f172a;
        font-size: 1.15rem;
      }
      .solo-setup-card-step7 p {
        margin: 0;
        color: #475569;
        font-weight: 800;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(style);
  }

  function adjustEntryPanelToSoloStep7() {
    injectSoloChallengeStylesStep7();
    const localCard = document.querySelector(".local-card");
    if (!localCard) return;
    const heading = localCard.querySelector("h3");
    const copy = localCard.querySelector("p");
    const button = $("startLocalGameBtn");
    if (heading)
    heading.textContent =
    "Solo Challenge";

    if (button)
    button.textContent =
    "Set up Solo Challenge";
    if (copy) copy.textContent = "Play a quick single-player draft on this device. Pick, accept or decline players and build your best 5-a-side team.";
  }

  function configureSoloSetupStep7() {
    injectSoloChallengeStylesStep7();
    selectedGameMode = "draft";

    const heroEyebrow = document.querySelector("#setupPanel .setup-copy .eyebrow");
    const heroTitle = document.querySelector("#setupPanel .setup-copy h2");
    const heroLead = document.querySelector("#setupPanel .setup-copy .setup-lead");
    if (window.challengePreset === "ultimate") {

    if (heroEyebrow)
        heroEyebrow.textContent =
            "⭐ Ultimate Solo Mode";

    if (heroTitle)
        heroTitle.textContent =
            "Ultimate Solo Mode";

    if (heroLead)
        heroLead.textContent =
            "Full player database unlocked. Every year is included, and the year range filter is ignored.";

    if (els.startBtn)
        els.startBtn.textContent =
            "Start Ultimate Solo Mode";

    setTimeout(() => {

    const yearCard =
        document.getElementById("localYearSlicerHolderStep4");

    const sliders =
        document.querySelectorAll('input[id*="Year"][type="range"]');

    if (yearCard) {
        yearCard.style.opacity = "0.4";
        yearCard.style.pointerEvents = "none";
    }

    sliders.forEach(slider => {
        slider.disabled = true;
    });

    const label =
        document.querySelector("#localYearSlicerHolderStep4 label");

    if (label) {
        label.textContent =
            "Player pool locked to all years";
    }

    const values =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-values-step4");

    if (values) {
        values.innerHTML =
            "<span style='width:100%;text-align:center;'>All years active</span>";
    }

    const help =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-help-step4");

    if (help) {
        help.textContent =
            "";
    }

    const soloIntro =
    document.getElementById("soloSetupIntroStep7");

    if (soloIntro) {
        soloIntro.style.display = "none";
    }

}, 0);

} else if (window.challengePreset === "easy") {

    if (heroEyebrow)
        heroEyebrow.textContent =
            "🎯 Easy Solo Challenge";

    if (heroTitle)
        heroTitle.textContent =
            "Easy Solo Challenge";

    if (heroLead)
        heroLead.textContent =
            "Only the elite players are available. Choose a year range and build your dream team.";

    if (els.startBtn)
        els.startBtn.textContent =
            "Start Easy Solo Challenge";

    setTimeout(() => {

    const yearCard =
        document.getElementById("localYearSlicerHolderStep4");

    const sliders =
        document.querySelectorAll('input[id*="Year"][type="range"]');

    if (yearCard) {
        yearCard.style.opacity = "";
        yearCard.style.pointerEvents = "";
    }

    sliders.forEach(slider => {
        slider.disabled = false;
    });

    const values =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-values-step4");

    if (values) {
        values.innerHTML = `
            <span>From <strong id="localYearStartValueStep4">2005</strong></span>
            <span>To <strong id="localYearEndValueStep4">2026</strong></span>
        `;
    }

    const soloIntro =
    document.getElementById("soloSetupIntroStep7");

    if (soloIntro) {
        soloIntro.style.display = "";
    }

}, 0);

} else {

    if (heroEyebrow)
        heroEyebrow.textContent =
            "Solo Challenge";

    if (heroTitle)
        heroTitle.textContent =
            "Choose your 5-a-side challenge";

    if (heroLead)
        heroLead.textContent =
            "Pick a game mode, add your players, then build the strongest five-a-side team from the top-rated players across the years.";

    if (els.startBtn)
        els.startBtn.textContent =
            "Start Solo Challenge";

    setTimeout(() => {

    const yearCard =
        document.getElementById("localYearSlicerHolderStep4");

    const sliders =
        document.querySelectorAll('input[id*="Year"][type="range"]');

    if (yearCard) {
        yearCard.style.opacity = "";
        yearCard.style.pointerEvents = "";
    }

    sliders.forEach(slider => {
        slider.disabled = false;
    });

    const values =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-values-step4");

    if (values) {
        values.innerHTML = `
            <span>From <strong id="localYearStartValueStep4">2005</strong></span>
            <span>To <strong id="localYearEndValueStep4">2026</strong></span>
        `;
    }

    const soloIntro =
    document.getElementById("soloSetupIntroStep7");

    if (soloIntro) {
        soloIntro.style.display = "";
    }

}, 0);

}


    const setupPanelCard = document.querySelector(".setup-panel-card");
    if (setupPanelCard) {
      let soloIntro = $("soloSetupIntroStep7");
      if (!soloIntro) {
        soloIntro = document.createElement("div");
        soloIntro.id = "soloSetupIntroStep7";
        soloIntro.className = "solo-setup-card-step7";
        const firstLabel = setupPanelCard.querySelector("label");
        if (firstLabel) setupPanelCard.insertBefore(soloIntro, firstLabel);
        else setupPanelCard.prepend(soloIntro);
      }
      if (window.challengePreset === "ultimate") {

  soloIntro.innerHTML = `
    <h3>Ultimate Solo Mode</h3>
    <p>Full player database unlocked. All years are included and the year range filter is ignored.</p>
  `;

} else if (window.challengePreset === "easy") {

  soloIntro.innerHTML = `
    <h3>Easy Solo Challenge</h3>
    <p>Elite player pool. Choose a year range and build your dream 5-a-side team.</p>
  `;

} else {

  soloIntro.innerHTML = `
    <h3>Solo Challenge</h3>
    <p>Single-player draft mode. Complete a GK, DEF, MID, MID and FWD, then reveal your final rating.</p>
  `;

}
    }

    // Hide local-only multi-user / local-bidding controls.
    const chooseGameLabel = document.querySelector(".setup-panel-card > label");
    if (chooseGameLabel) chooseGameLabel.classList.add("solo-local-hidden-step7");
    if (els.gameModeCards) els.gameModeCards.classList.add("solo-local-hidden-step7");
    if (els.userCount) els.userCount.closest("div")?.classList.add("solo-local-hidden-step7");
    if (els.userNameFields) els.userNameFields.classList.add("solo-local-hidden-step7");

    // Keep the decline option available for the Solo Challenge because it belongs to draft mode.
    if (els.excludeDeclinesLabel) els.excludeDeclinesLabel.classList.remove("hidden", "solo-local-hidden-step7");
    if (els.excludeDeclines) els.excludeDeclines.checked = true;

    if (els.gameModeDescription) {

  if (window.challengePreset === "ultimate") {
    els.gameModeDescription.textContent =
      "Ultimate Solo Mode: the full player database is unlocked. The year range filter is ignored.";
  } else if (window.challengePreset === "easy") {
    els.gameModeDescription.textContent =
      "Easy Solo Challenge: only the top rated players in each position from every selected year are available.";
  } else {
    els.gameModeDescription.textContent =
      "Solo Challenge: accept or decline random players to complete your 5-a-side team.";
  }

}

if (els.startBtn) {

  if (window.challengePreset === "ultimate") {
    els.startBtn.textContent =
      "Start Ultimate Solo Mode";
  } else if (window.challengePreset === "easy") {
    els.startBtn.textContent =
      "Start Easy Solo Challenge";
  } else {
    els.startBtn.textContent =
      "Start Solo Challenge";
  }

}
}

  function startSoloChallengeStep7() {
    selectedGameMode = "draft";
    online.enabled = false;
    const soloName = "You";
    startNewGame("draft", [soloName], false);
  }

  const previousInjectEntryPanelStep7 = injectEntryPanel;
  injectEntryPanel = function (...args) {
    const result = previousInjectEntryPanelStep7.apply(this, args);
    adjustEntryPanelToSoloStep7();
    return result;
  };

  const previousUpdateSetupForModeStep7 = updateSetupForMode;
  updateSetupForMode = function (...args) {
    const result = previousUpdateSetupForModeStep7.apply(this, args);
    if (!online.enabled && !state && !els.setupPanel?.classList.contains("hidden")) {
      configureSoloSetupStep7();
    }
    return result;
  };

  document.addEventListener("click", function (event) {
    if (event.target?.closest?.("#startLocalGameBtn")) {
      setTimeout(configureSoloSetupStep7, 0);
    }

    if (event.target?.closest?.("#startBtn") && !online.enabled && !els.setupPanel?.classList.contains("hidden")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      safe(startSoloChallengeStep7)();
    }
  }, true);

  // If the page is already loaded when this patch runs, update the existing front panel now.
  adjustEntryPanelToSoloStep7();
})();

// --- step8 solo challenge setup cleanup and layout polish ---
// Cleans up duplicated Solo Challenge setup text and improves the in-game solo layout.
// Keeps the existing 5-a-side pitch graphics and player names, but gives the player-pick panel more space.
(function () {
  function injectSoloPolishStylesStep8() {
    if ($("soloPolishStylesStep8")) return;
    const style = document.createElement("style");
    style.id = "soloPolishStylesStep8";
    style.textContent = `
      body.solo-challenge-active-step8 #gamePanel.game-grid {
        max-width: 1320px;
        width: min(1320px, calc(100vw - 32px));
        margin-left: auto;
        margin-right: auto;
        grid-template-columns: minmax(0, 1.65fr) minmax(320px, .85fr) !important;
        gap: 22px;
        align-items: start;
      }

      body.solo-challenge-active-step8 .draft-card {
        min-width: 0;
        padding: 24px !important;
        border: 1px solid rgba(255,255,255,.42);
        box-shadow: 0 24px 70px rgba(15,23,42,.18);
      }

      body.solo-challenge-active-step8 .teams-card {
        min-width: 0;
        padding: 18px !important;
        background: rgba(255,255,255,.90);
        border: 1px solid rgba(226,232,240,.9);
        box-shadow: 0 20px 52px rgba(15,23,42,.13);
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row {
        margin-bottom: 10px;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row h2 {
        font-size: 1.45rem;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row .eyebrow {
        font-size: .72rem;
        letter-spacing: .08em;
      }

      body.solo-challenge-active-step8 #teamsContainer.teams-container {
        display: block;
      }

      body.solo-challenge-active-step8 .team-card {
        padding: 14px !important;
        border-radius: 20px !important;
        background: linear-gradient(180deg, rgba(248,250,252,.96), rgba(255,255,255,.98));
        border: 1px solid rgba(203,213,225,.85);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 12px 32px rgba(15,23,42,.10);
      }

      body.solo-challenge-active-step8 .team-card .team-top-row {
        margin-bottom: 10px;
      }

      body.solo-challenge-active-step8 .team-card h3 {
        font-size: 1.1rem;
        margin-bottom: 2px;
      }

      body.solo-challenge-active-step8 .team-meta {
        font-size: .78rem;
      }

      body.solo-challenge-active-step8 .team-card .score {
        font-size: .92rem;
      }

      body.solo-challenge-active-step8 .teams-card .pitch {
        min-height: 420px;
        border-radius: 24px;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player {
        transform: scale(.92);
        transform-origin: center;
      }

      body.solo-challenge-active-step8 .player-card {
        min-height: 340px;
        padding: 24px !important;
        border-radius: 28px !important;
      }

      body.solo-challenge-active-step8 .player-card .player-name {
        font-size: clamp(2rem, 4vw, 3.4rem);
        line-height: 1.02;
      }

      body.solo-challenge-active-step8 .detail-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      body.solo-challenge-active-step8 #draftControls.button-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      body.solo-challenge-active-step8 #draftControls .btn {
        min-height: 48px;
        font-size: 1rem;
      }

      body.solo-challenge-active-step8 .turn-row {
        margin-bottom: 16px;
      }

      body.solo-challenge-active-step8 .turn-row h2 {
        font-size: clamp(1.8rem, 3vw, 2.6rem);
      }

      body.solo-challenge-active-step8 #activeYearRangePillStep5 {
        margin-top: 12px;
      }

      @media (max-width: 980px) {
        body.solo-challenge-active-step8 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(760px, calc(100vw - 24px));
        }

        body.solo-challenge-active-step8 .teams-card {
          order: 2;
        }

        body.solo-challenge-active-step8 .draft-card {
          order: 1;
        }
      }

      @media (max-width: 640px) {
        body.solo-challenge-active-step8 #draftControls.button-row {
          grid-template-columns: 1fr;
        }
        body.solo-challenge-active-step8 .detail-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function cleanupSoloSetupCopyStep8() {
    // Remove the duplicated mode description text.
    if (els?.gameModeDescription) {
      els.gameModeDescription.textContent = "";
      els.gameModeDescription.classList.add("solo-local-hidden-step7");
    }

    // Remove the ratings-hidden tip box on Solo Challenge setup.
    const tipBox = document.querySelector("#setupPanel .setup-note-box");
    if (tipBox) tipBox.classList.add("solo-local-hidden-step7");

    // If the controls grid only exists for hidden user count + hidden tip, hide the shell too.
    const controlsGrid = document.querySelector("#setupPanel .setup-controls-grid");
    if (controlsGrid) controlsGrid.classList.add("solo-local-hidden-step7");
  }

  function isSoloChallengeStateStep8() {
    return !!state && !online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1;
  }

  function applySoloGameLayoutStep8() {
    injectSoloPolishStylesStep8();
    document.body.classList.toggle("solo-challenge-active-step8", isSoloChallengeStateStep8());

    if (isSoloChallengeStateStep8()) {
      if (els.turnEyebrow) els.turnEyebrow.textContent = "Solo Challenge";
      if (els.currentUserLabel) els.currentUserLabel.textContent = "Build your team";
      const teamsTitle = document.querySelector(".teams-card .section-title-row h2");
      const teamsEyebrow = document.querySelector(".teams-card .section-title-row .eyebrow");
      if (teamsTitle) teamsTitle.textContent = "Your team";
      if (teamsEyebrow) teamsEyebrow.textContent = "5-a-side pitch";
    }
  }

  const previousConfigureSoloSetupStep8 = typeof configureSoloSetupStep7 === "function" ? configureSoloSetupStep7 : null;
  if (previousConfigureSoloSetupStep8) {
    configureSoloSetupStep7 = function (...args) {
      const result = previousConfigureSoloSetupStep8.apply(this, args);
      cleanupSoloSetupCopyStep8();
      return result;
    };
  }

  const previousUpdateSetupForModeStep8 = updateSetupForMode;
  updateSetupForMode = function (...args) {
    const result = previousUpdateSetupForModeStep8.apply(this, args);
    if (!online.enabled && !state && !els.setupPanel?.classList.contains("hidden")) {
      cleanupSoloSetupCopyStep8();
    }
    return result;
  };

  document.addEventListener("click", function (event) {
    if (event.target?.closest?.("#startLocalGameBtn")) {
      setTimeout(cleanupSoloSetupCopyStep8, 0);
    }
  }, true);

  const previousRenderStep8 = render;
  render = function (...args) {
    const result = previousRenderStep8.apply(this, args);
    applySoloGameLayoutStep8();
    return result;
  };

  const previousStartNewGameStep8 = startNewGame;
  startNewGame = function (...args) {
    const result = previousStartNewGameStep8.apply(this, args);
    applySoloGameLayoutStep8();
    return result;
  };

  const previousResetGameStep8 = resetGame;
  resetGame = function (...args) {
    const result = previousResetGameStep8.apply(this, args);
    document.body.classList.remove("solo-challenge-active-step8");
    return result;
  };

  // Initial safety pass.
  injectSoloPolishStylesStep8();
  cleanupSoloSetupCopyStep8();
  applySoloGameLayoutStep8();
})();

// --- step9 solo layout rebalance and centred results ---
// Rebalances the Solo Challenge layout after Step 8:
// - Makes the pitch/draft board wider again so names sit correctly on the existing pitch graphic.
// - Restores the label to "Draft board".
// - Centres and polishes the solo results page.
(function () {
  function injectSoloRebalanceStylesStep9() {
    if ($("soloRebalanceStylesStep9")) return;
    const style = document.createElement("style");
    style.id = "soloRebalanceStylesStep9";
    style.textContent = `
      body.solo-challenge-active-step8 #gamePanel.game-grid {
        max-width: 1280px !important;
        width: min(1280px, calc(100vw - 32px)) !important;
        grid-template-columns: minmax(0, 1.18fr) minmax(440px, .92fr) !important;
        gap: 22px !important;
        align-items: start;
      }

      body.solo-challenge-active-step8 .draft-card {
        padding: 22px !important;
      }

      body.solo-challenge-active-step8 .teams-card {
        padding: 20px !important;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row h2 {
        font-size: 1.65rem !important;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row .eyebrow {
        font-size: .78rem !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch {
        min-height: 470px !important;
        border-radius: 24px;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player {
        transform: none !important;
        transform-origin: center;
      }

      body.solo-challenge-active-step8 .player-card {
        min-height: 315px !important;
      }

      body.solo-challenge-active-step8 .player-card .player-name {
        font-size: clamp(1.85rem, 3.4vw, 3rem) !important;
      }

      body.solo-challenge-active-step8 .team-card {
        padding: 16px !important;
      }

      body.solo-challenge-active-step8 .team-card h3 {
        font-size: 1.2rem !important;
      }

      body.solo-results-centred-step9 #resultsPanel.finished-results-page {
        max-width: 980px !important;
        width: min(980px, calc(100vw - 32px)) !important;
        margin-left: auto !important;
        margin-right: auto !important;
        text-align: center;
      }

      body.solo-results-centred-step9 .finished-hero {
        grid-template-columns: 1fr !important;
        justify-items: center;
        text-align: center;
      }

      body.solo-results-centred-step9 .winner-badge-large {
        margin-left: auto;
        margin-right: auto;
        justify-content: center;
      }

      body.solo-results-centred-step9 .finished-actions {
        justify-content: center !important;
      }

      body.solo-results-centred-step9 .finished-results-grid {
        grid-template-columns: minmax(320px, 620px) !important;
        justify-content: center !important;
        align-items: start;
      }

      body.solo-results-centred-step9 .finished-team-card {
        text-align: left;
      }

      body.solo-results-centred-step9 .finished-team-top {
        text-align: left;
      }

      body.solo-results-centred-step9 .finished-team-card .pitch {
        margin-left: auto;
        margin-right: auto;
      }

      @media (max-width: 1100px) {
        body.solo-challenge-active-step8 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(820px, calc(100vw - 24px)) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isSoloStep9() {
    return !!state && !online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1;
  }

  function restoreDraftBoardLabelsStep9() {
    if (!isSoloStep9()) return;
    const teamsTitle = document.querySelector(".teams-card .section-title-row h2");
    const teamsEyebrow = document.querySelector(".teams-card .section-title-row .eyebrow");
    if (teamsTitle) teamsTitle.textContent = "Draft board";
    if (teamsEyebrow) teamsEyebrow.textContent = "Your team";
  }

  function syncSoloResultClassStep9() {
    const showCentred = !!(ratingsRevealed && state && !online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1);
    document.body.classList.toggle("solo-results-centred-step9", showCentred);
  }

  const prevRenderStep9 = render;
  render = function (...args) {
    const result = prevRenderStep9.apply(this, args);
    injectSoloRebalanceStylesStep9();
    restoreDraftBoardLabelsStep9();
    syncSoloResultClassStep9();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === "function") {
    const prevFinishedStep9 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = prevFinishedStep9.apply(this, args);
      injectSoloRebalanceStylesStep9();
      syncSoloResultClassStep9();
      return result;
    };
  }

  const prevRenderResultsStep9 = renderResults;
  renderResults = function (...args) {
    const result = prevRenderResultsStep9.apply(this, args);
    syncSoloResultClassStep9();
    return result;
  };

  const prevResetStep9 = resetGame;
  resetGame = function (...args) {
    const result = prevResetStep9.apply(this, args);
    document.body.classList.remove("solo-results-centred-step9");
    return result;
  };

  injectSoloRebalanceStylesStep9();
  restoreDraftBoardLabelsStep9();
  syncSoloResultClassStep9();
})();

// --- step10 solo pitch position fix ---
// Fixes Solo Challenge draft board player positions on the pitch.
// Step 9 widened the pitch, but the base pitch-positioning rules were still not ideal for the solo card size.
// These overrides keep the existing 5-a-side pitch graphic, but explicitly centre each slot inside the pitch.
(function () {
  function injectSoloPitchPositionStylesStep10() {
    if ($("soloPitchPositionStylesStep10")) return;
    const style = document.createElement("style");
    style.id = "soloPitchPositionStylesStep10";
    style.textContent = `
      body.solo-challenge-active-step8 .teams-card .pitch {
        position: relative;
        overflow: hidden;
        min-height: 470px !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player {
        position: absolute !important;
        width: min(124px, 28%) !important;
        min-width: 96px;
        max-width: 128px;
        box-sizing: border-box;
        text-align: center;
        transform: translate(-50%, -50%) !important;
        z-index: 3;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.gk {
        left: 50% !important;
        top: 88% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.def {
        left: 50% !important;
        top: 68% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.mid1 {
        left: 34% !important;
        top: 50% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.mid2 {
        left: 66% !important;
        top: 50% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.fwd {
        left: 50% !important;
        top: 24% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player .pos,
      body.solo-challenge-active-step8 .teams-card .pitch-player .name,
      body.solo-challenge-active-step8 .teams-card .pitch-player .club,
      body.solo-challenge-active-step8 .teams-card .pitch-player .year,
      body.solo-challenge-active-step8 .teams-card .pitch-player .rating,
      body.solo-challenge-active-step8 .teams-card .pitch-player .price {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player .name {
        display: block;
        line-height: 1.1;
      }

      body.solo-results-centred-step9 .finished-team-card {
        max-width: 680px;
        margin-left: auto;
        margin-right: auto;
      }

      body.solo-results-centred-step9 .finished-team-card .pitch {
        max-width: 560px;
        width: 100%;
      }

      body.solo-results-centred-step9 .finished-player-list {
        max-width: 560px;
        margin-left: auto;
        margin-right: auto;
      }
    `;
    document.head.appendChild(style);
  }

  const prevRenderStep10 = render;
  render = function (...args) {
    const result = prevRenderStep10.apply(this, args);
    injectSoloPitchPositionStylesStep10();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === "function") {
    const prevFinishedStep10 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = prevFinishedStep10.apply(this, args);
      injectSoloPitchPositionStylesStep10();
      return result;
    };
  }

  injectSoloPitchPositionStylesStep10();
})();

// --- step11 pitch centre line and solo results polish ---
// Tweaks requested after Step 10:
// - Extend the centre line to both pitch edges.
// - Remove active pool player count from the in-game range note.
// - Centre-align the top results hero.
// - Make the solo results pitch wider and less cramped on desktop and mobile.
(function () {
  function injectStep11Styles() {
    if ($("step11SoloPitchResultsStyles")) return;
    const style = document.createElement("style");
    style.id = "step11SoloPitchResultsStyles";
    style.textContent = `
      /* Extend the centre line fully to each pitch edge. */
      body.solo-challenge-active-step8 .pitch::before,
      body.solo-results-centred-step9 .pitch::before {
        left: 0 !important;
        right: 0 !important;
        width: auto !important;
      }

      /* Keep pitch markings inside the rounded pitch but allow the middle line to meet the border. */
      body.solo-challenge-active-step8 .pitch,
      body.solo-results-centred-step9 .pitch {
        overflow: hidden;
      }

      /* Stronger, cleaner top alignment on the solo results page. */
      body.solo-results-centred-step9 #resultsPanel.finished-results-page {
        max-width: 1120px !important;
        width: min(1120px, calc(100vw - 32px)) !important;
        text-align: center !important;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-hero {
        max-width: 760px;
        margin-left: auto !important;
        margin-right: auto !important;
        text-align: center !important;
        justify-items: center !important;
        align-items: center !important;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-hero > div {
        text-align: center !important;
        width: 100%;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-hero h2,
      body.solo-results-centred-step9 #resultsPanel .finished-hero p,
      body.solo-results-centred-step9 #resultsPanel .finished-hero .eyebrow {
        text-align: center !important;
      }

      body.solo-results-centred-step9 #resultsPanel .winner-badge-large {
        margin-left: auto !important;
        margin-right: auto !important;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-actions {
        width: 100%;
        justify-content: center !important;
      }

      /* Wider, more professional solo result card and pitch. */
      body.solo-results-centred-step9 .finished-results-grid {
        grid-template-columns: minmax(360px, 780px) !important;
        justify-content: center !important;
      }

      body.solo-results-centred-step9 .finished-team-card {
        max-width: 780px !important;
        width: 100%;
        margin-left: auto !important;
        margin-right: auto !important;
        padding: 22px !important;
      }

      body.solo-results-centred-step9 .finished-team-card .pitch {
        width: min(640px, 100%) !important;
        max-width: 640px !important;
        min-height: 560px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      body.solo-results-centred-step9 .finished-player-list {
        width: min(640px, 100%) !important;
        max-width: 640px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      body.solo-results-centred-step9 .finished-player-row {
        grid-template-columns: 56px minmax(0, 1fr) 46px !important;
      }

      @media (max-width: 720px) {
        body.solo-results-centred-step9 #resultsPanel.finished-results-page {
          width: min(100vw - 18px, 720px) !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }

        body.solo-results-centred-step9 #resultsPanel .finished-hero {
          max-width: 100%;
          padding: 16px !important;
        }

        body.solo-results-centred-step9 #resultsPanel .finished-actions {
          display: grid !important;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        body.solo-results-centred-step9 .finished-team-card {
          padding: 14px !important;
        }

        body.solo-results-centred-step9 .finished-team-card .pitch {
          width: 100% !important;
          min-height: 500px !important;
        }

        body.solo-results-centred-step9 .finished-player-row {
          grid-template-columns: 50px minmax(0, 1fr) 42px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function updateActivePoolNoteStep11() {
    const range = state?.yearRange;
    const pill = document.getElementById("activeYearRangePillStep5");
    if (!pill) return;

    if (window.challengePreset === "ultimate") {
      pill.textContent = "Active player pool: All years (2005-2026)";
      return;
    }

    if (window.challengePreset === "easy") {
      pill.textContent = "Active player pool: Elite players only";
      return;
    }

    if (range) {
      pill.textContent = `Active player pool: ${range.start} - ${range.end}`;
    }
  }

  const previousRenderStep11 = render;
  render = function (...args) {
    const result = previousRenderStep11.apply(this, args);
    injectStep11Styles();
    updateActivePoolNoteStep11();
    return result;
  };

  if (typeof renderResults === "function") {
    const previousRenderResultsStep11 = renderResults;
    renderResults = function (...args) {
      const result = previousRenderResultsStep11.apply(this, args);
      injectStep11Styles();
      return result;
    };
  }

  if (typeof showFinishedResultsPageV33 === "function") {
    const previousFinishedStep11 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = previousFinishedStep11.apply(this, args);
      injectStep11Styles();
      return result;
    };
  }

  injectStep11Styles();
  updateActivePoolNoteStep11();
})();

