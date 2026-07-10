/******************************************************************************
 * Floating particles.
 *
 * Version 1
 * Fixed positions.
 *
 * Version 2
 * We'll animate them.
 ******************************************************************************/

import React from "react";

const dots=[

[220,180],
[640,310],
[980,150],
[1600,300],
[1480,720],
[420,820],
[960,640],
[1710,910],
[1200,500],
[300,520],
[820,940],
[1550,120],

];

export const Particles=()=>{

return(

<>

{dots.map(([x,y],i)=>(

<div

key={i}

style={{

position:"absolute",

left:x,

top:y,

width:5,

height:5,

borderRadius:"50%",

background:"#60A5FA",

opacity:.25,

boxShadow:"0 0 12px #60A5FA",

}}

 />

))}

</>

);

};