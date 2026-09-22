/**
 * Spreadsheet import pipeline for master data.
 *
 * parse -> validate -> plan (diff against Firebase) -> confirm -> write.
 * Nothing is written until an administrator confirms the plan, and a row that
 * is missing from a file is never deleted.
 */
import Papa from "papaparse";

import {
  CURRENT_SEASON,
  normalizeName,
  type MasterPlayer,
  type MasterTeam,
  type PlayerPosition,
  type PlayerStatus,
} from "@/types/master";

export type IssueSeverity = "error" | "warning";

export interface CsvIssue {
  row: number | null;
  field: string | null;
  message: string;
  severity: IssueSeverity;
}

export interface FieldChange {
  field: string;
  from: string;
  to: string;
}

export interface PlanEntry<T> {
  id: string;
  label: string;
  record: T;
  changes: FieldChange[];
}

export interface ImportPlan<T> {
  fileName: string;
  rowsRead: number;
  created: PlanEntry<T>[];
  updated: PlanEntry<T>[];
  unchanged: PlanEntry<T>[];
  issues: CsvIssue[];
  /** Records already in the database that this file does not mention. Never deleted. */
  missingFromFile: { id: string; label: string }[];
}

export interface PlayerImportPlan extends ImportPlan<MasterPlayer> {
  transfers: { playerId: string; playerName: string; from: string; to: string }[];
  positionChanges: { playerId: string; playerName: string; from: string; to: string }[];
}

/* --------------------------------- parsing -------------------------------- */

export type CsvRow = Record<string, string>;

const headerKey = (header: string) =>
  header.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");

export function parseCsvFile(file: File): Promise<{ rows: CsvRow[]; issues: CsvIssue[] }> {
  return new Promise((resolve) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: headerKey,
      complete: (result) => {
        const issues: CsvIssue[] = result.errors.slice(0, 20).map((error) => ({
          row: typeof error.row === "number" ? error.row + 2 : null,
          field: null,
          message: error.message,
          severity: "error",
        }));
        resolve({ rows: result.data ?? [], issues });
      },
      error: (error) => {
        resolve({
          rows: [],
          issues: [{ row: null, field: null, message: error.message, severity: "error" }],
        });
      },
    });
  });
}

const text = (row: CsvRow, ...keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "";
};

const optional = (value: string): string | null => (value === "" ? null : value);

const toBool = (value: string, fallback = true): boolean => {
  if (value === "") return fallback;
  return !["false", "0", "no", "n"].includes(value.toLowerCase());
};

const toNumber = (value: string): number | null => {
  if (value === "") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidDate = (value: string): boolean => !Number.isNaN(new Date(value).getTime());

/* ------------------------------- positions -------------------------------- */

const POSITION_ALIASES: Record<string, PlayerPosition> = {
  gk: "GK", g: "GK", goalkeeper: "GK", keeper: "GK", goalie: "GK",
  def: "DEF", d: "DEF", defender: "DEF", defence: "DEF", cb: "DEF", lb: "DEF", rb: "DEF",
  lwb: "DEF", rwb: "DEF", fullback: "DEF", "centre-back": "DEF",
  mid: "MID", m: "MID", midfielder: "MID", midfield: "MID", cm: "MID", dm: "MID", am: "MID",
  lm: "MID", rm: "MID",
  fwd: "FWD", f: "FWD", forward: "FWD", striker: "FWD", st: "FWD", cf: "FWD", lw: "FWD",
  rw: "FWD", winger: "FWD", attacker: "FWD",
};

/** Maps a source position onto the app's four positions. Never guesses. */
export function normalizePosition(raw: string): PlayerPosition | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  return POSITION_ALIASES[key] ?? POSITION_ALIASES[key.split("-")[0] ?? ""] ?? null;
}

/* ---------------------------------- diff ---------------------------------- */

const show = (value: unknown): string =>
  value === null || value === undefined || value === "" ? "—" : String(value);

function diff<T extends object>(before: T, after: T, fields: (keyof T)[]): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    if (show(before[field]) !== show(after[field])) {
      changes.push({ field: String(field), from: show(before[field]), to: show(after[field]) });
    }
  }
  return changes;
}

/* ------------------------------- teams plan -------------------------------- */

const TEAM_FIELDS: (keyof MasterTeam)[] = [
  "teamName", "shortName", "country", "stadium", "logo",
  "worldfootballUrl", "sportscoreSlug", "season", "active",
];

