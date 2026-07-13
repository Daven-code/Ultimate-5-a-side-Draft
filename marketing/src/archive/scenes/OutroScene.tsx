/******************************************************************************
 * Final call-to-action.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";
import {Logo} from "../components/Logo";
import {CTAButton} from "../components/CTAButton";

export const OutroScene: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      gap: 40,
    }}
  >
    <Background />

    <Logo />

    <div
      style={{
        color: "white",
        fontSize: 48,
        fontWeight: 700,
        fontFamily: "Arial",
      }}
    >
      ultimate5aside.app
    </div>

    <CTAButton text="PLAY FREE NOW" />
  </AbsoluteFill>
);