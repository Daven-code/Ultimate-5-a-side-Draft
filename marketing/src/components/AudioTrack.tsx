/******************************************************************************
 * AudioTrack.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Reusable background music and ambience.
 *
 ******************************************************************************/

import React from "react";
import {
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  music?: string;
  musicStart?: number;
}

export const AudioTrack: React.FC<Props> = ({
  music = "Sport.mp3",
  musicStart = 0,
}) => {

  const frame = useCurrentFrame();

  const {durationInFrames, fps} = useVideoConfig();

  /*
   * Fade music in during the first second.
   */
  const fadeIn = interpolate(
    frame,
    [0, fps],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  /*
   * Fade music out during the final 2 seconds.
   */
  const fadeOut = interpolate(
    frame,
    [durationInFrames - (fps * 2), durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const musicVolume = fadeIn * fadeOut;

  return (

    <>

      <Audio
        src={staticFile(`music/${music}`)}
        startFrom={musicStart}
        volume={musicVolume}
      />

      <Audio
        src={staticFile("sfx/Stadium crowd.mp3")}
        volume={0.22}
      />

    </>

  );

};