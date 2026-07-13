/******************************************************************************
 * PlayerFlyIn.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Animates a PlayerCard onto the screen.
 *
 * Animation
 * ---------
 * • Slides in from the left
 * • Slight overshoot
 * • Settles into place
 * • Blue glow pulse as it lands
 *
 ******************************************************************************/

import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {PlayerCard} from "./PlayerCard";

interface PlayerFlyInProps {

  player: string;

  rating: number;

  position: string;

  delay: number;

  x: number;

  y: number;

}

export const PlayerFlyIn: React.FC<PlayerFlyInProps> = ({
  player,
  rating,
  position,
  delay,
  x,
  y,
}) => {

  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  const localFrame = frame - delay;

  /*
   * Controls the movement.
   * Overshoots slightly before settling.
   */
  const progress = spring({
    fps,
    frame: localFrame,
    config: {
      damping: 10,
      stiffness: 120,
      mass: 0.7,
    },
  });

  /*
   * Fade in.
   */
  const opacity = interpolate(
    localFrame,
    [0, 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  /*
   * Landing glow.
   */
  const glow = interpolate(
    localFrame,
    [15, 25, 40],
    [0, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  /*
   * Start off-screen.
   */
  const startX = x - 700;

  return (

    <div
      style={{

        position: "absolute",

        left: startX + (700 * progress),

        top: y,

        opacity,

        filter:
          `drop-shadow(0 0 ${30 * glow}px rgba(59,130,246,.8))`,

      }}
    >

      <PlayerCard
        player={player}
        rating={rating}
        position={position}
      />

    </div>

  );

};