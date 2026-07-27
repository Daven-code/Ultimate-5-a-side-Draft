/******************************************************************************
 * AcceptDeclineRonaldinho.tsx
 * =============================================================================
 * Landscape promo: Ronaldinho 2006 Accept or Decline.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntro} from "../scenes/FeatureIntro";
import {FeatureOutro} from "../scenes/FeatureOutro";
import {AcceptDeclineScene} from "../scenes/AcceptDeclineScene";
import {acceptDeclineRonaldinho} from "../data/acceptDeclineRonaldinho";

const introFrames = acceptDeclineRonaldinho.introFrames;
const challengeFrames = acceptDeclineRonaldinho.challengeFrames;
const outroFrames = acceptDeclineRonaldinho.outroFrames;

export const AcceptDeclineRonaldinho: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack music="Sport5.mp3" />

      <Sequence from={0} durationInFrames={introFrames}>
        <FeatureIntro title={acceptDeclineRonaldinho.title} subtitle={acceptDeclineRonaldinho.subtitle} />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={challengeFrames}>
        <AcceptDeclineScene />
      </Sequence>

      <Sequence from={introFrames + challengeFrames} durationInFrames={outroFrames}>
        <FeatureOutro
          headline={acceptDeclineRonaldinho.outroHeadline}
          website={acceptDeclineRonaldinho.website}
          buttonText={acceptDeclineRonaldinho.buttonText}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
