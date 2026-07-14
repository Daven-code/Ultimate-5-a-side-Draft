/******************************************************************************
 * EasySoloChallenge.tsx
 ******************************************************************************/

import React from "react";
import {Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";

import {FeatureIntro} from "../scenes/FeatureIntro";
import {BuildTeamScene} from "../scenes/BuildTeamScene";
import {FeatureOutro} from "../scenes/FeatureOutro";

import {easySoloChallenge} from "../data/easySoloChallenge";

export const EasySoloChallenge: React.FC = () => {

  return (

    <>

      <AudioTrack
        music="Sport3.mp3"
        musicStart={43}
        />

      <Sequence
        from={0}
        durationInFrames={90}
      >
        <FeatureIntro
          title={easySoloChallenge.title}
          subtitle={easySoloChallenge.subtitle}
        />
      </Sequence>

      <Sequence
        from={90}
        durationInFrames={240}
      >
        <BuildTeamScene
          title="BUILD YOUR DREAM TEAM"
          team={easySoloChallenge.team}
          score={easySoloChallenge.score}
        />
      </Sequence>

      <Sequence
        from={330}
        durationInFrames={120}
      >
        <FeatureOutro
          headline={`CAN YOU BEAT ${easySoloChallenge.score}?`}
          website="ultimate5aside.app"
          buttonText="PLAY FREE NOW"
        />
      </Sequence>

    </>

  );

};