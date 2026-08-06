import {Composition} from "remotion";
import {LaunchTrailer} from "./videos/LaunchTrailer";
import {LaunchTrailerPortrait} from "./videos/LaunchTrailerPortrait";
import {EasySoloChallenge} from "./videos/EasySoloChallenge";
import {EasySoloChallengePortrait} from "./videos/EasySoloChallengePortrait";
import {WorldCup2026Challenge} from "./videos/WorldCup2026Challenge";
import {WorldCup2026ChallengePortrait} from "./videos/WorldCup2026ChallengePortrait";
import {OnlineGameModes} from "./videos/OnlineGameModes";
import {OnlineGameModesPortrait} from "./videos/OnlineGameModesPortrait";
import {GuessThePlayer} from "./videos/GuessThePlayer";
import {GuessThePlayerPortrait} from "./videos/GuessThePlayerPortrait";
import {AcceptDeclineRonaldinho} from "./videos/AcceptDeclineRonaldinho";
import {AcceptDeclineRonaldinhoPortrait} from "./videos/AcceptDeclineRonaldinhoPortrait";
import {guessThePlayerTiming} from "./data/guessThePlayer";
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LaunchTrailer" component={LaunchTrailer} durationInFrames={720} fps={30} width={1920} height={1080} />
    <Composition id="LaunchTrailerPortrait" component={LaunchTrailerPortrait} durationInFrames={720} fps={30} width={1080} height={1920} />
    <Composition id="EasySoloChallenge" component={EasySoloChallenge} durationInFrames={450} fps={30} width={1920} height={1080} />
    <Composition id="EasySoloChallengePortrait" component={EasySoloChallengePortrait} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="WorldCup2026Challenge" component={WorldCup2026Challenge} durationInFrames={480} fps={30} width={1920} height={1080} />
    <Composition id="WorldCup2026ChallengePortrait" component={WorldCup2026ChallengePortrait} durationInFrames={480} fps={30} width={1080} height={1920} />
    <Composition id="OnlineGameModes" component={OnlineGameModes} durationInFrames={1140} fps={30} width={1920} height={1080} />
    <Composition id="OnlineGameModesPortrait" component={OnlineGameModesPortrait} durationInFrames={1140} fps={30} width={1080} height={1920} />
    <Composition id="GuessThePlayer" component={GuessThePlayer} durationInFrames={guessThePlayerTiming.totalFrames} fps={30} width={1920} height={1080} />
    <Composition id="GuessThePlayerPortrait" component={GuessThePlayerPortrait} durationInFrames={guessThePlayerTiming.totalFrames} fps={30} width={1080} height={1920} />
    <Composition id="AcceptDeclineRonaldinho" component={AcceptDeclineRonaldinho} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="AcceptDeclineRonaldinhoPortrait" component={AcceptDeclineRonaldinhoPortrait} durationInFrames={600} fps={30} width={1080} height={1920} />
  </>
);
