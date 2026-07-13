/******************************************************************************
 * Final team reveal.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";
import {ScreenshotFrame} from "../components/ScreenshotFrame";
import {AnimatedCounter} from "../components/AnimatedCounter";

export const TeamRevealScene: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      gap: 40,
    }}
  >
    <Background />

    <ScreenshotFrame
      file="team.png"
      width={1300}
    />

    <AnimatedCounter value={447} />
  </AbsoluteFill>
);