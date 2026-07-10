/******************************************************************************
 * LaunchTrailer.tsx
 *
 * Version 2 trailer timeline.
 ******************************************************************************/

import React from "react";

import {Sequence} from "remotion";

import {Intro} from "../scenes/Intro";

import {HowToPlay} from "../scenes/HowToPlay";

import {BuildTeamScene} from "../scenes/BuildTeamScene";
import {AudioTrack} from "../components/AudioTrack";

export const LaunchTrailer = () => (

<>
<AudioTrack />
<Sequence
from={0}
durationInFrames={90}
>

<Intro/>

</Sequence>

<Sequence
from={90}
durationInFrames={120}
>

<HowToPlay/>

</Sequence>

<Sequence
from={210}
durationInFrames={120}
>

<BuildTeamScene/>

</Sequence>

</>

);