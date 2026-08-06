import { TEAMS } from "./mockData";
import type { Match, MatchTeam, Team } from "@/types";

const asMatchTeam = (team: Team): MatchTeam => ({
  id: team.id,
  name: team.name,
  shortName: team.shortName,
});

/** Deterministic pseudo-random from a string seed (stable between renders/SSR). */
function seeded(seed: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

export const TOTAL_ROUNDS = 15;
/** The round currently being played. Earlier rounds are finished, later ones upcoming. */
export const CURRENT_ROUND = 9;
/** How many matches of the current round are still in progress. */
const LIVE_IN_ROUND = 3;

export interface SeasonMatch extends Match {
  round: number;
}

/** Circle-method fixture list for every club in the league. */
function buildRounds(): { home: Team; away: Team }[][] {
  const teams = [...TEAMS];
  const [fixed, ...rest] = teams;
  const rounds: { home: Team; away: Team }[][] = [];

  for (let r = 0; r < TOTAL_ROUNDS; r += 1) {
    const rotated = [...rest.slice(r % rest.length), ...rest.slice(0, r % rest.length)];
    const half = rotated.length / 2;
    const pairs: { home: Team; away: Team }[] = [];
    const opponent = rotated[rotated.length - 1]!;
    pairs.push(r % 2 === 0 ? { home: fixed!, away: opponent } : { home: opponent, away: fixed! });
    for (let i = 0; i < half; i += 1) {
      const home = rotated[i]!;
      const away = rotated[rotated.length - 2 - i]!;
      if (!home || !away || home.id === opponent.id || away.id === opponent.id) continue;
      pairs.push(r % 2 === 0 ? { home, away } : { home: away, away: home });
    }
    rounds.push(pairs);
  }
  return rounds;
}

export function buildSeason(): SeasonMatch[] {
  const matches: SeasonMatch[] = [];
  const rounds = buildRounds();

  rounds.forEach((pairs, roundIndex) => {
    const round = roundIndex + 1;
    pairs.forEach((pair, matchIndex) => {
      const id = `r${round}-${pair.home.id}-${pair.away.id}`;
      const dayOffset = (round - CURRENT_ROUND) * 7;
      const kickoff = new Date(
        Date.now() + dayOffset * 86_400_000 + (matchIndex - 3) * 2 * 3_600_000,
      ).toISOString();
      const competition = round % 5 === 0 ? "Nedbank Cup" : "Betway Premiership";

      if (round < CURRENT_ROUND) {
        const r1 = seeded(`${id}-h`);
        const r2 = seeded(`${id}-a`);
        matches.push({
          id,
          round,
          status: "finished",
          competition,
          kickoff,
          venue: pair.home.name,
          home: asMatchTeam(pair.home),
          away: asMatchTeam(pair.away),
          homeScore: Math.floor(r1 * 4),
          awayScore: Math.floor(r2 * 3),
        });
        return;
      }

      if (round === CURRENT_ROUND) {
        const live = matchIndex < LIVE_IN_ROUND;
        const r1 = seeded(`${id}-h`);
        const r2 = seeded(`${id}-a`);
        matches.push({
          id,
          round,
          status: live ? "live" : "finished",
          competition,
          kickoff: new Date(Date.now() - (live ? 40 : 180) * 60_000).toISOString(),
          venue: pair.home.name,
          home: asMatchTeam(pair.home),
          away: asMatchTeam(pair.away),
          homeScore: live ? Math.floor(r1 * 2) : Math.floor(r1 * 4),
          awayScore: live ? Math.floor(r2 * 2) : Math.floor(r2 * 3),
          ...(live ? { minute: 30 + matchIndex * 6 } : {}),
        });
        return;
      }

      matches.push({
        id,
        round,
        status: "upcoming",
        competition,
        kickoff,
        venue: pair.home.name,
        home: asMatchTeam(pair.home),
        away: asMatchTeam(pair.away),
      });
    });
  });

  return matches;
}

export interface TableRow {
  teamId: string;
  name: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

/** League table derived from every finished (and in-progress) match. */
export function buildTable(matches: Match[]): TableRow[] {
  const rows = new Map<string, TableRow>();
  for (const team of TEAMS) {
    rows.set(team.id, {
      teamId: team.id,
      name: team.name,
      shortName: team.shortName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    });
  }

  for (const match of matches) {
    if (match.status === "upcoming") continue;
    const home = rows.get(match.home.id);
    const away = rows.get(match.away.id);
    if (!home || !away) continue;
    const hs = match.homeScore ?? 0;
    const as = match.awayScore ?? 0;

    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    if (match.status === "finished") {
      home.played += 1;
      away.played += 1;
      if (hs > as) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
        home.form.push("W");
        away.form.push("L");
      } else if (hs < as) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
        home.form.push("L");
        away.form.push("W");
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
        home.form.push("D");
        away.form.push("D");
      }
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
      form: row.form.slice(-5),
    }))
    .sort(
      (a, b) =>
        b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor,
    );
}
