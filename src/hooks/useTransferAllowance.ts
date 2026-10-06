import { useEditableGameweek, useFantasyTeam, useGameweek, useTransfers } from "@/hooks/useFantasy";
import { firstGameweekOf, transferAllowance } from "@/services/transferRules";

/** Free transfers for the gameweek the user is currently editing. `pending` counts unsaved transfers. */
export function useTransferAllowance(pending = 0) {
  const { data: team } = useFantasyTeam();
  const { data: transfers = [] } = useTransfers();
  const { data: gameweek } = useGameweek();
  const { target } = useEditableGameweek();
  const gw = target?.number ?? gameweek?.number ?? 0;
  return transferAllowance(transfers, gw, firstGameweekOf(team, gw), pending);
}