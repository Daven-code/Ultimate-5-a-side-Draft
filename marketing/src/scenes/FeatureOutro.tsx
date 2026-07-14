/******************************************************************************
 * FeatureOutro.tsx
 * =============================================================================
 *
 * Reusable landscape outro.
 *
 ******************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Logo} from "../components/Logo";
import {Vignette} from "../components/Vignette";

interface Props {
  headline: string;
  website?: string;
  buttonText?: string;
}

export const FeatureOutro: React.FC<Props> = ({
  headline,
  website = "ultimate5aside.app",
  buttonText = "PLAY FREE NOW",
}) => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 80,
    },
  });

  return (

    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Background/>

      <Floodlights/>

      <LightRays/>

      <Particles/>

      {/* Logo */}

      <div
        style={{
          position: "absolute",
          top: 70,
          left: "50%",
          transform: `translateX(-50%) scale(${0.58 + scale * 0.10})`,
        }}
      >
        <Logo/>
      </div>

      {/* Headline */}

      <div
        style={{
          position: "absolute",
          top: 500,
          width: "100%",
          textAlign: "center",
          color: "white",
          fontFamily: "Bebas Neue",
          fontSize: 74,
          letterSpacing: 3,
          lineHeight: 1,
          textShadow: "0 0 24px rgba(37,99,235,.45)",
        }}
      >
        {headline}
      </div>

      {/* Website */}

      <div
        style={{
          position: "absolute",
          top: 620,
          width: "100%",
          textAlign: "center",
          color: "#60A5FA",
          fontFamily: "Bebas Neue",
          fontSize: 52,
          letterSpacing: 2,
        }}
      >
        {website}
      </div>

      {/* Button */}

      <div
        style={{
          position: "absolute",
          top: 730,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "20px 44px",
          borderRadius: 14,
          background: "#2563EB",
          color: "white",
          fontFamily: "Bebas Neue",
          fontSize: 40,
          letterSpacing: 2,
          boxShadow: "0 10px 30px rgba(37,99,235,.35)",
        }}
      >
        {buttonText}
      </div>

      <Vignette/>

    </AbsoluteFill>

  );

};