/******************************************************************************
 * OnlineFeatureIntroPortrait.tsx - Portrait
 * =============================================================================
 * Matches the reusable FeatureIntroPortrait.tsx style used by Easy Solo Challenge.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {FootballPitch} from "../components/FootballPitch";
import {Particles} from "../components/Particles";
import {LightRays} from "../components/LightRays";
import {Logo} from "../components/Logo";
import {Vignette} from "../components/Vignette";
import {SceneFade} from "../components/SceneFade";

interface Props { title: string; subtitle: string; }

export const OnlineFeatureIntroPortrait: React.FC<Props> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 70,
    },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center", opacity, backgroundColor: "#020617", overflow: "hidden"}}>
      <Background />
      <Floodlights />
      <LightRays />
      <Particles />
      <FootballPitch />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "38%",
          transform: `translate(-50%, -50%) scale(${0.62 + logoScale * 0.12})`,
        }}
      >
        <Logo />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          transform: "translate(-50%, -50%)",
          width: "92%",
          textAlign: "center",
          color: "white",
          fontFamily: "Bebas Neue",
          fontSize: 82,
          lineHeight: 1,
          letterSpacing: 3,
          textShadow: "0 0 24px rgba(37,99,235,.45)",
        }}
      >
        {title}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "63%",
          transform: "translateX(-50%)",
          width: "90%",
          textAlign: "center",
          color: "#93C5FD",
          fontFamily: "Bebas Neue",
          fontSize: 42,
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
