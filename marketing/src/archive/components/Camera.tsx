/******************************************************************************
 * Camera.tsx
 *
 * PURPOSE
 * -------
 * Applies a slow cinematic zoom to whatever is placed inside.
 *
 * HOW TO USE
 * ----------
 *
 * <Camera>
 *      <ScreenshotFrame ... />
 * </Camera>
 *
 ******************************************************************************/

import React from "react";
import {
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

interface Props{
    children: React.ReactNode;
}

export const Camera:React.FC<Props> = ({children})=>{

    const frame = useCurrentFrame();
    const {fps}=useVideoConfig();

    const zoom = spring({
        fps,
        frame,
        config:{
            damping:20,
            stiffness:35,
        },
    });

    return(

        <div
            style={{

                transform:`scale(${1 + zoom*0.08})`,

                display:"flex",

                justifyContent:"center",

                alignItems:"center",

                width:"100%",

                height:"100%",

            }}
        >

            {children}

        </div>

    );

};