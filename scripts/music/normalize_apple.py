"""Reproducible local Apple candidates; never adds summary reports to event totals.

Source rows stay immutable in apple-staging.sqlite3. Candidate sessions are an
explicit pause/seek grouping policy, not Apple's official play-count definition.
"""
import argparse
import bisect
import collections
import datetime as dt
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import sqlite3
import unicodedata
import zipfile
from zoneinfo import ZoneInfo

from apple_archive import ACTIVITY, DAILY, PREFIX, MAX_ENTRY, MAX_TOTAL, stage_archive, validate_archive

VERSION = 'apple-candidates-2'
UTC = dt.timezone.utc


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def norm(value):
    return ' '.join(unicodedata.normalize('NFC', str(value or '')).casefold().split())


def integer(value):
    return None if value in ('', None) else int(value)


def timestamp(value):
    parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        raise ValueError('Timestamp has no explicit timezone')
    return round(parsed.timestamp() * 1000)


def iso(value):
    return dt.datetime.fromtimestamp(value / 1000, UTC).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def nested_json(archive, filename):
    # No extraction. Bound both the nested ZIP and its expanded payloads.
    with zipfile.ZipFile(io.BytesIO(archive.read(filename))) as nested:
        entries = nested.infolist()
        if len(entries) > 20 or sum(e.file_size for e in entries) > MAX_TOTAL:
            raise ValueError('Nested metadata exceeds limits')
        names = set()
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if entry.filename in names or '..' in path.parts or path.is_absolute() or ':' in entry.filename or '\\' in entry.filename:
                raise ValueError('Unsafe or duplicate nested metadata path')
            names.add(entry.filename)
            if entry.flag_bits & 1 or entry.file_size > MAX_ENTRY or entry.file_size / max(1, entry.compress_size) > 200:
                raise ValueError('Unsafe nested metadata size')
        files = [entry for entry in entries if entry.filename.endswith('.json')]
        if len(files) != 1:
            raise ValueError('Inspect changed nested metadata schema')
        result = json.loads(nested.read(files[0]).decode('utf-8-sig'))
        if not isinstance(result, list) or len(result) > 100000 or any(not isinstance(row, dict) for row in result):
            raise ValueError('Inspect changed metadata JSON structure')
        return result


def catalog_index(tracks):
    index = collections.defaultdict(list)
    for row in tracks:
        if not {'Title', 'Artist', 'Album', 'Track Duration', 'Track Identifier'}.issubset(row):
            raise ValueError('Library track schema changed')
        store_id = row.get('Apple Music Track Identifier') or row.get('Purchased Track Identifier')
        key = f'apple:catalog:{store_id}' if store_id else f'apple:library:{row["Track Identifier"]}'
        index[(norm(row['Title']), norm(row['Album']))].append({
            'key': key, 'apple_id': str(store_id) if store_id else None,
            'title': row['Title'], 'artist': row['Artist'], 'album': row['Album'],
            'media_ms': integer(row['Track Duration']), 'library_id': str(row['Track Identifier'])})
    return index


def match_catalog(segment, index):
    candidates = index.get((norm(segment['title']), norm(segment['album'])), []) if norm(segment['title']) else []
    compatible = [row for row in candidates if row['media_ms'] is not None and segment['media_ms'] is not None and abs(row['media_ms'] - segment['media_ms']) <= 1000]
    keys = {row['key'] for row in compatible}
    artists = {norm(row['artist']) for row in compatible}
    if len(keys) == 1 and len(artists) == 1:
        return {**compatible[0], 'match': 'unique_title_album_duration'}
    # Preserve distinct live/remaster/explicit versions and unresolved metadata.
    return {'key': 'apple:unmatched:' + digest([norm(segment['title']), norm(segment['album']), segment['media_ms']]),
            'title': segment['title'] or 'Unknown track', 'album': segment['album'] or None,
            'artist': None, 'media_ms': segment['media_ms'], 'apple_id': None,
            'match': 'ambiguous' if keys else 'unmatched', 'candidate_ids': sorted({r['key'] for r in candidates})}


