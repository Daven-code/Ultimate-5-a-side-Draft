/******************************************************************************
 * LeagueChallenge.tsx
 * =============================================================================
 * Landscape promo video for the League Challenge popular challenge.
 ******************************************************************************/

import React from "react";
import {Sequence} from "remotion";

import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntro} from "../scenes/FeatureIntro";
import {LeagueSelectionScene} from "../scenes/LeagueSelectionScene";
import {BuildTeamScene} from "../scenes/BuildTeamScene";
import {FeatureOutro} from "../scenes/FeatureOutro";
import {leagueChallenge} from "../data/leagueChallenge";

const introFrames = leagueChallenge.introFrames;
const selectionFrames = leagueChallenge.selectionFrames;
const buildFrames = leagueChallenge.buildFrames;
const outroFrames = leagueChallenge.outroFrames;

export const LeagueChallenge: React.FC = () => {
  return (
    <>
      <AudioTrack music="Sport.mp3" musicStart={0} />

      <Sequence from={0} durationInFrames={introFrames}>
        <FeatureIntro title={leagueChallenge.title} subtitle={leagueChallenge.subtitle} />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={selectionFrames}>
        <LeagueSelectionScene />
      </Sequence>

      <Sequence from={introFrames + selectionFrames} durationInFrames={buildFrames}>
        <BuildTeamScene
          title={leagueChallenge.buildTitle}
          team={leagueChallenge.team}
          score={leagueChallenge.score}
        />
      </Sequence>

      <Sequence from={introFrames + selectionFrames + buildFrames} durationInFrames={outroFrames}>
        <FeatureOutro
          headline={leagueChallenge.outroHeadline}
          website={leagueChallenge.website}
          buttonText={leagueChallenge.buttonText}
        />
      </Sequence>
    </>
  );
};
