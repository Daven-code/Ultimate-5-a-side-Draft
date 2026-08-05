/******************************************************************************
 * Logo.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Displays the Ultimate 5-a-side logo with:
 *
 * - subtle scale animation
 * - a blue glow that sits behind the actual logo
 * - a shimmer sweep clipped to the logo alpha so it does not create a box/beam
 * - a larger internal logo scale for the newer transparent logo asset
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

interface LogoProps {
  /** Overall component footprint. Existing scenes scale this wrapper as before. */
  size?: number;

  /**
   * The new logo artwork has no surrounding box, so the visible mark is smaller
   * inside the same PNG canvas. This scales the asset inside the fixed footprint.
   */
  assetScale?: number;
}

export const Logo: React.FC<LogoProps> = ({
  size = 420,
  assetScale = 1.62,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  /*
   * Gentle breathing scale for the whole logo unit.
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
   * Moving shimmer sweep. The sweep travels across the asset, but is masked
   * to the logo PNG alpha below so it no longer appears as a rectangular glow.
   */
  const sweepX = interpolate(
    frame,
    [8, 76],
    [-size * 0.95, size * 1.25],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const logoSrc = staticFile("logo/logo.png");
  const animatedScale = 0.98 + scale * 0.02;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        transform: `scale(${animatedScale})`,
        overflow: "visible",
      }}
    >
      {/* Soft glow behind the logo without recreating the old square box. */}
      <AbsoluteFill
        style={{
          transform: `scale(${assetScale * 0.9})`,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.42) 0%, rgba(37,99,235,0.24) 28%, rgba(37,99,235,0.08) 48%, transparent 68%)",
          filter: "blur(18px)",
          opacity: 0.72,
          pointerEvents: "none",
        }}
      />

      {/* Logo artwork. Kept centred and scaled up for the new transparent PNG. */}
      <Img
        src={logoSrc}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transform: `scale(${assetScale})`,
          transformOrigin: "center center",
          filter:
            "drop-shadow(0 0 18px rgba(147,197,253,0.42)) drop-shadow(0 0 34px rgba(37,99,235,0.42))",
        }}
      />

      {/*
       * Shimmer sweep clipped to the actual logo shape. The mask uses the same
       * logo source and scale as the image above, keeping both perfectly aligned.
       */}
      <AbsoluteFill
        style={{
          transform: `scale(${assetScale})`,
          transformOrigin: "center center",
          WebkitMaskImage: `url(${logoSrc})`,
          maskImage: `url(${logoSrc})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: sweepX,
            top: -size * 0.22,
            width: size * 0.18,
            height: size * 1.45,
            transform: "rotate(24deg)",
            background:
              "linear-gradient(to right, transparent 0%, rgba(191,219,254,0.10) 28%, rgba(255,255,255,0.42) 50%, rgba(147,197,253,0.16) 72%, transparent 100%)",
            filter: "blur(8px)",
            mixBlendMode: "screen",
            opacity: 0.78,
          }}
        />
      </AbsoluteFill>
    </div>
  );
};
