/******************************************************************************
 * OnlineFeatureIntro.tsx - Landscape
 * =============================================================================
 * Matches the reusable FeatureIntro.tsx style used by Easy Solo Challenge.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {FootballPitch} from "../components/FootballPitch";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Logo} from "../components/Logo";
import {AnimatedText} from "../components/AnimatedText";
import {Vignette} from "../components/Vignette";
import {SceneFade} from "../components/SceneFade";

interface Props { title: string; subtitle: string; }

export const OnlineFeatureIntro: React.FC<Props> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const zoom = spring({
    fps,
    frame,
    config: {
      stiffness: 70,
      damping: 15,
    },
  });

  const opacity = interpolate(frame, [0, 25], [0, 1], {extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center", opacity, backgroundColor: "#020617", overflow: "hidden"}}>
      <Background />
      <Floodlights />
      <LightRays />
      <Particles />
      <FootballPitch />

      <div style={{transform: `scale(${0.85 + zoom * 0.15})`}}>
        <Logo />
      </div>

      <AnimatedText text={title} top={760} size={72} />

      <div
        style={{
          position: "absolute",
          top: 900,
          width: "100%",
          textAlign: "center",
          color: "#93C5FD",
          fontFamily: "Bebas Neue",
          fontSize: 40,
          letterSpacing: 2,
          textShadow: "0 0 18px rgba(37,99,235,.35)",
        }}
      >
        {subtitle}
      </div>

      <Vignette />
      <SceneFade fadeInFrames={26} fadeOutFrames={12} />
    </AbsoluteFill>
  );
};
