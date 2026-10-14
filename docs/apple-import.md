# Apple import processing

The observed Apple Media Services export can now be staged and normalized locally. This does not change the public dashboard or require Apple authentication. Original ZIPs and source rows remain immutable under the ignored `private-data/music/apple/` directory.

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

Before promoting Apple data, review overlap and stream-grouping policy, unresolved catalog identities and source coverage. Then implement an idempotent hosted import with source provenance, duration evidence, and Spotify overlap reconciliation. No automatic privacy-export download is assumed.
