/******************************************************************************
 * Highlight.tsx
 *
 * PURPOSE
 * -------
 * Animated highlight box used to draw attention
 * to buttons and menus.
 ******************************************************************************/

import React from "react";

interface Props{

    left:number;

    top:number;

    width:number;

    height:number;

}

export const Highlight:React.FC<Props>=({

    left,

    top,

    width,

    height,

})=>(

    <div

        style={{

            position:"absolute",

            left,

            top,

            width,

            height,

            border:"4px solid #3B82F6",

            borderRadius:18,

            boxShadow:"0 0 30px #3B82F6",

        }}

    />

);