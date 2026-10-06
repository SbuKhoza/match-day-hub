/**
 * Transfer allowance rules.
 *  - A team's first gameweek is a free-for-all: unlimited transfers, no penalty, until its deadline.
 *  - From the next gameweek on, every gameweek grants 1 free transfer.
 *  - Unused free transfers carry over, but never more than 4 can be banked.
 *  - Each transfer beyond the free ones costs 3 points in the gameweek the transfer applies to.
 */
import type { FantasyTeam, Transfer } from "@/types/fantasy";

export const FREE_TRANSFERS_PER_GAMEWEEK = 1;
export const MAX_BANKED_TRANSFERS = 4;
export const EXTRA_TRANSFER_PENALTY = 3;

export interface TransferAllowance {
  gameweek: number;
  /** True during the team's first gameweek: unlimited transfers until the deadline, no penalty. */
  unlimited: boolean;
  /** Free transfers available in this gameweek: what was banked plus this gameweek's one, capped at 4. */
  available: number;
  /** Transfers made (or staged) for this gameweek. */
  used: number;
  /** Free transfers still left after `used`. */
  remaining: number;
  /** Transfers beyond the free ones. */
  extra: number;
  /** Points deducted from this gameweek for the extra transfers. */
  penalty: number;
}

/** First gameweek the team has a stored line-up for. Falls back to `fallback` for brand-new teams. */
export function firstGameweekOf(
  team: Pick<FantasyTeam, "lineups"> | null | undefined,
  fallback: number,
): number {
  const keys = Object.keys(team?.lineups ?? {})
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  return keys.length > 0 ? Math.min(...keys) : fallback;
}

/**
 * Free transfers for `gameweek`, replaying the history gameweek by gameweek from `firstGameweek`.
 * `pending` is the number of transfers about to be made for `gameweek` (not yet saved).
 */
export function transferAllowance(
  transfers: Pick<Transfer, "gameweek">[],
  gameweek: number,
  firstGameweek: number,
  pending = 0,
): TransferAllowance {
  const perGameweek = new Map<number, number>();
  for (const transfer of transfers) {
    perGameweek.set(transfer.gameweek, (perGameweek.get(transfer.gameweek) ?? 0) + 1);
  }

  // First gameweek: build and re-build freely until the deadline. Nothing is banked from it.
  if (gameweek <= firstGameweek) {
    return {
      gameweek,
      unlimited: true,
      available: Number.POSITIVE_INFINITY,
      used: (perGameweek.get(gameweek) ?? 0) + pending,
      remaining: Number.POSITIVE_INFINITY,
      extra: 0,
      penalty: 0,
    };
  }

  // The rules start applying in the gameweek after the first one.
  let banked = 0;
  for (let gw = firstGameweek + 1; gw < gameweek; gw += 1) {
    const available = Math.min(MAX_BANKED_TRANSFERS, banked + FREE_TRANSFERS_PER_GAMEWEEK);
    banked = Math.max(0, available - (perGameweek.get(gw) ?? 0));
  }

  const available = Math.min(MAX_BANKED_TRANSFERS, banked + FREE_TRANSFERS_PER_GAMEWEEK);
  const used = (perGameweek.get(gameweek) ?? 0) + pending;
  const extra = Math.max(0, used - available);
  return {
    gameweek,
    unlimited: false,
    available,
    used,
    remaining: Math.max(0, available - used),
    extra,
    penalty: extra * EXTRA_TRANSFER_PENALTY,
  };
}