def segment_from_row(row, source_sha):
    start, end = timestamp(row['Event Start Timestamp']), timestamp(row['Event End Timestamp'])
    milliseconds = integer(row['Play Duration Milliseconds'])
    if end < start or end - start > 86400000 or milliseconds is None or not 0 <= milliseconds <= 86400000:
        raise ValueError('Invalid segment interval/duration')
    segment = {'source_sha': source_sha, 'event_id': row.get('Event ID'), 'start': start, 'end': end,
               'title': row.get('Song Name', ''), 'album': row.get('Album Name', ''),
               'milliseconds': milliseconds, 'media_ms': integer(row.get('Media Duration In Milliseconds')),
               'start_position': integer(row.get('Start Position In Milliseconds')),
               'end_position': integer(row.get('End Position In Milliseconds')),
               'reason': row.get('End Reason Type', ''), 'item_type': row.get('Item Type', ''),
               'channel': digest([row.get(k, '') for k in ['Source Type', 'Device App Name', 'Client Device Name']])}
    segment['key'] = digest({k: v for k, v in segment.items() if k not in ['source_sha', 'event_id']})
    segment['wall_matches_duration'] = abs(end - start - milliseconds) <= 1
    return segment


def group_sessions(segments, pause_gap_ms, stream_threshold_ms):
    channels = collections.defaultdict(list)
    for segment in segments:
        channels[segment['channel']].append(segment)
    sessions = []
    for channel in sorted(channels):
        current = None
        for segment in sorted(channels[channel], key=lambda s: (s['start'], s['end'], s['key'])):
            previous = current['segments'][-1] if current else None
            gap = segment['start'] - previous['end'] if previous else -1
            same = previous and segment['catalog']['key'] == previous['catalog']['key'] and norm(segment['title']) and segment['item_type'] == previous['item_type'] == 'ITUNES_STORE_CONTENT'
            position_matches = previous and previous['end_position'] is not None and segment['start_position'] is not None and abs(previous['end_position'] - segment['start_position']) <= 100
            resume = same and previous['reason'] == 'PLAYBACK_MANUALLY_PAUSED' and position_matches and 0 <= gap <= pause_gap_ms
            seek = same and previous['reason'] == 'SCRUB_BEGIN' and 0 <= gap <= min(5000, pause_gap_ms)
            if not (resume or seek):
                current = {'key': segment['key'], 'segments': [], 'joins': [], 'catalog': segment['catalog']}
                sessions.append(current)
            else:
                current['joins'].append('position_matched_resume' if resume else 'adjacent_seek')
            current['segments'].append(segment)
    for session in sessions:
        session['start'] = session['segments'][0]['start']
        session['end'] = max(s['end'] for s in session['segments'])
        session['milliseconds'] = sum(s['milliseconds'] for s in session['segments'])
        eligible = all(s['item_type'] == 'ITUNES_STORE_CONTENT' and bool(norm(s['title'])) for s in session['segments'])
        session['qualified'] = session['milliseconds'] >= stream_threshold_ms if eligible else None
    return sorted(sessions, key=lambda s: (s['start'], s['key']))


