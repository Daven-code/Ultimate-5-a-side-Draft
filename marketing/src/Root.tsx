import {Composition} from "remotion";

// Main trailer
import {LaunchTrailer} from "./videos/LaunchTrailer";
import {LaunchTrailerPortrait} from "./videos/LaunchTrailerPortrait";

// Feature videos
import {EasySoloChallenge} from "./videos/EasySoloChallenge";
import {EasySoloChallengePortrait} from "./videos/EasySoloChallengePortrait";
import {WorldCup2026Challenge} from "./videos/WorldCup2026Challenge";
import {WorldCup2026ChallengePortrait} from "./videos/WorldCup2026ChallengePortrait";
import {OnlineGameModes} from "./videos/OnlineGameModes";
import {OnlineGameModesPortrait} from "./videos/OnlineGameModesPortrait";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="LaunchTrailer" component={LaunchTrailer} durationInFrames={600} fps={30} width={1920} height={1080} />
      <Composition id="LaunchTrailerPortrait" component={LaunchTrailerPortrait} durationInFrames={600} fps={30} width={1080} height={1920} />
      <Composition id="EasySoloChallenge" component={EasySoloChallenge} durationInFrames={450} fps={30} width={1920} height={1080} />
      <Composition id="EasySoloChallengePortrait" component={EasySoloChallengePortrait} durationInFrames={450} fps={30} width={1080} height={1920} />
      <Composition id="WorldCup2026Challenge" component={WorldCup2026Challenge} durationInFrames={480} fps={30} width={1920} height={1080} />
      <Composition id="WorldCup2026ChallengePortrait" component={WorldCup2026ChallengePortrait} durationInFrames={480} fps={30} width={1080} height={1920} />
      <Composition id="OnlineGameModes" component={OnlineGameModes} durationInFrames={1140} fps={30} width={1920} height={1080} />
      <Composition id="OnlineGameModesPortrait" component={OnlineGameModesPortrait} durationInFrames={1140} fps={30} width={1080} height={1920} />
    </>
  );
};
