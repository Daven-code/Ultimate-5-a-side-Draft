/******************************************************************************
 * LaunchTrailerPortrait.tsx
 * ============================================================================
 *
 * Portrait version of the Ultimate 5-a-side launch trailer.
 ******************************************************************************/

import React from "react";
import {Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";

import {IntroPortrait} from "../scenes/IntroPortrait";
import {HowToPlayPortrait} from "../scenes/HowToPlayPortrait";
import {BuildTeamScenePortrait} from "../scenes/BuildTeamScenePortrait";
import {OutroPortrait} from "../scenes/OutroPortrait";

export const LaunchTrailerPortrait: React.FC = () => {

  return (

    <>

      <AudioTrack
      music="Sport.mp3"
      musicStart={120}
    />

      <Sequence
        from={0}
        durationInFrames={120}
      >
        <IntroPortrait/>
      </Sequence>

      <Sequence
        from={120}
        durationInFrames={150}
      >
        <HowToPlayPortrait/>
      </Sequence>

      <Sequence
        from={270}
        durationInFrames={180}
      >
        <BuildTeamScenePortrait/>
      </Sequence>

      <Sequence
        from={450}
        durationInFrames={150}
      >
        <OutroPortrait/>
      </Sequence>

    </>

  );

};