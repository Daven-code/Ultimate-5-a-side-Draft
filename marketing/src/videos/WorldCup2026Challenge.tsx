/*****************************************************************************
 * WorldCup2026Challenge.tsx
 * =============================================================================
 * Landscape feature video for the new World Cup 2026 game mode.
 *
 * Uses the same reusable scene logic as EasySoloChallenge:
 * - FeatureIntro
 * - BuildTeamScene
 * - FeatureOutro
 *****************************************************************************/

import React from "react";
import {AbsoluteFill, Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntro} from "../scenes/FeatureIntro";
import {BuildTeamScene} from "../scenes/BuildTeamScene";
import {FeatureOutro} from "../scenes/FeatureOutro";

import {worldCup2026Challenge} from "../data/worldCup2026Challenge";

export const WorldCup2026Challenge: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack music="Sport4.mp3" />

      <Sequence from={0} durationInFrames={120}>
        <FeatureIntro
          title={worldCup2026Challenge.title}
          subtitle={worldCup2026Challenge.subtitle}
        />
      </Sequence>

      <Sequence from={120} durationInFrames={180}>
        <BuildTeamScene
          title={worldCup2026Challenge.buildTitle}
          team={worldCup2026Challenge.team}
          score={worldCup2026Challenge.score}
        />
      </Sequence>

      <Sequence from={300} durationInFrames={120}>
        <FeatureOutro
          headline={worldCup2026Challenge.outroHeadline}
          website={worldCup2026Challenge.website}
          buttonText={worldCup2026Challenge.buttonText}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
