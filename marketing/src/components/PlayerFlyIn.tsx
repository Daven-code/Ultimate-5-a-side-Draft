/******************************************************************************
 * PlayerFlyIn.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Animates a PlayerCard onto the screen.
 *
 ******************************************************************************/

import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {PlayerCard} from "./PlayerCard";

/**
 * Player model used throughout the marketing videos.
 */
export interface Player {

  player: string;

  rating: number;

  position: string;

}

interface PlayerFlyInProps {

  player: Player;

  delay: number;

  x: number;

  y: number;

}

export const PlayerFlyIn: React.FC<PlayerFlyInProps> = ({
  player,
  delay,
  x,
  y,
}) => {

  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  const localFrame = frame - delay;

  const progress = spring({
    fps,
    frame: localFrame,
    config: {
      damping: 10,
      stiffness: 120,
      mass: 0.7,
    },
  });

  const opacity = interpolate(
    localFrame,
    [0, 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const glow = interpolate(
    localFrame,
    [15, 25, 40],
    [0, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const startX = x - 700;

  /*
   * Only play whooshes for key cards.
   */
  const playWhoosh =
    delay === 72 ||
    delay === 54 ||
    delay === 0;

  const whooshOffset =
    delay === 72
      ? 0
      : delay === 54
      ? 4
      : 8;

  /*
   * Cinematic hit on the first player.
   */
  const playHit = delay === 0;

  return (

    <>

      {playWhoosh && (
        <Audio
          src={staticFile("sfx/whoosh.mp3")}
          startFrom={whooshOffset}
          endAt={whooshOffset + 18}
          volume={0.42}
        />
      )}

      {playHit && (
        <Audio
          src={staticFile("sfx/cinematic hit.mp3")}
          startFrom={2}
          volume={0.9}
        />
      )}

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
          player={player.player}
          rating={player.rating}
          position={player.position}
        />

      </div>

    </>

  );

};