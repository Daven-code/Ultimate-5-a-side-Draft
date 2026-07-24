/******************************************************************************
 * OnlineGameModesPortrait.tsx
 * =============================================================================
 * Portrait promo video for TikTok / Reels / Shorts.
 * 38 seconds / 1140 frames. Intro, modes section and outro are extended.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {AudioTrack} from "../components/AudioTrack";
import {OnlineFeatureIntroPortrait} from "../scenes/OnlineFeatureIntroPortrait";
import {OnlineModesScenePortrait} from "../scenes/OnlineModesScenePortrait";
import {OnlineAuctionBattleScenePortrait} from "../scenes/OnlineAuctionBattleScenePortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";
import {onlineGameModes} from "../data/onlineGameModes";

export const OnlineGameModesPortrait: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack />
      <Sequence from={0} durationInFrames={150}>
        <OnlineFeatureIntroPortrait title={onlineGameModes.title} subtitle={onlineGameModes.subtitle} />
      </Sequence>
      <Sequence from={150} durationInFrames={210}>
        <OnlineModesScenePortrait title={onlineGameModes.modesTitle} modes={onlineGameModes.modes} />
      </Sequence>
      <Sequence from={360} durationInFrames={600}>
        <OnlineAuctionBattleScenePortrait title={onlineGameModes.roomTitle} subtitle={onlineGameModes.roomSubtitle} budgetTitle={onlineGameModes.budgetTitle} players={onlineGameModes.auctionPlayers} />
      </Sequence>
      <Sequence from={960} durationInFrames={180}>
        <FeatureOutroPortrait headline={onlineGameModes.outroHeadline} website={onlineGameModes.website} buttonText={onlineGameModes.buttonText} />
      </Sequence>
    </AbsoluteFill>
  );
};