export function buildTeamPlan(
  fileName: string,
  rows: CsvRow[],
  existing: MasterTeam[],
  options: { season?: string } = {},
): ImportPlan<MasterTeam> {
  const season = options.season ?? CURRENT_SEASON;
  const now = new Date().toISOString();
  const existingById = new Map(existing.map((team) => [team.teamId, team]));
  const seen = new Set<string>();
  const issues: CsvIssue[] = [];
  const plan: ImportPlan<MasterTeam> = {
    fileName,
    rowsRead: rows.length,
    created: [],
    updated: [],
    unchanged: [],
    issues,
    missingFromFile: [],
  };

  rows.forEach((row, index) => {
    const line = index + 2;
    const teamId = text(row, "team_id", "teamid", "id");
    const teamName = text(row, "team_name", "teamname", "name");

    if (!teamId) {
      issues.push({ row: line, field: "team_id", message: "Missing club ID — row skipped.", severity: "error" });
      return;
    }
    if (!teamName) {
      issues.push({ row: line, field: "team_name", message: "Missing club name — row skipped.", severity: "error" });
      return;
    }
    if (seen.has(teamId)) {
      issues.push({ row: line, field: "team_id", message: `Duplicate club ID "${teamId}" in this file — row skipped.`, severity: "error" });
      return;
    }
    seen.add(teamId);

    const worldfootballUrl = text(row, "worldfootball_url", "url");
    if (worldfootballUrl && !isValidUrl(worldfootballUrl)) {
      issues.push({ row: line, field: "worldfootball_url", message: `${teamName}: web address is not valid.`, severity: "warning" });
    }

    const previous = existingById.get(teamId);
    const record: MasterTeam = {
      teamId,
      teamName,
      shortName: optional(text(row, "short_name", "shortname", "abbreviation")),
      country: optional(text(row, "country")),
      stadium: optional(text(row, "stadium", "venue")),
      logo: optional(text(row, "logo", "logo_url", "badge")),
      worldfootballUrl: optional(worldfootballUrl),
      sportscoreSlug: optional(text(row, "sportscore_slug", "sportscoreslug")),
      season: text(row, "season") || season,
      active: toBool(text(row, "active")),
      source: text(row, "source") || "worldfootball",
      scrapedAt: optional(text(row, "scraped_at")),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };

    const entry: PlanEntry<MasterTeam> = {
      id: teamId,
      label: teamName,
      record,
      changes: previous ? diff(previous, record, TEAM_FIELDS) : [],
    };

    if (!previous) plan.created.push(entry);
    else if (entry.changes.length > 0) plan.updated.push(entry);
    else plan.unchanged.push(entry);
  });

  plan.missingFromFile = existing
    .filter((team) => !seen.has(team.teamId))
    .map((team) => ({ id: team.teamId, label: team.teamName }));

  return plan;
}

/* ------------------------------ players plan ------------------------------- */

const PLAYER_FIELDS: (keyof MasterPlayer)[] = [
  "playerName", "teamId", "teamName", "position", "positionRaw", "shirtNumber",
  "nationality", "dateOfBirth", "worldfootballUrl", "season", "active", "status", "fantasyPrice",
];

