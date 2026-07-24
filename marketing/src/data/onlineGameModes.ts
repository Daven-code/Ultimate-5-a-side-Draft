/******************************************************************************
 * onlineGameModes.ts
 * =============================================================================
 * Data for the Online Game Modes marketing video.
 ******************************************************************************/

export interface OnlineMode {
  title: string;
  subtitle: string;
  accent: string;
}

export interface AuctionPlayer {
  name: string;
  position: string;
  rating: number;
  bids: string[];
  winnerIndex: number;
}

export const onlineGameModes = {
  title: "ONLINE GAME MODES",
  subtitle: "Challenge your mates. Battle for the win.",

  modesTitle: "CHOOSE YOUR ONLINE BATTLE",
  modes: [
    {
      title: "ULTIMATE DRAFT 5-A-SIDE",
      subtitle: "",
      accent: "#60A5FA",
    },
    {
      title: "BLIND BIDDING",
      subtitle: "",
      accent: "#FACC15",
    },
    {
      title: "LIVE AUCTION",
      subtitle: "",
      accent: "#34D399",
    },
  ] as OnlineMode[],

  roomTitle: "UP TO 4 PLAYERS",
  roomSubtitle: "",
  budgetTitle: "£100M TO SPEND ON YOUR TEAM",

  auctionPlayers: [
    {
      name: "Ronaldo (2005)",
      position: "ST",
      rating: 92,
      bids: ["£55M", "£40M", "£20M", "£65M"],
      winnerIndex: 3,
    },
    {
      name: "Bruno Fernandes (2023)",
      position: "MID",
      rating: 87,
      bids: ["PASS", "£23M", "£35M", "£10M"],
      winnerIndex: 2,
    },
  ] as AuctionPlayer[],

  outroHeadline: "CHALLENGE YOUR FRIENDS ONLINE",
  website: "ultimate5aside.app",
  buttonText: "PLAY FREE NOW",
};
