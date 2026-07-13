/******************************************************************************
 * Cinematic background.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill} from "remotion";
import {Colours} from "../core/Colours";

export const Background:React.FC=()=>{

return(

<AbsoluteFill
style={{

background:

`radial-gradient(circle at center,
${Colours.navy} 0%,
${Colours.background} 75%)`,

overflow:"hidden",

}}

>

<div
style={{

position:"absolute",

inset:0,

boxShadow:"inset 0 0 350px rgba(0,0,0,.75)",

}}

 />

</AbsoluteFill>

);

};