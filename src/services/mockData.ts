import type { Article, LeagueStanding, Match, Team, Video } from "@/types";

export const TEAMS: Team[] = [
  { id: "mamelodi-sundowns", name: "Mamelodi Sundowns", shortName: "SUN", league: "Betway Premiership", primary: "#F9E300" },
  { id: "orlando-pirates", name: "Orlando Pirates", shortName: "PIR", league: "Betway Premiership", primary: "#1A1A1A" },
  { id: "kaizer-chiefs", name: "Kaizer Chiefs", shortName: "CHI", league: "Betway Premiership", primary: "#FFB612" },
  { id: "supersport-united", name: "SuperSport United", shortName: "SSU", league: "Betway Premiership", primary: "#0033A0" },
  { id: "stellenbosch", name: "Stellenbosch FC", shortName: "STE", league: "Betway Premiership", primary: "#8B1B1B" },
  { id: "sekhukhune-united", name: "Sekhukhune United", shortName: "SEK", league: "Betway Premiership", primary: "#C8102E" },
  { id: "amazulu", name: "AmaZulu FC", shortName: "AMA", league: "Betway Premiership", primary: "#009639" },
  { id: "golden-arrows", name: "Golden Arrows", shortName: "ARR", league: "Betway Premiership", primary: "#F5A800" },
  { id: "chippa-united", name: "Chippa United", shortName: "CHP", league: "Betway Premiership", primary: "#0E7C3A" },
  { id: "polokwane-city", name: "Polokwane City", shortName: "POL", league: "Betway Premiership", primary: "#D62828" },
  { id: "richards-bay", name: "Richards Bay FC", shortName: "RIC", league: "Betway Premiership", primary: "#1D3557" },
  { id: "marumo-gallants", name: "Marumo Gallants", shortName: "MAR", league: "Betway Premiership", primary: "#5B2C6F" },
  { id: "magesi", name: "Magesi FC", shortName: "MAG", league: "Betway Premiership", primary: "#0A9396" },
  { id: "orbit-college", name: "Orbit College FC", shortName: "ORB", league: "Betway Premiership", primary: "#264653" },
  { id: "durban-city", name: "Durban City FC", shortName: "DUR", league: "Betway Premiership", primary: "#1B4965" },
  { id: "siwelele", name: "Siwelele FC", shortName: "SIW", league: "Betway Premiership", primary: "#B5179E" },
];

export function getTeam(id: string | null | undefined): Team | undefined {
  return TEAMS.find((team) => team.id === id);
}

export const STANDING: LeagueStanding = {
  position: 3,
  teamId: "mamelodi-sundowns",
  played: 24,
  points: 51,
  form: ["W", "W", "D", "L", "W"],
};

export function buildMatches(teamId: string): {
  previous: Match;
  current: Match;
  upcoming: Match[];
} {
  const team = getTeam(teamId) ?? TEAMS[0]!;
  const rival = TEAMS.find((t) => t.id !== team.id)!;
  const other = TEAMS.find((t) => t.id !== team.id && t.id !== rival.id)!;
  const asMatchTeam = (t: Team) => ({ id: t.id, name: t.name, shortName: t.shortName });

  return {
    previous: {
      id: "prev",
      status: "finished",
      competition: "Betway Premiership",
      kickoff: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      venue: "Home",
      home: asMatchTeam(team),
      away: asMatchTeam(other),
      homeScore: 2,
      awayScore: 1,
    },
    current: {
      id: "live",
      status: "live",
      competition: "CAF Champions League",
      kickoff: new Date().toISOString(),
      venue: "Home",
      home: asMatchTeam(team),
      away: asMatchTeam(rival),
      homeScore: 1,
      awayScore: 1,
      minute: 63,
    },
    upcoming: [
      {
        id: "next-1",
        status: "upcoming",
        competition: "Betway Premiership",
        kickoff: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        venue: "Away",
        home: asMatchTeam(rival),
        away: asMatchTeam(team),
      },
      {
        id: "next-2",
        status: "upcoming",
        competition: "Nedbank Cup",
        kickoff: new Date(Date.now() + 9 * 86_400_000).toISOString(),
        venue: "Home",
        home: asMatchTeam(team),
        away: asMatchTeam(other),
      },
    ],
  };
}

