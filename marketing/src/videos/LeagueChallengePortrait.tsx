/******************************************************************************
 * LeagueChallengePortrait.tsx
 * =============================================================================
 * Portrait promo video for the League Challenge popular challenge.
 ******************************************************************************/

import React from "react";
import {Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntroPortrait} from "../scenes/FeatureIntroPortrait";
import {LeagueSelectionScenePortrait} from "../scenes/LeagueSelectionScenePortrait";
import {BuildTeamScenePortrait} from "../scenes/BuildTeamScenePortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";
import {leagueChallenge} from "../data/leagueChallenge";

const introFrames = leagueChallenge.introFrames;
const selectionFrames = leagueChallenge.selectionFrames;
const buildFrames = leagueChallenge.buildFrames;
const outroFrames = leagueChallenge.outroFrames;

export const LeagueChallengePortrait: React.FC = () => {
  return (
    <>
      <AudioTrack music="Sport.mp3" musicStart={0} />

      <Sequence from={0} durationInFrames={introFrames}>
        <FeatureIntroPortrait title={leagueChallenge.title} subtitle={leagueChallenge.subtitle} />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={selectionFrames}>
        <LeagueSelectionScenePortrait />
      </Sequence>

      <Sequence from={introFrames + selectionFrames} durationInFrames={buildFrames}>
        <BuildTeamScenePortrait
          title={leagueChallenge.buildTitle}
          team={leagueChallenge.team}
          score={leagueChallenge.score}
        />
      </Sequence>

      <Sequence from={introFrames + selectionFrames + buildFrames} durationInFrames={outroFrames}>
        <FeatureOutroPortrait
          headline={leagueChallenge.outroHeadline}
          website={leagueChallenge.website}
          buttonText={leagueChallenge.buttonText}
        />
      </Sequence>
    </>
  );
};
