import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  lines: string[];
}

export const StaggeredTitle: React.FC<Props> = ({lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <>
      {lines.map((line, index) => {
        const start = 12 + index * 15;

        const scale = spring({
          fps,
          frame: frame - start,
          config: {
            damping: 12,
            stiffness: 120,
          },
        });

        const opacity = interpolate(
          frame,
          [start, start + 10],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );

        return (
          <div
            key={line}
            style={{
              position: "absolute",
              width: "100%",
              top: 260 + index * 110,
              textAlign: "center",

              fontFamily: "Bebas Neue, Arial",

              fontSize: 88,

              color: "white",

              letterSpacing: 4,

              opacity,

              transform: `scale(${0.85 + scale * 0.15})`,

              textShadow:
                "0 0 40px rgba(37,99,235,.55)",
            }}
          >
            {line}
          </div>
        );
      })}
    </>
  );
};