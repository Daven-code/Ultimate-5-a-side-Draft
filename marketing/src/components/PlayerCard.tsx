/******************************************************************************
 * PlayerCard.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Premium football card used throughout the trailer.
 *
 ******************************************************************************/

import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const PLAYER_CARD_WIDTH = 225;
export const PLAYER_CARD_HEIGHT = 310;

interface PlayerCardProps {
  player: string;
  rating: number;
  position: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  rating,
  position,
}) => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 11,
      stiffness: 140,
    },
  });

  return (

    <div
      style={{
        width: PLAYER_CARD_WIDTH,
        height: PLAYER_CARD_HEIGHT,

        borderRadius: 22,

        overflow: "hidden",

        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",

        padding: 18,

        color: "white",

        transform: `scale(${0.88 + scale * 0.12})`,

        background:
          "linear-gradient(180deg,#60A5FA 0%,#2563EB 28%,#1E3A8A 70%,#172554 100%)",

        border: "2px solid rgba(191,219,254,.65)",

        boxShadow:
          "0 0 35px rgba(59,130,246,.35), 0 18px 40px rgba(0,0,0,.45)",

        backdropFilter: "blur(6px)",

        fontFamily: "Bebas Neue",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >

        <div
          style={{
            fontSize: 34,
            letterSpacing: 2,
          }}
        >
          {position}
        </div>

        <div
          style={{
            fontSize: 26,
            opacity: .65,
          }}
        >
          ★★★★★
        </div>

      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 30,
          lineHeight: 1.15,
          padding: "0 10px",
          letterSpacing: 1,
        }}
      >
        {player}
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 82,
          color: "#FACC15",
          textShadow:
            "0 0 24px rgba(250,204,21,.55)",
          lineHeight: 1,
        }}
      >
        {rating}
      </div>

      <div
        style={{
          marginTop: 10,
          height: 7,
          borderRadius: 999,
          background:
            "linear-gradient(90deg,#60A5FA,#FFFFFF,#60A5FA)",
          opacity: .9,
        }}
      />

    </div>

  );

};