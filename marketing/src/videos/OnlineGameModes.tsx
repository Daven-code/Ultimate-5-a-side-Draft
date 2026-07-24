/******************************************************************************
 * OnlineGameModes.tsx
 * =============================================================================
 * Landscape promo video for online game modes.
 * 38 seconds / 1140 frames. Intro, modes section and outro are extended.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {AudioTrack} from "../components/AudioTrack";
import {OnlineFeatureIntro} from "../scenes/OnlineFeatureIntro";
import {OnlineModesScene} from "../scenes/OnlineModesScene";
import {OnlineAuctionBattleScene} from "../scenes/OnlineAuctionBattleScene";
import {FeatureOutro} from "../scenes/FeatureOutro";
import {onlineGameModes} from "../data/onlineGameModes";

export const OnlineGameModes: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack />
      <Sequence from={0} durationInFrames={150}>
        <OnlineFeatureIntro title={onlineGameModes.title} subtitle={onlineGameModes.subtitle} />
      </Sequence>
      <Sequence from={150} durationInFrames={210}>
        <OnlineModesScene title={onlineGameModes.modesTitle} modes={onlineGameModes.modes} />
      </Sequence>
      <Sequence from={360} durationInFrames={600}>
        <OnlineAuctionBattleScene title={onlineGameModes.roomTitle} subtitle={onlineGameModes.roomSubtitle} budgetTitle={onlineGameModes.budgetTitle} players={onlineGameModes.auctionPlayers} />
      </Sequence>
      <Sequence from={960} durationInFrames={180}>
        <FeatureOutro headline={onlineGameModes.outroHeadline} website={onlineGameModes.website} buttonText={onlineGameModes.buttonText} />
      </Sequence>
    </AbsoluteFill>
  );
};
