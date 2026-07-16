/*****************************************************************************
 * WorldCup2026ChallengePortrait.tsx
 * =============================================================================
 * Portrait feature video for TikTok / Reels / Shorts.
 *
 * Uses the same reusable portrait scene logic as EasySoloChallengePortrait:
 * - FeatureIntroPortrait
 * - BuildTeamScenePortrait
 * - FeatureOutroPortrait
 *****************************************************************************/

import React from "react";
import {AbsoluteFill, Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntroPortrait} from "../scenes/FeatureIntroPortrait";
import {BuildTeamScenePortrait} from "../scenes/BuildTeamScenePortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";

import {worldCup2026Challenge} from "../data/worldCup2026Challenge";

export const WorldCup2026ChallengePortrait: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack music="Sport4.mp3" />

      <Sequence from={0} durationInFrames={120}>
        <FeatureIntroPortrait
          title={worldCup2026Challenge.title}
          subtitle={worldCup2026Challenge.subtitle}
        />
      </Sequence>

      <Sequence from={120} durationInFrames={180}>
        <BuildTeamScenePortrait
          title={worldCup2026Challenge.buildTitle}
          team={worldCup2026Challenge.team}
          score={worldCup2026Challenge.score}
        />
      </Sequence>

      <Sequence from={300} durationInFrames={120}>
        <FeatureOutroPortrait
          headline={worldCup2026Challenge.outroHeadline}
          website={worldCup2026Challenge.website}
          buttonText={worldCup2026Challenge.buttonText}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
