/*****************************************************************************
 * WorldCup2026FeatureIntro.tsx
 * =============================================================================
 * Custom landscape intro for the World Cup 2026 Challenge promo.
 *
 * Layout update v3:
 * - Keeps the 5-a-side logo position from the previous version.
 * - Keeps the World Cup 2026 logos left and right.
 * - Moves the yellow OUT NOW text down to avoid crowding the wrapped title.
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

export const WorldCup2026FeatureIntro: React.FC<Props> = ({
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
  
    const titleOpacity = interpolate(frame, [20, 44], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  
    const titleScale = spring({
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
      <LightRays />
      <Particles />

      {/* Centred Ultimate 5-a-side logo */}
      <Img
        src={staticFile("logo/logo.png")}
        style={{
          position: "absolute",
          top: 120,
          left: "50%",
          width: 235,
          height: "auto",
          transform: `translateX(-50%) scale(${mainLogoScale})`,
          filter: "drop-shadow(0 0 32px rgba(0, 120, 255, 0.55))",
        }}
      />

      {/* Left World Cup 2026 logo */}
      <Img
        src={staticFile("logo/wc26logo.png")}
        style={{
          position: "absolute",
          top: 345,
          left: 150,
          width: 200,
          height: "auto",
          opacity: wcLogoOpacity,
          transform: `scale(${wcLogoScale}) rotate(-3deg)`,
          filter: "drop-shadow(0 0 28px rgba(0, 180, 255, 0.55))",
        }}
      />

      {/* Right World Cup 2026 logo */}
      <Img
        src={staticFile("logo/wc26logo.png")}
        style={{
          position: "absolute",
          top: 345,
          right: 150,
          width: 200,
          height: "auto",
          opacity: wcLogoOpacity,
          transform: `scale(${wcLogoScale}) rotate(3deg)`,
          filter: "drop-shadow(0 0 28px rgba(0, 180, 255, 0.55))",
        }}
      />

      {/* White feature title: allowed to wrap cleanly, clear of side logos */}
      <div
        style={{
          position: "absolute",
          top: 465,
          left: 370,
          right: 370,
          textAlign: "center",
          color: "white",
          fontFamily: "Bebas Neue, BebasNeue-Regular, Arial, sans-serif",
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: 4,
          lineHeight: 1,
          textShadow: "0 0 35px rgba(0, 200, 255, 0.55)",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        {title}
      </div>

      {/* OUT NOW moved down to clear the wrapped title */}
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#f7d26a",
          fontFamily: "Bebas Neue, BebasNeue-Regular, Arial, sans-serif",
          fontSize: 66,
          fontWeight: 700,
          letterSpacing: 5,
          textShadow: "0 0 30px rgba(247, 210, 106, 0.65)",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        {subtitle}
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
