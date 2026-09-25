# Roadmap

## Done
- SportScore live data layer: config, typed client, cache with dedupe + stale fallback, normalizers.
- All invented clubs, players, fixtures, results, standings and simulated live engine deleted.
- Firebase master data model (teams, players, playerTransfers, matches, matchEvents, playerMatchStats, dataImports, admins).
- CSV import pipeline: parse -> validate -> preview/diff -> confirm -> write; never deletes records missing from a file.
- Admin area (/admin, /admin/import) behind an admins/{uid} check, with import history.
- Screens rebuilt on real data with empty/loading/error states: Home, Match Center, team pages, Players, player profile, Fantasy (team builder, transfers, points, leagues), Onboarding, Profile, News, Videos.
- Firestore rules: master data readable by signed-in users, writable by administrators only.

## Blocked / waiting on the user
- The real teams.csv and players.csv from the WorldFootball scraper — the app is empty until they are imported.
- Publish the updated firestore.rules in the Firebase console, and add an `admins/{your-uid}` document so the data management area opens.

## Known limitations (data provider)
- Match events carry display names only, no player IDs — no automatic player matching; provider links stay empty.
- Per-match assists, own goals, penalty misses, penalty saves and minutes played are not provided; those scoring rules stay in place but score nothing rather than guessing.
