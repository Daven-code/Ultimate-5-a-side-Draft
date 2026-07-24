/******************************************************************************
 * GuessPlayerPromptScenePortrait.tsx - Portrait
 * =============================================================================
 * No full-scene opacity on the root, to avoid a white/transparent flash between
 * sequences. Only the text scales/fades in.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {FootballPitch} from "../components/FootballPitch";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Vignette} from "../components/Vignette";
import {SceneFade} from "../components/SceneFade";

interface Props { title: string; subtitle: string; }

export const GuessPlayerPromptScenePortrait: React.FC<Props> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({fps, frame, config: {damping: 12, stiffness: 110}});
  const textOpacity = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: "#020617", overflow: "hidden"}}>
      <Background /><FootballPitch /><Floodlights /><LightRays /><Particles />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 70px"}}>
        <div style={{opacity: textOpacity, transform: `scale(${scale})`, fontFamily: "Bebas Neue", color: "white"}}>
          <div style={{fontSize: 88, letterSpacing: 3, textShadow: "0 0 30px rgba(96,165,250,0.78)", textTransform: "uppercase"}}>{title}</div>
          <div style={{marginTop: 24, fontSize: 58, letterSpacing: 3, color: "#FDE68A", textShadow: "0 0 24px rgba(250,204,21,0.55)", textTransform: "uppercase"}}>{subtitle}</div>
        </div>
      </AbsoluteFill>
      <Vignette /><SceneFade fadeInFrames={12} fadeOutFrames={12} />
    </AbsoluteFill>
  );
};