export const ARTICLES: Article[] = [
  {
    id: "a1",
    headline: "Late winner seals a statement away derby victory",
    description: "A 91st-minute strike caps a controlled second half at a packed Loftus.",
    image: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800&q=70",
    source: "Match Report",
    publishedAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    category: "team",
  },
  {
    id: "a2",
    headline: "Squad update ahead of a congested cup month",
    description: "Two returns from injury as rotation becomes the story of the run-in.",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=70",
    source: "Team News",
    publishedAt: new Date(Date.now() - 9 * 3_600_000).toISOString(),
    category: "team",
  },
  {
    id: "a3",
    headline: "The tactical tweak behind the midfield revival",
    description: "An inverted full-back is quietly changing how build-up play unfolds.",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=70",
    source: "Analysis",
    publishedAt: new Date(Date.now() - 20 * 3_600_000).toISOString(),
    category: "team",
  },
  {
    id: "a4",
    headline: "Soweto derby heads a blockbuster Premiership weekend",
    description: "Pirates and Chiefs meet at FNB with third place on the line.",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=70",
    source: "Betway Premiership",
    publishedAt: new Date(Date.now() - 28 * 3_600_000).toISOString(),
    category: "league",
  },
  {
    id: "a5",
    headline: "Stellenbosch climb into the top four after Cape win",
    description: "A third clean sheet in four lifts them above SuperSport on goal difference.",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=70",
    source: "League Round-up",
    publishedAt: new Date(Date.now() - 36 * 3_600_000).toISOString(),
    category: "league",
  },
  {
    id: "a6",
    headline: "AmaZulu appoint new head coach ahead of the run-in",
    description: "Usuthu turn to a familiar face to steady a season of narrow defeats.",
    image: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800&q=70",
    source: "Transfers",
    publishedAt: new Date(Date.now() - 50 * 3_600_000).toISOString(),
    category: "league",
  },
  {
    id: "a7",
    headline: "Fantasy watch: five differentials for the double gameweek",
    description: "Low ownership, high ceiling — the picks worth the risk this week.",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=70",
    source: "Fantasy",
    publishedAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    category: "fantasy",
  },
  {
    id: "a8",
    headline: "Price rises after the derby: who to buy before Friday",
    description: "Two forwards jumped 0.2m overnight following back-to-back returns.",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=70",
    source: "Fantasy",
    publishedAt: new Date(Date.now() - 14 * 3_600_000).toISOString(),
    category: "fantasy",
  },
  {
    id: "a9",
    headline: "Clean-sheet odds shift as Sundowns tighten up at the back",
    description: "Their defenders are suddenly the best value points-per-million in the game.",
    image: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800&q=70",
    source: "Fantasy",
    publishedAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    category: "fantasy",
  },
  {
    id: "a10",
    headline: "Captaincy call: the safest armband for gameweek 25",
    description: "Fixture swing and minutes risk make this a two-horse race.",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=70",
    source: "Fantasy",
    publishedAt: new Date(Date.now() - 40 * 3_600_000).toISOString(),
    category: "fantasy",
  },
];

export const VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Highlights: a five-goal thriller under the lights",
    thumbnail: "https://images.unsplash.com/photo-1493924923166-fbeb0d0ee3c8?w=800&q=70",
    duration: "4:12",
    views: "1.2M",
  },
  {
    id: "v2",
    title: "Every angle of the winning free kick",
    thumbnail: "https://images.unsplash.com/photo-1552667466-07770ae110d0?w=800&q=70",
    duration: "2:38",
    views: "684K",
  },
  {
    id: "v3",
    title: "Inside training: sharpening the press",
    thumbnail: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=70",
    duration: "6:05",
    views: "312K",
  },
  {
    id: "v4",
    title: "Press conference: the manager on squad depth",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=70",
    duration: "9:47",
    views: "128K",
  },
];