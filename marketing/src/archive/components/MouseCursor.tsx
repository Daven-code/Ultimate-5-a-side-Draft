/******************************************************************************
 * MouseCursor.tsx
 *
 * PURPOSE
 * -------
 * Fake mouse cursor used to guide the viewer.
 ******************************************************************************/

import React from "react";
import {
    interpolate,
    useCurrentFrame,
} from "remotion";

export const MouseCursor:React.FC=()=>{

    const frame=useCurrentFrame();

    const left=interpolate(frame,[0,120],[250,1250]);

    const top=interpolate(frame,[0,120],[850,320]);

    return(

        <div

            style={{

                position:"absolute",

                left,

                top,

                fontSize:70,

                color:"white",

                textShadow:"0 0 15px black",

            }}

        >

            🖱️

        </div>

    );

};