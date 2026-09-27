import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import {
  getPlayerById,
  getStaffById,
  getTeamById,
  isAdmin,
  listImports,
  listPlayers,
  listStaff,
  listTeams,
} from "@/services/masterDataService";

/** Master data changes only on import, so it is cached hard and never listened to. */
const MASTER_STALE_TIME = 10 * 60_000;

export function useFirestore() {
  const { services, user } = useAuth();
  return { db: services?.db ?? null, uid: user?.uid ?? null };
}

export function useTeams() {
  const { db } = useFirestore();
  return useQuery({
    queryKey: ["master", "teams"],
    queryFn: () => listTeams(db!),
    enabled: Boolean(db),
    staleTime: MASTER_STALE_TIME,
  });
}

export function useTeam(teamId: string | null | undefined) {
  const { db } = useFirestore();
  return useQuery({
    queryKey: ["master", "team", teamId],
    queryFn: () => getTeamById(db!, teamId!),
    enabled: Boolean(db && teamId),
    staleTime: MASTER_STALE_TIME,
  });
}

export function usePlayers(options: { teamId?: string } = {}) {
  const { db } = useFirestore();
  return useQuery({
    queryKey: ["master", "players", options.teamId ?? "all"],
    queryFn: () => listPlayers(db!, options),
    enabled: Boolean(db),
    staleTime: MASTER_STALE_TIME,
  });
}

export function usePlayer(playerId: string | null | undefined) {
  const { db } = useFirestore();
  return useQuery({
    queryKey: ["master", "player", playerId],
    queryFn: () => getPlayerById(db!, playerId!),
    enabled: Boolean(db && playerId),
    staleTime: MASTER_STALE_TIME,
  });
}

export function useStaff(options: { teamId?: string } = {}) {
  const { db } = useFirestore();
  return useQuery({
    queryKey: ["master", "staff", options.teamId ?? "all"],
    queryFn: () => listStaff(db!, options),
    enabled: Boolean(db),
    staleTime: MASTER_STALE_TIME,
  });
}

export function useStaffMember(staffId: string | null | undefined) {
  const { db } = useFirestore();
  return useQuery({
    queryKey: ["master", "staffMember", staffId],
    queryFn: () => getStaffById(db!, staffId!),
    enabled: Boolean(db && staffId),
    staleTime: MASTER_STALE_TIME,
  });
}

export function useImportHistory() {
  const { db } = useFirestore();
  return useQuery({
    queryKey: ["master", "imports"],
    queryFn: () => listImports(db!),
    enabled: Boolean(db),
  });
}

export function useIsAdmin() {
  const { db, uid } = useFirestore();
  const query = useQuery({
    queryKey: ["master", "isAdmin", uid],
    queryFn: () => isAdmin(db!, uid!),
    enabled: Boolean(db && uid),
    staleTime: MASTER_STALE_TIME,
  });
  return { isAdmin: query.data === true, isLoading: query.isLoading };
}