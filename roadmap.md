# Roadmap

## In progress: live football data (SportScore)
- [x] Probe real endpoints, document available/missing stats
- [x] Central config (`src/config/sportsApi.ts`)
- [x] Raw API types (`src/services/sportscore/types.ts`)
- [x] Cache + request dedupe + stale fallback (`src/services/sportscore/cache.ts`)
- [ ] Endpoint functions (`sportscoreApi.ts`)
- [ ] Normalization layer (teams, matches, standings, events, scorers)
- [ ] Query hooks with per-endpoint refresh intervals
- [ ] Match Center: table, fixtures, results, live from API
- [ ] Team page from API
- [ ] "Powered by SportScore" attribution + last-updated indicator

## Next: remove generated PSL data, Firebase master data
- [ ] Delete generated TEAMS, playerPool, fake standings/fixtures/results/events
- [ ] Firebase master data model: teams, players, playerTransfers, matches,
      matchEvents, playerMatchStats, dataImports (stable IDs, season, source)
- [ ] Empty states everywhere data is not yet imported
- [ ] Admin area: Data Management
  - [ ] teams.csv + players.csv upload, parse, validate, preview, confirm, import
  - [ ] Change detection (new/updated/unchanged/warnings/errors), no duplicates
  - [ ] Never delete players missing from a CSV; list them for review
  - [ ] Import history (dataImports)
  - [ ] Admin dashboard: counts, last import, sync status
- [ ] Fantasy squad/selection reads Firebase players (empty until imported)
- [ ] Team pages read Firebase teams, squad grouped by position
- [ ] Player profile from Firebase master record + SportScore stats
- [ ] Fantasy scoring engine: configurable rules, real events only
- [ ] Admin-only Firestore rules for master data + import history
- [ ] Season field (2026/27) stored, not hard-coded

## Blocked / waiting
- Real teams.csv and players.csv from the WorldFootball scraper (user side)
- Firestore rules must be published in the Firebase console by the user
