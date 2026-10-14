# Apple import processing

**Permanent scope decision: Apple is a one-time supplied-file import only. No Apple API, authentication, MusicKit or ongoing sync will be implemented.** Spotify is the sole ongoing collection source. Original ZIPs and source rows remain immutable under the ignored `private-data/music/apple/` directory.

## Internal dashboard switch

`MUSIC_INCLUDE_APPLE_IMPORT=true` includes this processed archive in the existing Music Stats results. It is enabled in the local ignored `.env.local` for immediate exploration. False or unset excludes Apple. It is server-only, has no public query parameter/UI, and does not change Spotify collection. Restart the local server after changing the environment flag. The portfolio remains unpublished; the private local input is not bundled for hosting.

After normalization, run `& private-data/music/python-env/Scripts/python.exe scripts/music/export_apple_dashboard.py` to generate ignored `private-data/music/apple/apple-dashboard.json`. The API reads it only when the switch is enabled and combines it with the cached Spotify snapshot before aggregation. Missing/invalid input fails explicitly rather than silently returning Spotify-only results with the switch on.

This provisional preview includes 6,924 qualified Apple streams and 1,296,848,377 reported song milliseconds under the current 30-second/30-minute reconstruction policy. Short attempts retain time with zero qualifying streams. Aggregate non-catalog and invalid time-only rows remain in the audit, outside song statistics. Hour fragments split time across Eastern midnight/hours without adding streams; each qualified attempt counts once at its start. The internal count weight defaults to one for existing Spotify records.

Unique matching title/album/artist/duration metadata reuses observed Spotify track IDs; unique artist names and album credits reuse their catalog identities. Ambiguous matches and version labels remain separate. This is catalog matching, not play deduplication against a future Spotify extended export. Repeated inclusion replaces the Apple subset, preventing duplicate addition. Original durations, overlaps and unresolved identities remain available for later correction.

Verification: nineteen JavaScript music tests and eight Python import tests passed, along with lint, type checking and production build. The actual local endpoint for February 5–September 19 returns exactly 6,924 streams and 1,296,848,377 ms; daily and hourly duration sums reconcile. Browser verification confirmed combined Lifetime stats and artist rankings. Artwork is reused only from matching cached Spotify metadata; missing artwork remains a placeholder and never triggers Apple API access. The local server was restarted with the flag enabled; no cloud resource or deployment changed.

## Run on Windows

```powershell
python -m venv private-data/music/python-env
& private-data/music/python-env/Scripts/python.exe -m pip install -r scripts/music/requirements.txt
& private-data/music/python-env/Scripts/python.exe scripts/music/normalize_apple.py 'C:/path/to/Apple_Media_Services.zip'
& private-data/music/python-env/Scripts/python.exe -m unittest discover -s tests -p 'test_apple*.py' -v
```

The pinned timezone database supplies America/New_York on Windows. Outputs are `apple-normalized.sqlite3`, `apple-normalization-audit.json`, and `apple-import-report.md`, alongside the existing staging database and preserved archive. Run identity includes archive hash, algorithm version, timezone, pause gap and stream threshold. Repeating a run reuses its records and regenerates the reports; changed policy creates a separate run.

## Rules

- PLAY_END rows provide reported durations. PLAY_START and lyric events never add listening time. Exact semantic duplicate ends retain source links without adding time twice.
- Same-channel pauses join only when catalog identity and playback position agree, within a configurable gap (default 30 minutes). Adjacent seeks can join within five seconds. Natural ends and skips start a new candidate. A configurable 30-second threshold qualifies a candidate; these inferred attempts are not Apple's official stream counts.
- Library identity requires a unique normalized title/album and compatible duration. Live, remaster and explicit labels are preserved. Ambiguous and unmatched identities retain their time and candidate IDs.
- Non-catalog aggregate and invalid item types remain time-only records. Daily and other overlapping summary reports are not added to detailed history.
- UTC intervals split into Eastern hourly buckets, including midnight and DST. Segment, reconstructed-session and hourly duration sums must agree exactly. Invalid rows are quarantined with their reported duration tracked.
- Start-event ID conflicts and ambiguous timestamp links remain audit issues. Device channels are hashed; original source records retain provenance.
- Interval overlap is audited without deleting either record. Crossfade, duplicated telemetry and overlapping aggregate records cannot be distinguished by timestamps alone.

## Initial export findings

Detailed events span February 5 through September 19, 2026 (UTC), while the daily report spans March 16 through September 15. The export contains 21,947 end segments and 4,035 library tracks. Every accepted end duration matches its wall interval; normalization preserves all 1,314,313,468 reported milliseconds. Those durations include time-only item types and overlapping intervals, so the source sum is not unique wall-clock listening time.

The first overlap inspection found 3,448 same-channel overlapping pairs: 2,973 different identities and 475 matching identities, with a median overlap of 510 ms and 227 pairs exceeding 30 seconds. Transition fields provide no usable explanation in this file. Keep these records for reconciliation rather than assuming crossfade or deleting them as duplicates.

The user explicitly authorized exploring these provisional Apple results now via the internal switch. Continue reviewing overlaps, grouping and catalog identities without blocking that preview. Before publishing or importing Spotify's extended archive, reconcile overlapping evidence and move the prepared data into durable hosted storage as appropriate. This requires no Apple API.
