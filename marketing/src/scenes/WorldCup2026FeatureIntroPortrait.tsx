/*****************************************************************************
 * WorldCup2026FeatureIntroPortrait.tsx
 * =============================================================================
 * Custom portrait intro for the World Cup 2026 Challenge promo.
 *
 * Layout update v3:
 * - Keeps the landscape intro untouched.
 * - Moves the full portrait composition down so the 5-a-side logo, title,
 *   OUT NOW text and World Cup logo feel vertically central in the frame.
 * - Keeps the World Cup 2026 logo underneath the text.
 * - Keeps the white title in the same bold Bebas-style feature-video treatment.
 *****************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {FootballPitch} from "../components/FootballPitch";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Vignette} from "../components/Vignette";

interface Props {
  title: string;
  subtitle: string;
}

export const WorldCup2026FeatureIntroPortrait: React.FC<Props> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: "clamp",
  });

  const mainLogoScale = spring({
    fps,
    frame: frame - 8,
    config: {
      damping: 12,
      stiffness: 70,
    },
  });

  const textOpacity = interpolate(frame, [20, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textScale = spring({
    fps,
    frame: frame - 20,
    config: {
      stiffness: 80,
      damping: 16,
    },
  });

  const wcLogoOpacity = interpolate(frame, [36, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wcLogoScale = spring({
    fps,
    frame: frame - 36,
    config: {
      stiffness: 85,
      damping: 14,
    },
  });

  return (
    <AbsoluteFill style={{opacity: sceneOpacity}}>
      <Background />
      <FootballPitch />
      <Floodlights />
      <Particles />
      <LightRays />

      {/* Centred Ultimate 5-a-side logo, moved down to balance the portrait frame */}
      <Img
        src={staticFile("logo/logo.png")}
        style={{
          position: "absolute",
          top: 510,
          left: "50%",
          width: 235,
          height: "auto",
          transform: `translateX(-50%) scale(${mainLogoScale})`,
          filter: "drop-shadow(0 0 32px rgba(0, 120, 255, 0.55))",
        }}
      />

      {/* White feature title, vertically centralised */}
      <div
        style={{
          position: "absolute",
          top: 875,
          left: 80,
          right: 80,
          textAlign: "center",
          color: "white",
          fontFamily: "Bebas Neue, BebasNeue-Regular, Arial, sans-serif",
          fontSize: 78,
          fontWeight: 700,
          letterSpacing: 3,
          lineHeight: 1.02,
          textShadow: "0 0 35px rgba(0, 200, 255, 0.55)",
          opacity: textOpacity,
          transform: `scale(${textScale})`,
        }}
      >
        {title}
      </div>

      <div
        style={{
          position: "absolute",
          top: 1080,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#f7d26a",
          fontFamily: "Bebas Neue, BebasNeue-Regular, Arial, sans-serif",
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: 5,
          textShadow: "0 0 30px rgba(247, 210, 106, 0.65)",
          opacity: textOpacity,
          transform: `scale(${textScale})`,
        }}
      >
        {subtitle}
      </div>

      {/* World Cup 2026 logo remains beneath the text */}
      <Img
        src={staticFile("logo/wc26logo.png")}
        style={{
          position: "absolute",
          top: 1220,
          left: "50%",
          width: 190,
          height: "auto",
          opacity: wcLogoOpacity,
          transform: `translateX(-50%) scale(${wcLogoScale})`,
          filter: "drop-shadow(0 0 30px rgba(0, 180, 255, 0.6))",
        }}
      />

      <Vignette />
    </AbsoluteFill>
  );
};
