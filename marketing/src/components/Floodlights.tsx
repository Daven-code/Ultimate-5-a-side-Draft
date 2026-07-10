/******************************************************************************
 * Stadium floodlights.
 ******************************************************************************/

import React from "react";

export const Floodlights=()=>{

return(

<>

<div
style={{

position:"absolute",

left:-250,

top:-180,

width:650,

height:650,

borderRadius:"50%",

background:
"radial-gradient(circle, rgba(255,255,255,.18), transparent)",

filter:"blur(40px)",

}}
/>

<div
style={{

position:"absolute",

right:-250,

top:-180,

width:650,

height:650,

borderRadius:"50%",

background:
"radial-gradient(circle, rgba(255,255,255,.18), transparent)",

filter:"blur(40px)",

}}
/>

</>

);

};