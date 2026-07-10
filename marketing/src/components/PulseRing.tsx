/******************************************************************************
 * PulseRing.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Creates a glowing pulse that expands outwards.
 *
 * WHY?
 * ----
 * Sports trailers often use "energy" effects whenever something important
 * happens (logo appears, player joins the team, score updates etc.).
 *
 * This component will be reused throughout the project.
 *
 ******************************************************************************/

import React from "react";
import {
    interpolate,
    useCurrentFrame,
} from "remotion";

export const PulseRing: React.FC = () => {

    // Current frame of the animation.
    const frame = useCurrentFrame();

    // Expand from 120px to 700px.
    const size = interpolate(
        frame,
        [0, 40],
        [120, 700],
        {
            extrapolateRight: "clamp",
        }
    );

    // Fade out while expanding.
    const opacity = interpolate(
        frame,
        [0, 40],
        [0.8, 0],
        {
            extrapolateRight: "clamp",
        }
    );

    return (

        <div
            style={{
                position: "absolute",

                width: size,

                height: size,

                borderRadius: "50%",

                border: "4px solid #3B82F6",

                opacity,

                boxShadow: "0 0 60px #3B82F6",
            }}
        />

    );

};