export function buildPlayerPlan(
  fileName: string,
  rows: CsvRow[],
  existing: MasterPlayer[],
  teams: MasterTeam[],
  options: { season?: string } = {},
): PlayerImportPlan {
  const season = options.season ?? CURRENT_SEASON;
  const now = new Date().toISOString();
  const existingById = new Map(existing.map((player) => [player.playerId, player]));
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const seen = new Set<string>();
  const nameCount = new Map<string, string[]>();
  const issues: CsvIssue[] = [];

  const plan: PlayerImportPlan = {
    fileName,
    rowsRead: rows.length,
    created: [],
    updated: [],
    unchanged: [],
    issues,
    missingFromFile: [],
    transfers: [],
    positionChanges: [],
  };

  rows.forEach((row, index) => {
    const line = index + 2;
    const playerId = text(row, "player_id", "playerid", "id");
    const playerName = text(row, "player_name", "playername", "name");
    const teamId = text(row, "team_id", "teamid");
    const teamNameRaw = text(row, "team_name", "teamname", "club");
    const positionRaw = text(row, "position", "position_raw", "pos");

    if (!playerId) {
      issues.push({ row: line, field: "player_id", message: "Missing player ID — row skipped.", severity: "error" });
      return;
    }
    if (!playerName) {
      issues.push({ row: line, field: "player_name", message: "Missing player name — row skipped.", severity: "error" });
      return;
    }
    if (!teamId) {
      issues.push({ row: line, field: "team_id", message: `${playerName}: missing club ID — row skipped.`, severity: "error" });
      return;
    }
    if (seen.has(playerId)) {
      issues.push({ row: line, field: "player_id", message: `Duplicate player ID "${playerId}" in this file — row skipped.`, severity: "error" });
      return;
    }
    seen.add(playerId);

    const club = teamsById.get(teamId);
    if (!club) {
      issues.push({ row: line, field: "team_id", message: `${playerName}: club "${teamId}" has not been imported yet — row skipped.`, severity: "error" });
      return;
    }
    if (!teamNameRaw) {
      issues.push({ row: line, field: "team_name", message: `${playerName}: missing club name, using "${club.teamName}".`, severity: "warning" });
    }

    const position = positionRaw ? normalizePosition(positionRaw) : null;
    if (!positionRaw) {
      issues.push({ row: line, field: "position", message: `${playerName}: no position given — left blank rather than guessed.`, severity: "warning" });
    } else if (!position) {
      issues.push({ row: line, field: "position", message: `${playerName}: position "${positionRaw}" is not recognised — left blank.`, severity: "warning" });
    }

    const nationality = text(row, "nationality", "country");
    if (!nationality) {
      issues.push({ row: line, field: "nationality", message: `${playerName}: missing nationality.`, severity: "warning" });
    }

    const dateOfBirth = text(row, "date_of_birth", "dob", "birth_date");
    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      issues.push({ row: line, field: "date_of_birth", message: `${playerName}: date of birth "${dateOfBirth}" is not a valid date.`, severity: "warning" });
    }

    const worldfootballUrl = text(row, "worldfootball_url", "url");
    if (worldfootballUrl && !isValidUrl(worldfootballUrl)) {
      issues.push({ row: line, field: "worldfootball_url", message: `${playerName}: web address is not valid.`, severity: "warning" });
    }

    const normalized = normalizeName(playerName);
    nameCount.set(normalized, [...(nameCount.get(normalized) ?? []), playerId]);

    const previous = existingById.get(playerId);
    const statusRaw = text(row, "status").toLowerCase();
    const status: PlayerStatus = (
      ["active", "injured", "suspended", "transferred", "inactive"] as PlayerStatus[]
    ).includes(statusRaw as PlayerStatus)
      ? (statusRaw as PlayerStatus)
      : (previous?.status ?? "active");

    const record: MasterPlayer = {
      playerId,
      playerName,
      playerNameNormalized: normalized,
      teamId,
      teamName: teamNameRaw || club.teamName,
      position,
      positionRaw: optional(positionRaw),
      shirtNumber: toNumber(text(row, "shirt_number", "number", "squad_number")),
      nationality: optional(nationality),
      dateOfBirth: optional(dateOfBirth),
      worldfootballUrl: optional(worldfootballUrl),
      // Provider mapping is left empty until a reliable match exists.
      sportscorePlayerId: previous?.sportscorePlayerId ?? optional(text(row, "sportscore_player_id")),
      sportscoreSlug: previous?.sportscoreSlug ?? optional(text(row, "sportscore_slug")),
      sportscoreName: previous?.sportscoreName ?? null,
      season: text(row, "season") || season,
      active: toBool(text(row, "active")),
      status,
      // Price belongs to this application, not to any external source.
      fantasyPrice: toNumber(text(row, "fantasy_price", "price")) ?? previous?.fantasyPrice ?? null,
      fantasyPoints: previous?.fantasyPoints ?? 0,
      source: text(row, "source") || "worldfootball",
      scrapedAt: optional(text(row, "scraped_at")),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };

    const changes = previous ? diff(previous, record, PLAYER_FIELDS) : [];
    const entry: PlanEntry<MasterPlayer> = { id: playerId, label: playerName, record, changes };

    if (previous && previous.teamId !== record.teamId) {
      plan.transfers.push({
        playerId,
        playerName,
        from: previous.teamName,
        to: record.teamName,
      });
    }
    if (previous && previous.position !== record.position) {
      plan.positionChanges.push({
        playerId,
        playerName,
        from: previous.position ?? "—",
        to: record.position ?? "—",
      });
    }

    if (!previous) plan.created.push(entry);
    else if (changes.length > 0) plan.updated.push(entry);
    else plan.unchanged.push(entry);
  });

  for (const [name, ids] of nameCount) {
    if (ids.length > 1) {
      issues.push({
        row: null,
        field: "player_name",
        message: `"${name}" appears ${ids.length} times with different IDs — check these are different people.`,
        severity: "warning",
      });
    }
  }

  plan.missingFromFile = existing
    .filter((player) => !seen.has(player.playerId))
    .map((player) => ({ id: player.playerId, label: `${player.playerName} (${player.teamName})` }));

  return plan;
}

export const countIssues = (issues: CsvIssue[]) => ({
  errors: issues.filter((issue) => issue.severity === "error").length,
  warnings: issues.filter((issue) => issue.severity === "warning").length,
});
