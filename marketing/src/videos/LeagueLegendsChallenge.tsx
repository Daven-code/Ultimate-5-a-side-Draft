import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntro} from "../scenes/FeatureIntro";
import {FeatureOutro} from "../scenes/FeatureOutro";
import {LeagueLegendsAcceptDeclineScene} from "../scenes/LeagueLegendsAcceptDeclineScene";
import {leagueLegendsChallenge} from "../data/leagueLegendsChallenge";

const introFrames = leagueLegendsChallenge.introFrames;
const challengeFrames = leagueLegendsChallenge.challengeFrames;
const outroFrames = leagueLegendsChallenge.outroFrames;

export const LeagueLegendsChallenge: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack music="Sport5.mp3" />
      <Sequence durationInFrames={introFrames}>
        <FeatureIntro title={leagueLegendsChallenge.title} subtitle={leagueLegendsChallenge.subtitle} />
      </Sequence>
      <Sequence from={introFrames} durationInFrames={challengeFrames}>
        <LeagueLegendsAcceptDeclineScene />
      </Sequence>
      <Sequence from={introFrames + challengeFrames} durationInFrames={outroFrames}>
        <FeatureOutro
          headline={leagueLegendsChallenge.outroHeadline}
          website={leagueLegendsChallenge.website}
          buttonText={leagueLegendsChallenge.buttonText}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
