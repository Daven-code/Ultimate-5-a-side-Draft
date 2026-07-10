/******************************************************************************
 * Displays the draft screenshot.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";
import {Camera} from "../components/Camera";
import {ScreenshotFrame} from "../components/ScreenshotFrame";
import {AnimatedTitle} from "../components/AnimatedTitle";

export const DraftScene: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Background />

    <AnimatedTitle
      text="Draft Football Legends"
      top={80}
    />

    <Camera>
      <ScreenshotFrame
        file="draft.png"
        width={1450}
      />
    </Camera>
  </AbsoluteFill>
);