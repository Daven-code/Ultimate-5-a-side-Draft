/******************************************************************************
 * GuessThePlayerPortrait.tsx
 ******************************************************************************/
import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {AudioTrack} from "../components/AudioTrack";
import {FeatureIntroPortrait} from "../scenes/FeatureIntroPortrait";
import {FeatureOutroPortrait} from "../scenes/FeatureOutroPortrait";
import {GuessPlayerCluesScenePortrait} from "../scenes/GuessPlayerCluesScenePortrait";
import {GuessPlayerPromptScenePortrait} from "../scenes/GuessPlayerPromptScenePortrait";
import {guessThePlayer, guessThePlayerTiming} from "../data/guessThePlayer";
const introFrames = guessThePlayer.introFrames;
const clueFrames = guessThePlayerTiming.clueFrames;
const promptFrames = guessThePlayer.promptFrames;
const outroFrames = guessThePlayer.outroFrames;
export const GuessThePlayerPortrait: React.FC = () => (
  <AbsoluteFill>
    <AudioTrack music="Sport2.mp3" />
    <Sequence from={0} durationInFrames={introFrames}><FeatureIntroPortrait title={guessThePlayer.title} subtitle={guessThePlayer.subtitle} /></Sequence>
    <Sequence from={introFrames} durationInFrames={clueFrames}><GuessPlayerCluesScenePortrait career={guessThePlayer.career} nationalityLabel={guessThePlayer.nationalityLabel} nationality={guessThePlayer.nationality} nationalityFlag={guessThePlayer.nationalityFlag} framesPerClue={guessThePlayer.framesPerClue} /></Sequence>
    <Sequence from={introFrames + clueFrames} durationInFrames={promptFrames}><GuessPlayerPromptScenePortrait title={guessThePlayer.promptTitle} subtitle={guessThePlayer.promptSubtitle} /></Sequence>
    <Sequence from={introFrames + clueFrames + promptFrames} durationInFrames={outroFrames}><FeatureOutroPortrait headline={guessThePlayer.outroHeadline} website={guessThePlayer.website} buttonText={guessThePlayer.buttonText} /></Sequence>
  </AbsoluteFill>
);
