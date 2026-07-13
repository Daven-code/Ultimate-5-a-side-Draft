import React from "react";
import {Sequence} from "remotion";

import {UltimateIntro} from "./UltimateIntro";
import {HomepageScene} from "../scenes/HomepageScene";
import {DraftScene} from "../scenes/DraftScene";
import {TeamRevealScene} from "../scenes/TeamRevealScene";
import {OutroScene} from "../scenes/OutroScene";

export const LaunchTrailer: React.FC = () => (
  <>
    <Sequence from={0} durationInFrames={90}>
      <UltimateIntro />
    </Sequence>

    <Sequence from={90} durationInFrames={150}>
      <HomepageScene />
    </Sequence>

    <Sequence from={240} durationInFrames={120}>
      <DraftScene />
    </Sequence>

    <Sequence from={360} durationInFrames={90}>
      <TeamRevealScene />
    </Sequence>

    <Sequence from={450} durationInFrames={90}>
      <OutroScene />
    </Sequence>
  </>
);