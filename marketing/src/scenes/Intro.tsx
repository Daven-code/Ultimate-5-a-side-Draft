/******************************************************************************
 * Intro.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Creates the opening cinematic.
 *
 * Timeline
 * --------
 *
 * 0-1 sec
 * Darkness
 *
 * 1-2 sec
 * Logo fades in
 *
 * 2-3 sec
 * Stadium lights
 *
 * 3 sec
 * Hook appears
 *
 ******************************************************************************/

import React from "react";

import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {FootballPitch} from "../components/FootballPitch";
import {Particles} from "../components/Particles";
import {Logo} from "../components/Logo";
import {LightRays} from "../components/LightRays";
import {Vignette} from "../components/Vignette";
import {AnimatedText} from "../components/AnimatedText";
import {Brand} from "../core/Brand";

export const Intro: React.FC = () => {

    const frame = useCurrentFrame();

    const {fps} = useVideoConfig();

    /*
     * Smooth logo zoom.
     */
    const zoom = spring({
        fps,
        frame,
        config: {
            stiffness: 70,
            damping: 15,
        },
    });

    /*
     * Fade entire scene in.
     */
    const opacity = interpolate(
        frame,
        [0, 25],
        [0, 1],
        {
            extrapolateRight: "clamp",
        }
    );

    return (

        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                opacity,
            }}
        >

            <Background/>

            <Floodlights/>

            <LightRays/>

            <Particles/>

            <FootballPitch/>

            <div
                style={{
                    transform: `scale(${0.85 + zoom * 0.15})`,
                }}
            >
                <Logo/>
            </div>

            <AnimatedText
                text={Brand.hook}
                top={770}
                size={72}
            />

            <Vignette/>

        </AbsoluteFill>

    );

};