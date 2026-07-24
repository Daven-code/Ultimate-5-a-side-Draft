/******************************************************************************
 * OnlineModesScenePortrait.tsx - Portrait
 * =============================================================================
 * Three game modes section. Small descriptive text removed and box text centred.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {FootballPitch} from "../components/FootballPitch";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Vignette} from "../components/Vignette";
import {SceneFade} from "../components/SceneFade";
import {OnlineMode} from "../data/onlineGameModes";

interface Props { title: string; modes: OnlineMode[]; }

const ModeCard: React.FC<{mode: OnlineMode; index: number}> = ({mode, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - index * 14;
  const scale = spring({fps, frame: local, config: {damping: 13, stiffness: 110}});
  const opacity = interpolate(local, [0, 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <div
      style={{
        width: 790,
        height: 205,
        opacity,
        transform: `scale(${scale})`,
        borderRadius: 34,
        padding: "27px 34px",
        background: "linear-gradient(145deg, rgba(15,23,42,0.94), rgba(30,41,59,0.78))",
        border: `3px solid ${mode.accent}`,
        boxShadow: `0 0 34px ${mode.accent}55, inset 0 0 24px rgba(255,255,255,0.06)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
      }}
    >
      <div style={{color: mode.accent, fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 31, letterSpacing: 2.2}}>
        MODE {index + 1}
      </div>
      <div style={{color: "white", fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 49, lineHeight: 1.02, textTransform: "uppercase", textShadow: `0 0 18px ${mode.accent}88`}}>
        {mode.title}
      </div>
    </div>
  );
};

export const OnlineModesScenePortrait: React.FC<Props> = ({title, modes}) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 16], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: "#020617", overflow: "hidden"}}>
      <Background />
      <FootballPitch />
      <LightRays />
      <Particles />
      <AbsoluteFill style={{alignItems: "center", paddingTop: 185, textAlign: "center"}}>
        <div style={{opacity: titleOpacity, color: "#FFFFFF", fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 54, letterSpacing: 1.4, textTransform: "uppercase", textShadow: "0 0 28px rgba(96,165,250,0.7)"}}>
          {title}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30, paddingTop: 10}}>
        {modes.map((mode, index) => <ModeCard key={mode.title} mode={mode} index={index} />)}
      </AbsoluteFill>
      <Vignette />
      <SceneFade fadeInFrames={12} fadeOutFrames={12} />
    </AbsoluteFill>
  );
};