def hour_buckets(segment, timezone):
    """Split elapsed intervals at UTC-hour edges; preserve every reported ms.

    Non-wall-equal durations are apportioned, explicitly flagged in the audit.
    Repeated fall-back local hours share an hour bucket, matching the dashboard.
    """
    start, end, total = segment['start'], segment['end'], segment['milliseconds']
    if start == end:
        local = dt.datetime.fromtimestamp(start / 1000, timezone)
        return [(local.date().isoformat(), local.hour, total)]
    result, cursor, assigned = [], start, 0
    while cursor < end:
        boundary = min(end, (cursor // 3600000 + 1) * 3600000)
        next_total = total if boundary == end else round(total * (boundary - start) / (end - start))
        local = dt.datetime.fromtimestamp(cursor / 1000, timezone)
        result.append((local.date().isoformat(), local.hour, next_total - assigned))
        cursor, assigned = boundary, next_total
    return result


def interval_audit(segments):
    """Report concurrency without assuming overlapping tracks are duplicates."""
    def union(rows):
        total, edge = 0, None
        for row in sorted(rows, key=lambda s: (s['start'], s['end'])):
            total += max(0, row['end'] - max(row['start'], edge if edge is not None else row['start']))
            edge = max(edge if edge is not None else row['end'], row['end'])
        return total

    channels = collections.defaultdict(list)
    for segment in segments:
        channels[segment['channel']].append(segment)
    elapsed = sum(s['end'] - s['start'] for s in segments)
    return {'elapsed_interval_sum_ms': elapsed, 'wall_clock_union_ms': union(segments),
            'overlap_excess_ms': elapsed - union(segments),
            'within_channel_overlap_excess_ms': elapsed - sum(union(rows) for rows in channels.values())}


def write_audit(output, audit):
    (output / 'apple-normalization-audit.json').write_text(json.dumps(audit, indent=2) + '\n', encoding='utf-8')
    lines = ['# Apple Music import review', '',
             f"Detailed coverage: {audit['source_start']} through {audit['source_end']} (UTC).",
             f"Active Eastern dates: {audit['active_eastern_dates']:,}.", '',
             f"{audit['end_segments']:,} playback segments contain {audit['reported_milliseconds'] / 3600000:,.2f} source-reported hours.",
             'These are segments, including pauses and skips, rather than one stream per row.', '',
             '| Source item type | Segments | Reported hours |', '|---|---:|---:|']
    for kind, values in audit['time_by_item_type'].items():
        lines.append(f"| {kind} | {values['segments']:,} | {values['milliseconds'] / 3600000:,.2f} |")
    lines += ['', '## Reconstruction policy', '',
              f"Pause gap: {audit['config']['pause_gap_ms'] / 60000:g} minutes. Stream threshold: {audit['config']['stream_threshold_ms'] / 1000:g} seconds.",
              f"{audit['candidate_attempts']:,} inferred track attempts; {audit['qualified_candidates']:,} meet that threshold. These are provisional policy-based counts.",
              f"{audit['continued_segments']:,} pause/seek segments were joined without counting paused time.",
              f"{audit['time_only_records']:,} non-track records retain their duration separately.", '',
              '## Identity and reconciliation', '',
              f"{audit['catalog_matched_segments']:,} segments match a unique library identity by title, album and duration; {audit['catalog_unmatched_segments']:,} remain unresolved or time-only.",
              f"Conflicting start-event IDs: {audit['start_id_conflicts']:,}. Starts are supporting evidence rather than duration records.",
              f"Overlapping interval excess: {audit['intervals']['overlap_excess_ms'] / 3600000:.2f} hours. Retained for review; no automatic overlap deletion.",
              f"Unallocated reported duration: {audit['unallocated_reported_milliseconds']:,} ms.",
              'All accepted segment milliseconds reconcile exactly with reconstructed sessions and Eastern hourly buckets.', '',
              f"The separate daily report covers {audit['daily_report']['start']} through {audit['daily_report']['end']}; it is not added to detailed-event totals.", '',
              '## Remaining review', '', *[f'- {warning}' for warning in audit['warnings']], '',
              'Normalization alone does not enable dashboard inclusion. The server-only MUSIC_INCLUDE_APPLE_IMPORT switch controls the separate dashboard export.', '',
              f"Run: `{audit['run_key']}`", '']
    (output / 'apple-import-report.md').write_text('\n'.join(lines), encoding='utf-8')


def normalize(source, output, pause_gap_ms=1800000, stream_threshold_ms=30000):
    if not 0 <= pause_gap_ms <= 86400000 or not 0 <= stream_threshold_ms <= 3600000:
        raise ValueError('Invalid grouping/stream policy')
    timezone = ZoneInfo('America/New_York')
    staged = stage_archive(source, output)
    archive_sha = staged['archive_sha256']
    output = Path(output)
    config = {'version': VERSION, 'archive_sha': archive_sha, 'pause_gap_ms': pause_gap_ms, 'stream_threshold_ms': stream_threshold_ms, 'timezone': str(timezone)}
    run_key = digest(config)
    database = sqlite3.connect(output / 'apple-normalized.sqlite3')
    database.executescript('''
      create table if not exists normalization_runs(run_key text primary key,config_json text,audit_json text);
      create table if not exists segments(run_key text,segment_key text,source_sha text,session_key text,payload_json text,primary key(run_key,segment_key));
      create table if not exists sessions(run_key text,session_key text,payload_json text,primary key(run_key,session_key));
      create table if not exists catalog(run_key text,catalog_key text,payload_json text,primary key(run_key,catalog_key));
      create table if not exists hourly(run_key text,day text,hour integer,item_type text,milliseconds integer,primary key(run_key,day,hour,item_type));
      create table if not exists issues(run_key text,source_sha text,kind text,details_json text);
      create table if not exists source_links(run_key text,source_sha text,segment_key text,primary key(run_key,source_sha));
    ''')
    existing = database.execute('select audit_json from normalization_runs where run_key=?', (run_key,)).fetchone()
    if existing:
        database.close()
        audit = json.loads(existing[0])
        write_audit(output, audit)
        return {**audit, 'already_normalized': True}
    try:
        with zipfile.ZipFile(output / f'{archive_sha}.zip') as archive:
            validate_archive(archive)
            library = nested_json(archive, PREFIX + 'Apple Music Library Tracks.json.zip')
            identifiers = nested_json(archive, PREFIX + 'Identifier Information.json.zip')
        index = catalog_index(library)
        segments, starts, daily_rows, links, issues = {}, [], [], {}, []
        unallocated_ms = 0
        source_db = sqlite3.connect(output / 'apple-staging.sqlite3')
        try:
            for filename, source_sha, payload in source_db.execute('select filename,record_sha,payload_json from source_records where archive_sha=? order by filename,row_number', (archive_sha,)):
                row = json.loads(payload)
                if filename == DAILY:
                    if not {'Date Played', 'Track Identifier', 'Track Description', 'Play Duration Milliseconds', 'Play Count', 'Skip Count'}.issubset(row):
                        raise ValueError('Daily report schema changed')
                    daily_rows.append(row)
                elif row['Event Type'] == 'PLAY_END':
                    try:
                        segment = segment_from_row(row, source_sha)
                    except (ValueError, KeyError, TypeError) as error:
                        issues.append((source_sha, 'invalid_end_segment', {'error': str(error), 'reported_ms': row.get('Play Duration Milliseconds')}))
                        reported = str(row.get('Play Duration Milliseconds', ''))
                        if reported.isdecimal() and len(reported) <= 12:
                            unallocated_ms += int(reported)
                        continue
                    if segment['key'] not in segments:
                        segment['catalog'] = match_catalog(segment, index)
                        segments[segment['key']] = segment
                    else:
                        issues.append((source_sha, 'semantic_duplicate_end', {'segment_key': segment['key']}))
                    links[source_sha] = segment['key']
                elif row['Event Type'] == 'PLAY_START':
                    try:
                        starts.append({'source_sha': source_sha, 'id': row['Event ID'], 'time': timestamp(row['Event Start Timestamp']), 'title': norm(row['Song Name']), 'position': integer(row.get('Start Position In Milliseconds')), 'media': integer(row.get('Media Duration In Milliseconds'))})
                    except (ValueError, KeyError, TypeError):
                        issues.append((source_sha, 'invalid_start', {}))
        finally:
            source_db.close()
        start_ids = collections.defaultdict(list)
        start_index = collections.defaultdict(list)
        for start in starts:
            start_ids[start['id']].append(start)
            start_index[(start['title'], start['position'])].append(start)
        for values in start_index.values():
            values.sort(key=lambda r: r['time'])
        start_times = {key: [r['time'] for r in values] for key, values in start_index.items()}
        matched = collections.Counter()
        for segment in segments.values():
            key = (norm(segment['title']), segment['start_position'])
            values = start_index.get(key, [])
            times = start_times.get(key, [])
            left, right = bisect.bisect_left(times, segment['start'] - 2000), bisect.bisect_right(times, segment['start'] + 2000)
            candidates = [v for v in values[left:right] if v['media'] is not None and segment['media_ms'] is not None and abs(v['media'] - segment['media_ms']) <= 1000]
            matched['unique' if len(candidates) == 1 else 'ambiguous' if candidates else 'unmatched'] += 1
            segment['start_evidence'] = [{'source_sha': v['source_sha'], 'clock_delta_ms': segment['start'] - v['time']} for v in candidates]
            if len(candidates) != 1:
                issues.append((segment['source_sha'], 'start_link_ambiguous' if candidates else 'start_link_missing', {'candidates': len(candidates)}))
        for event_id, values in start_ids.items():
            if len({(r['time'], r['title'], r['position'], r['media']) for r in values}) > 1:
                for value in values:
                    issues.append((value['source_sha'], 'conflicting_start_id', {'event_id_hash': digest(event_id)}))
        sessions = group_sessions(list(segments.values()), pause_gap_ms, stream_threshold_ms)
        catalog, hourly, categories = {}, collections.Counter(), collections.defaultdict(lambda: {'segments': 0, 'milliseconds': 0})
        with database:
            for session in sessions:
                for segment in session['segments']:
                    catalog[segment['catalog']['key']] = segment['catalog']
                    database.execute('insert into segments values(?,?,?,?,?)', (run_key, segment['key'], segment['source_sha'], session['key'], json.dumps(segment, ensure_ascii=False)))
                    category = categories[segment['item_type']]
                    category['segments'] += 1; category['milliseconds'] += segment['milliseconds']
                    for day, hour, milliseconds in hour_buckets(segment, timezone):
                        hourly[(day, hour, segment['item_type'])] += milliseconds
                record = {k: v for k, v in session.items() if k != 'segments'}
                record['segment_keys'] = [s['key'] for s in session['segments']]
                record['start'], record['end'] = iso(record['start']), iso(record['end'])
                record['duration_kind'] = 'export_reported'
                record['session_kind'] = 'inferred_attempt' if session['qualified'] is not None else 'unclassified_time'
                database.execute('insert into sessions values(?,?,?)', (run_key, session['key'], json.dumps(record, ensure_ascii=False)))
            database.executemany('insert into catalog values(?,?,?)', [(run_key, key, json.dumps(value, ensure_ascii=False)) for key, value in catalog.items()])
            database.executemany('insert into hourly values(?,?,?,?,?)', [(run_key, *key, value) for key, value in sorted(hourly.items())])
            database.executemany('insert into issues values(?,?,?,?)', [(run_key, sha, kind, json.dumps(detail)) for sha, kind, detail in issues])
            database.executemany('insert into source_links values(?,?,?)', [(run_key, sha, key) for sha, key in links.items()])
            total = sum(s['milliseconds'] for s in segments.values())
            assert total == sum(s['milliseconds'] for s in sessions) == sum(hourly.values())
            audit = {'run_key': run_key, 'config': config, 'status': 'local_candidates_not_published',
                     'source_start': iso(min(s['start'] for s in segments.values())) if segments else None,
                     'source_end': iso(max(s['end'] for s in segments.values())) if segments else None,
                     'library_rows': len(library), 'identifier_rows': len(identifiers),
                     'end_segments': len(segments), 'reported_milliseconds': total, 'unallocated_reported_milliseconds': unallocated_ms, 'excluded_event_types': {k: v for k, v in staged['event_types'].items() if k not in ['PLAY_START', 'PLAY_END']}, 'time_by_item_type': dict(categories),
                     'candidate_attempts': sum(s['qualified'] is not None for s in sessions), 'time_only_records': sum(s['qualified'] is None for s in sessions), 'qualified_candidates': sum(s['qualified'] is True for s in sessions),
                     'continued_segments': sum(len(s['joins']) for s in sessions),
                     'catalog_matched_segments': sum(s['catalog']['match'] == 'unique_title_album_duration' for s in segments.values()),
                     'catalog_unmatched_segments': sum(s['catalog']['match'] != 'unique_title_album_duration' for s in segments.values()),
                     'start_evidence': dict(matched), 'start_id_conflicts': sum(len({(r['time'], r['title'], r['position'], r['media']) for r in values}) > 1 for values in start_ids.values()),
                     'non_wall_equal_segments': sum(not s['wall_matches_duration'] for s in segments.values()),
                     'intervals': interval_audit(list(segments.values())),
                     'active_eastern_dates': len({key[0] for key in hourly}), 'issues': dict(collections.Counter(kind for _, kind, _ in issues)),
                     'pause_gap_sensitivity': [{'pause_gap_ms': gap, 'candidate_attempts': sum(s['qualified'] is not None for s in group_sessions(list(segments.values()), gap, stream_threshold_ms))} for gap in sorted({0, 300000, pause_gap_ms})],
                     'daily_report': {'rows': len(daily_rows), 'start': min((r['Date Played'] for r in daily_rows), default=None), 'end': max((r['Date Played'] for r in daily_rows), default=None),
                                      'milliseconds': sum(integer(r.get('Play Duration Milliseconds')) or 0 for r in daily_rows), 'plays': sum(integer(r.get('Play Count')) or 0 for r in daily_rows), 'skips': sum(integer(r.get('Skip Count')) or 0 for r in daily_rows)},
                     'warnings': ['Candidate grouping is policy-based; start events have independent clocks/IDs.', 'Overlapping intervals are retained for review; reported duration is not unique wall-clock time.', 'Daily summaries overlap detailed events and were not added.', 'Uncatalogued and invalid item types retain time separately, not invented track plays.', 'Spotify cross-service/export reconciliation has not run.']}
            database.execute('insert into normalization_runs values(?,?,?)', (run_key, json.dumps(config), json.dumps(audit)))
        write_audit(output, audit)
        return audit
    finally:
        database.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive')
    parser.add_argument('--output', default=str(Path(__file__).resolve().parents[2] / 'private-data/music/apple'))
    parser.add_argument('--pause-gap-ms', type=int, default=1800000)
    parser.add_argument('--stream-threshold-ms', type=int, default=30000)
    args = parser.parse_args()
    result = normalize(args.archive, args.output, args.pause_gap_ms, args.stream_threshold_ms)
    print(json.dumps({k: result.get(k) for k in ['already_normalized', 'status', 'source_start', 'source_end', 'end_segments', 'candidate_attempts', 'qualified_candidates', 'continued_segments', 'reported_milliseconds', 'catalog_matched_segments', 'catalog_unmatched_segments', 'active_eastern_dates', 'issues']}))
