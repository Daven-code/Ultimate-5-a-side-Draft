/******************************************************************************
 * AudioTrack.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Plays the background music for the trailer.
 *
 * NOTES
 * -----
 * Sport.mp3 is much longer than the trailer.
 * We therefore:
 *
 * • Skip the quieter introduction.
 * • Use roughly 20 seconds.
 * • Fade out at the end.
 *
 ******************************************************************************/

import React from "react";
import {Audio, interpolate, staticFile, useCurrentFrame} from "remotion";

export const AudioTrack: React.FC = () => {

  const frame = useCurrentFrame();

  // Fade music during the final 45 frames
  const volume = interpolate(
    frame,
    [555, 600],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <Audio
      src={staticFile("music/Sport.mp3")}

      /*
       * Skip the slower intro.
       * Adjust later if you find a better section.
       */
      startFrom={120}

      /*
       * Only use ~20 seconds of audio.
       */
      endAt={720}

      volume={volume}
    />
  );
};