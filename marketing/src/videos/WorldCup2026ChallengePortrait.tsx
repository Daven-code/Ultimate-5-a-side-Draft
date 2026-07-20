/*****************************************************************************
 * WorldCup2026ChallengePortrait.tsx
 * =============================================================================
 * Portrait feature video for TikTok / Reels / Shorts.
 *
 * Update:
 * - BuildTeamScenePortrait is held for an extra 2 seconds / 60 frames.
 *****************************************************************************/

import React from "react";
import {AbsoluteFill, Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";
import {BuildTeamScenePortrait} from "../scenes/BuildTeamScenePortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";
import {WorldCup2026FeatureIntroPortrait} from "../scenes/WorldCup2026FeatureIntroPortrait";

import {worldCup2026Challenge} from "../data/worldCup2026Challenge";

export const WorldCup2026ChallengePortrait: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack music="Sport4.mp3" />

      <Sequence from={0} durationInFrames={120}>
        <WorldCup2026FeatureIntroPortrait
          title={worldCup2026Challenge.title}
          subtitle={worldCup2026Challenge.subtitle}
        />
      </Sequence>

      <Sequence from={120} durationInFrames={240}>
        <BuildTeamScenePortrait
          title={worldCup2026Challenge.buildTitle}
          team={worldCup2026Challenge.team}
          score={worldCup2026Challenge.score}
        />
      </Sequence>

      <Sequence from={360} durationInFrames={120}>
        <FeatureOutroPortrait
          headline={worldCup2026Challenge.outroHeadline}
          website={worldCup2026Challenge.website}
          buttonText={worldCup2026Challenge.buttonText}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
