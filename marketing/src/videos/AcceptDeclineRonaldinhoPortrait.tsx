/******************************************************************************
 * AcceptDeclineRonaldinhoPortrait.tsx
 * =============================================================================
 * Portrait promo: Ronaldinho 2006 Accept or Decline.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntroPortrait} from "../scenes/FeatureIntroPortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";
import {AcceptDeclineScenePortrait} from "../scenes/AcceptDeclineScenePortrait";
import {acceptDeclineRonaldinho} from "../data/acceptDeclineRonaldinho";

const introFrames = acceptDeclineRonaldinho.introFrames;
const challengeFrames = acceptDeclineRonaldinho.challengeFrames;
const outroFrames = acceptDeclineRonaldinho.outroFrames;

export const AcceptDeclineRonaldinhoPortrait: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack music="Sport5.mp3" />

      <Sequence from={0} durationInFrames={introFrames}>
        <FeatureIntroPortrait title={acceptDeclineRonaldinho.title} subtitle={acceptDeclineRonaldinho.subtitle} />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={challengeFrames}>
        <AcceptDeclineScenePortrait />
      </Sequence>

      <Sequence from={introFrames + challengeFrames} durationInFrames={outroFrames}>
        <FeatureOutroPortrait
          headline={acceptDeclineRonaldinho.outroHeadline}
          website={acceptDeclineRonaldinho.website}
          buttonText={acceptDeclineRonaldinho.buttonText}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
