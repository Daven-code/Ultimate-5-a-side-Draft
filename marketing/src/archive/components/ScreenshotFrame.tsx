/******************************************************************************
 * ScreenshotFrame.tsx
 *
 * PURPOSE
 * -------
 * Displays screenshots with
 *
 * • Rounded corners
 * • Soft shadow
 * • Slow camera zoom
 ******************************************************************************/

import React from "react";

import {

  Img,

  staticFile,

  spring,

  useCurrentFrame,

  useVideoConfig,

} from "remotion";

interface Props {

  file: string;

  width?: number;

}

export const ScreenshotFrame: React.FC<Props> = ({

  file,

  width = 1200,

}) => {

  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  const scale = spring({

    fps,

    frame,

    config: {

      damping: 20,

      stiffness: 40,

    },

  });

  return (

    <Img

      src={staticFile(`screenshots/${file}`)}

      style={{

        width,

        borderRadius: 30,

        border: "3px solid rgba(255,255,255,.08)",

        boxShadow:

          "0 30px 80px rgba(0,0,0,.45)",

        transform: `scale(${1 + scale * .05})`,

      }}

    />

  );

};