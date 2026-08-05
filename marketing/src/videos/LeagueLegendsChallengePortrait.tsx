import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntroPortrait} from "../scenes/FeatureIntroPortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";
import {LeagueLegendsAcceptDeclineScenePortrait} from "../scenes/LeagueLegendsAcceptDeclineScenePortrait";
import {leagueLegendsChallenge} from "../data/leagueLegendsChallenge";

const introFrames = leagueLegendsChallenge.introFrames;
const challengeFrames = leagueLegendsChallenge.challengeFrames;
const outroFrames = leagueLegendsChallenge.outroFrames;

export const LeagueLegendsChallengePortrait: React.FC = () => {
  return (
    <AbsoluteFill>
      <AudioTrack music="Sport5.mp3" />
      <Sequence durationInFrames={introFrames}>
        <FeatureIntroPortrait title={leagueLegendsChallenge.title} subtitle={leagueLegendsChallenge.subtitle} />
      </Sequence>
      <Sequence from={introFrames} durationInFrames={challengeFrames}>
        <LeagueLegendsAcceptDeclineScenePortrait />
      </Sequence>
      <Sequence from={introFrames + challengeFrames} durationInFrames={outroFrames}>
        <FeatureOutroPortrait
          headline={leagueLegendsChallenge.outroHeadline}
          website={leagueLegendsChallenge.website}
          buttonText={leagueLegendsChallenge.buttonText}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
