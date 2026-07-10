/******************************************************************************
 * Logo.tsx
 *
 * PURPOSE
 * -------
 * Displays the Ultimate 5-a-side logo.
 *
 * We'll make this much more cinematic later with:
 * - light sweeps
 * - bloom
 * - subtle rotation
 * - beat-synchronised animation
 ******************************************************************************/

import React from "react";
import { Img, staticFile } from "remotion";

export const Logo: React.FC = () => {
  return (
    <Img
      src={staticFile("logo/logo.png")}
      style={{
        width: 420,
        filter: "drop-shadow(0 0 40px rgba(37,99,235,.55))",
      }}
    />
  );
};