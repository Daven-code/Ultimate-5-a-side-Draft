/******************************************************************************
 * GuessThePlayer.tsx
 ******************************************************************************/
import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntro} from "../scenes/FeatureIntro";
import {FeatureOutro} from "../scenes/FeatureOutro";
import {GuessPlayerCluesScene} from "../scenes/GuessPlayerCluesScene";
import {GuessPlayerPromptScene} from "../scenes/GuessPlayerPromptScene";
import {guessThePlayer, guessThePlayerTiming} from "../data/guessThePlayer";
const introFrames = guessThePlayer.introFrames;
const clueFrames = guessThePlayerTiming.clueFrames;
const promptFrames = guessThePlayer.promptFrames;
const outroFrames = guessThePlayer.outroFrames;
export const GuessThePlayer: React.FC = () => (
  <AbsoluteFill>
    <AudioTrack music="Sport2.mp3" />
    <Sequence from={0} durationInFrames={introFrames}><FeatureIntro title={guessThePlayer.title} subtitle={guessThePlayer.subtitle} /></Sequence>
    <Sequence from={introFrames} durationInFrames={clueFrames}><GuessPlayerCluesScene career={guessThePlayer.career} nationalityLabel={guessThePlayer.nationalityLabel} nationality={guessThePlayer.nationality} nationalityFlag={guessThePlayer.nationalityFlag} framesPerClue={guessThePlayer.framesPerClue} /></Sequence>
    <Sequence from={introFrames + clueFrames} durationInFrames={promptFrames}><GuessPlayerPromptScene title={guessThePlayer.promptTitle} subtitle={guessThePlayer.promptSubtitle} /></Sequence>
    <Sequence from={introFrames + clueFrames + promptFrames} durationInFrames={outroFrames}><FeatureOutro headline={guessThePlayer.outroHeadline} website={guessThePlayer.website} buttonText={guessThePlayer.buttonText} /></Sequence>
  </AbsoluteFill>
);
