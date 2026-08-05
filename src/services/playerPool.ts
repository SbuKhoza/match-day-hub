import { TEAMS } from "./mockData";
import type { Player, PlayerPosition } from "@/types/fantasy";

const FIRST = ["Thabo","Sipho","Lebo","Kagiso","Ronwen","Themba","Percy","Teboho","Given","Bongani","Mduduzi","Aubrey","Keagan","Lyle","Sibongiseni","Oswin","Neo","Katlego"];
const LAST = ["Mokoena","Zwane","Dlamini","Mbatha","Nkosi","Radebe","Shabalala","Maluleka","Ngcobo","Mahlangu","Sithole","Khumalo","Ndlovu","Mokwena","Baloyi","Petersen","Molefe","Sekgota"];

const SHAPE: { position: PlayerPosition; count: number; base: number }[] = [
  { position: "GK", count: 3, base: 4_500_000 },
  { position: "DEF", count: 6, base: 5_000_000 },
  { position: "MID", count: 6, base: 6_500_000 },
  { position: "FWD", count: 3, base: 8_000_000 },
];

/** Deterministic pseudo-random from a string seed (stable between renders/SSR). */
function seeded(seed: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function buildPlayers(): Player[] {
  const players: Player[] = [];
  TEAMS.forEach((team, teamIndex) => {
    SHAPE.forEach(({ position, count, base }) => {
      for (let i = 0; i < count; i += 1) {
        const id = `${team.id}-${position.toLowerCase()}-${i + 1}`;
        const r = seeded(id);
        const nameIndex = (teamIndex * 7 + i * 3 + position.length) % FIRST.length;
        players.push({
          id,
          name: `${FIRST[nameIndex]} ${LAST[(nameIndex + teamIndex) % LAST.length]}`,
          position,
          clubId: team.id,
          price: Math.round((base + r * 6_000_000) / 100_000) * 100_000,
          totalPoints: Math.round(r * 120),
          form: Math.round(r * 90) / 10,
        });
      }
    });
  });
  return players;
}

export const PLAYERS: Player[] = buildPlayers();

export const PLAYER_MAP = new Map(PLAYERS.map((player) => [player.id, player]));

export function getPlayer(id: string): Player | undefined {
  return PLAYER_MAP.get(id);
}
