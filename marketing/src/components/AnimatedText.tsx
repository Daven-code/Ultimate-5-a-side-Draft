/******************************************************************************
 * Premium title animation.
 ******************************************************************************/

import React from "react";
import {
interpolate,
spring,
useCurrentFrame,
useVideoConfig,
} from "remotion";

interface Props{

text:string;

top:number;

size?:number;

}

export const AnimatedText:React.FC<Props>=({

text,

top,

size=84,

})=>{

const frame=useCurrentFrame();

const {fps}=useVideoConfig();

const scale=spring({

fps,

frame,

config:{

stiffness:90,

damping:14,

},

});

const opacity=interpolate(

frame,

[15,40],

[0,1],

);

return(

<div

style={{

position:"absolute",

top,

width:"100%",

textAlign:"center",

fontFamily:"Bebas Neue, Arial",

fontSize:size,

letterSpacing:3,

fontWeight:700,

color:"white",

opacity,

transform:`scale(${0.85+scale*.15})`,

textShadow:"0 0 35px rgba(37,99,235,.5)",

}}

>

{text}

</div>

);

};