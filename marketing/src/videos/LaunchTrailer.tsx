/******************************************************************************
 * LaunchTrailer.tsx
 * =============================================================================
 *
 * FINAL TRAILER
 *
 * 0-4 sec   Intro
 * 4-9 sec   Pick • Build • Compete
 * 9-15 sec  Build Team
 * 15-20 sec Outro
 ******************************************************************************/

import React from "react";
import {Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";

import {Intro} from "../scenes/Intro";
import {HowToPlay} from "../scenes/HowToPlay";
import {BuildTeamScene} from "../scenes/BuildTeamScene";
import {Outro} from "../scenes/Outro";

export const LaunchTrailer: React.FC = () => {

  return(

    <>

      <AudioTrack
      music="Sport6.mp3"
      musicStart={0}
    />

      <Sequence
        from={0}
        durationInFrames={120}
      >
        <Intro/>
      </Sequence>

      <Sequence
        from={120}
        durationInFrames={150}
      >
        <HowToPlay/>
      </Sequence>

      <Sequence
        from={270}
        durationInFrames={300}
      >
        <BuildTeamScene/>
      </Sequence>

      <Sequence
        from={570}
        durationInFrames={150}
      >
        <Outro/>
      </Sequence>

    </>

  );

};