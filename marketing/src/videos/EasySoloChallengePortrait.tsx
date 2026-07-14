/******************************************************************************
 * EasySoloChallengePortrait.tsx
 ******************************************************************************/

import React from "react";
import {Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";

import {FeatureIntroPortrait} from "../scenes/FeatureIntroPortrait";
import {BuildTeamScenePortrait} from "../scenes/BuildTeamScenePortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";

import {easySoloChallenge} from "../data/easySoloChallenge";

export const EasySoloChallengePortrait: React.FC = () => {

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
        <FeatureIntroPortrait
          title={easySoloChallenge.title}
          subtitle={easySoloChallenge.subtitle}
        />
      </Sequence>

      <Sequence
        from={90}
        durationInFrames={240}
      >
        <BuildTeamScenePortrait
          title="BUILD YOUR DREAM TEAM"
          team={easySoloChallenge.team}
          score={easySoloChallenge.score}
        />
      </Sequence>

      <Sequence
        from={330}
        durationInFrames={120}
      >
        <FeatureOutroPortrait
          headline={`CAN YOU BEAT\n${easySoloChallenge.score}?`}
          website="ultimate5aside.app"
          buttonText="PLAY FREE NOW"
        />
      </Sequence>

    </>

  );

};