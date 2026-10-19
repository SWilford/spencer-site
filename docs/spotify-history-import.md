# Extended Spotify history, October 16

The supplied `my_spotify_data.zip` is imported into the local tracker. Its 24 JSON history files contain 204,720 source rows, including 200,783 music records. Music spans December 25, 2017 through October 14, 2026; the latest source timestamp is October 14 at 23:54:30 UTC (7:54:30 PM Eastern). This establishes the actual supplied coverage, not a promise about future exports' cutoffs.

The import preserves 16,880,066,005 reported music milliseconds (4,688.91 hours). Under the current 30-second qualification rule, 88,915 Spotify export records count as streams. Short/zero plays remain available; short-play time is retained. Podcasts/audiobooks are preserved as source records but excluded from song statistics. Supplied artist credits remain intact rather than splitting band names on ampersands.

## Provenance and correctness

- Original archive SHA256: `a08375cafe25811f42b762f5eb86fe96137338584269198041e26672f5f98981`. A checksum-verified copy stays in ignored local storage and in the existing private Supabase `music-imports` bucket (12,545,636 bytes).
- `scripts/music/import_spotify_history.py` bounds ZIP size, expansion, entry paths/counts and row counts; it never extracts paths or executes included documents. Original source JSON, including rejected/non-music records, stays in private SQLite.
- Import hashes and source row links make repeating the import idempotent. Matching occurrence identities prevent duplicate addition across overlapping files/packages. The 2,079 identical repeated rows within files are deliberately retained and reported: the export lacks unique play IDs, and deleting repeated occurrences could discard real listening. Some timestamps appear batch-reported; they do not prove accurate continuous intervals.
- Export `ts` is a stream-end timestamp. Time is attributed to that Eastern date/hour rather than inventing exact start intervals. Apple continues to use its separately verified segment intervals and hourly fragments. Both imports currently use a 30-second stream threshold.
- Actual `ms_played` never becomes a full track length. Export durations remain separate from new collector song-length estimates.
- The real overlap check found 80 saved collector entries with matching track URI and a source end timestamp within one second. Their export evidence takes precedence; the API estimates do not add another play/time. Fifty-two newer/unmatched live entries remain. Ambiguous candidates are counted in the reconciliation audit and withheld from adding duplicate estimates, while original evidence stays available.
- This does not establish that the cooldown interval was completely captured. The export ends October 14; subsequent saved API entries provide additional coverage, with completeness still subject to Spotify's available history.

The combined local snapshot initially verified 95,891 streams and 18,188,746,214 milliseconds, including the enabled Apple import. Artist/album identity counts can improve as catalog mappings resolve. No Apple API is used or planned.

## Storage and serving

Local outputs are `private-data/music/spotify/spotify-history.sqlite3`, `spotify-import-audit.json` and `spotify-import-report.md`. All stay out of Git. Raw source rows are not sent to the browser.

`src/lib/music-history-store.ts` opens the normalized database read-only using the project's Node 22.20 native SQLite runtime. Temporary tables combine historical evidence, the internal Apple switch and saved collector data. Catalog, time, artist, track and album projections support indexed range queries and cached aggregate results; the browser receives the same allowlisted summary/ranking/chart shape. Native SQLite requires Node 22.20 or later. The portfolio remains local/unpublished; normalized history must move to durable hosted analytics before deploying, while the original archive is already backed up privately. Do not bundle private databases with a public build.

```powershell
& private-data/music/python-env/Scripts/python.exe scripts/music/import_spotify_history.py 'C:/path/to/my_spotify_data.zip'
node scripts/music/upload-spotify-history.mjs
npm run test:music
& private-data/music/python-env/Scripts/python.exe -m unittest discover -s tests -p 'test_*.py' -v
```

See [catalog enrichment](spotify-catalog-enrichment.md) for the separate artwork worker and collector quota protection.

## Verification — October 16, 2026

All 33 music tests and 10 Python import tests passed, along with lint, type checking, production build and the collector's Deno check. The lifetime endpoint's daily durations sum exactly to its summary duration. The hosted collector completed its scheduled 1:20 PM Eastern run while the independent artwork worker was active, with no error or retry deadline. Artist images remain an incremental background task; unresolved or ambiguous public catalog matches retain their placeholders rather than receiving an unrelated portrait.

## Loading performance — October 19, 2026

The web route reads its last good private collector snapshot immediately, then schedules a single shared remote refresh after responding. A remote timeout retains saved data and does not trigger collection. Last collected continues to report the actual collection timestamp, and calendar navigation uses the current Eastern date even while offline. No previously saved snapshot means the first successful remote read is still required.

Historical cache identity includes source database identity, actual play/catalog content, and the Apple inclusion result; refresh timestamps alone do not rebuild facts. The existing in-memory projections and range results stay reusable while those inputs are unchanged; collection freshness updates independently. A server restart still requires an initial projection build. The source database remains read-only. Apple input mapping is reused for unchanged snapshots and import/enrichment files; no Apple service is queried.

Verification: 36 music tests, targeted lint and the final production build/type check passed. With the production server running alone, the first month API response after restart took 5,878 ms, its repeat took 152 ms, the first lifetime query took 1,433 ms and its repeat took 155 ms. Daily durations still reconciled exactly to summary durations. These measure API responses, not full browser paint time; a busy computer and genuine source changes can still add preparation cost.
