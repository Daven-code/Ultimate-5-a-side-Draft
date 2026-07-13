/******************************************************************************
 * Logo.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Displays the Ultimate 5-a-side logo with:
 *
 * • subtle scale animation
 * • cinematic light sweep
 * * soft blue glow
 *
 ******************************************************************************/

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

export const Logo: React.FC = () => {

  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  /*
   * Gentle breathing scale.
   */
  const scale = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 55,
    },
  });

    /*
   * Moving light sweep.
   *
   * Start well off-screen and finish well off-screen so
   * the sweep never appears to stop on top of the logo.
   */
  const sweepX = interpolate(
    frame,
    [10, 75],
    [-520, 620],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (

    <div
      style={{
        position: "relative",

        width: 420,
        height: 420,

        transform: `scale(${0.98 + scale * 0.02})`,
      }}
    >

      {/* ----------------------------------------------------------
          Logo
      ----------------------------------------------------------- */}

      <Img
        src={staticFile("logo/logo.png")}
        style={{
          width: "100%",

          filter:
            "drop-shadow(0 0 45px rgba(37,99,235,.55))",
        }}
      />

      {/* ----------------------------------------------------------
          Light sweep
      ----------------------------------------------------------- */}

      <AbsoluteFill
        style={{
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >

        <div
          style={{
            position: "absolute",

            left: sweepX,

            top: -120,

            width: 140,

            height: 640,

            transform: "rotate(24deg)",

            background:
              "linear-gradient(to right, transparent, rgba(147,197,253,.22), transparent)",

            filter: "blur(20px)",

            mixBlendMode: "screen",

            opacity: 0.4,
          }}
        />

      </AbsoluteFill>

    </div>

  );

};