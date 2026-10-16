"""Preserve and normalize supplied Spotify extended-history ZIPs, without API calls."""
import argparse
import collections
from contextlib import closing
import datetime as dt
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sqlite3
import zipfile
from zoneinfo import ZoneInfo

from normalize_apple import digest, norm, timestamp

VERSION = 'spotify-extended-1'
TIMEZONE = ZoneInfo('America/New_York')


def identity(artist, album):
    artist_id = 'catalog:artist:' + digest(norm(artist)) if artist else None
    album_id = 'catalog:album:' + digest([norm(artist), norm(album)]) if album else None
    return artist_id, album_id


def normalize_record(row):
    if not {'ts', 'ms_played', 'spotify_track_uri', 'master_metadata_track_name'}.issubset(row):
        raise ValueError('Unrecognized Spotify extended-history schema')
    milliseconds = row['ms_played']
    if isinstance(milliseconds, bool) or not isinstance(milliseconds, int) or not 0 <= milliseconds <= 86400000:
        raise ValueError('Invalid reported duration')
    ended = timestamp(row['ts'])
    if row.get('spotify_episode_uri') or row.get('audiobook_uri') or not (row.get('master_metadata_track_name') or row.get('spotify_track_uri')):
        return None
    uri = row['spotify_track_uri']
    if uri and not re.fullmatch(r'spotify:track:[A-Za-z0-9]{22}', uri):
        raise ValueError('Invalid track URI')
    artist = row.get('master_metadata_album_artist_name') or ''
    album = row.get('master_metadata_album_album_name') or ''
    title = row.get('master_metadata_track_name') or 'Unknown track'
    if any(not isinstance(value, str) or len(value) > 2000 for value in [artist, album, title]):
        raise ValueError('Invalid catalog text')
    artist_id, album_id = identity(artist, album)
    local = dt.datetime.fromtimestamp(ended / 1000, dt.timezone.utc).astimezone(TIMEZONE)
    fingerprint = digest([row.get(k) for k in ['ts', 'ms_played', 'spotify_track_uri', 'master_metadata_track_name',
                         'master_metadata_album_artist_name', 'master_metadata_album_album_name', 'platform',
                         'reason_start', 'reason_end', 'shuffle', 'skipped', 'offline', 'offline_timestamp']])
    return {'fingerprint': fingerprint, 'at': ended, 'day': local.date().isoformat(), 'hour': local.hour,
            'weekday': local.weekday(), 'milliseconds': milliseconds, 'stream_count': int(milliseconds >= 30000),
            'track_id': uri or 'spotify:unmatched:' + digest([title, artist, album]), 'name': title,
            'artists_json': json.dumps([{'id': artist_id, 'name': artist}] if artist else [], ensure_ascii=False),
            'album_id': album_id, 'album': album or None, 'url': 'https://open.spotify.com/track/' + uri.split(':')[-1] if uri else None}


def import_history(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if source.stat().st_size > 100 * 1024 * 1024:
        raise ValueError('Compressed archive exceeds 100MB')
    with source.open('rb') as stream:
        archive_sha = hashlib.file_digest(stream, 'sha256').hexdigest()
    output.mkdir(parents=True, exist_ok=True)
    original = output / f'{archive_sha}.zip'
    if not original.exists():
        shutil.copyfile(source, original)
    with original.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != archive_sha:
            raise ValueError('Preserved archive checksum mismatch')
    with closing(sqlite3.connect(output / 'spotify-history.sqlite3')) as db:
        db.executescript('''
          create table if not exists imports(archive_sha text primary key, version text, audit_json text);
          create table if not exists source_records(archive_sha text, filename text, row_number integer, record_sha text, payload_json text,
            primary key(archive_sha,filename,row_number));
          create table if not exists events(event_key text primary key, fingerprint text, occurrence integer, at integer,
            day text, hour integer, weekday integer, milliseconds integer, stream_count integer,
            track_id text, name text, artists_json text, album_id text, album text, url text);
          create index if not exists events_day on events(day);
          create index if not exists events_track_time on events(track_id,at);
          create table if not exists source_links(archive_sha text, filename text, row_number integer, event_key text,
            primary key(archive_sha,filename,row_number));
          create table if not exists issues(archive_sha text, filename text, row_number integer, kind text, reported_ms integer);
        ''')
        existing = db.execute('select audit_json from imports where archive_sha=?', (archive_sha,)).fetchone()
        if existing:
            audit = json.loads(existing[0])
        else:
            counts = collections.Counter()
            with zipfile.ZipFile(original) as archive, db:
                entries = archive.infolist()
                if len(entries) > 500 or sum(e.file_size for e in entries) > 512 * 1024 * 1024:
                    raise ValueError('Archive exceeds expanded limits')
                names = set()
                for entry in entries:
                    path = PurePosixPath(entry.filename)
                    if path.is_absolute() or '..' in path.parts or ':' in entry.filename or '\\' in entry.filename or entry.filename in names:
                        raise ValueError('Unsafe or duplicate archive path')
                    names.add(entry.filename)
                    if entry.flag_bits & 1 or entry.file_size > 128 * 1024 * 1024 or entry.file_size / max(1, entry.compress_size) > 200:
                        raise ValueError('Unsafe archive size/encryption')
                files = [e for e in entries if re.search(r'(^|/)Streaming_History_(Audio|Video)_.*\.json$', e.filename)]
                if not files:
                    raise ValueError('Extended Streaming History JSON files were not found')
                for entry in sorted(files, key=lambda e: e.filename):
                    rows = json.loads(archive.read(entry).decode('utf-8-sig'))
                    if not isinstance(rows, list):
                        raise ValueError('Expected a JSON array')
                    occurrences = collections.Counter()
                    for index, row in enumerate(rows, 1):
                        counts['source_rows'] += 1
                        if counts['source_rows'] > 1000000 or not isinstance(row, dict):
                            raise ValueError('Source row limit or malformed record')
                        raw = json.dumps(row, ensure_ascii=False, sort_keys=True)
                        db.execute('insert into source_records values(?,?,?,?,?)', (archive_sha, entry.filename, index, digest(row), raw))
                        try:
                            record = normalize_record(row)
                        except (ValueError, KeyError, TypeError, OverflowError):
                            reported = row.get('ms_played')
                            db.execute('insert into issues values(?,?,?,?,?)', (archive_sha, entry.filename, index, 'invalid_record', reported if isinstance(reported, int) and not isinstance(reported, bool) and 0 <= reported <= 86400000 else None))
                            counts['invalid_records'] += 1
                            continue
                        if record is None:
                            counts['non_music_rows'] += 1
                            continue
                        counts['music_rows'] += 1
                        counts['source_music_milliseconds'] += record['milliseconds']
                        occurrences[record['fingerprint']] += 1
                        occurrence = occurrences[record['fingerprint']]
                        if occurrence > 1:
                            counts['identical_rows_retained'] += 1
                        event_key = f"spotify-export:{record['fingerprint']}:{occurrence}"
                        before = db.total_changes
                        db.execute('insert or ignore into events values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                   (event_key, record['fingerprint'], occurrence, *[record[k] for k in ['at', 'day', 'hour', 'weekday', 'milliseconds', 'stream_count', 'track_id', 'name', 'artists_json', 'album_id', 'album', 'url']]))
                        counts['events_inserted'] += db.total_changes - before
                        db.execute('insert into source_links values(?,?,?,?)', (archive_sha, entry.filename, index, event_key))
                if not counts['music_rows']:
                    raise ValueError('No valid music records found; inspect this schema separately')
                totals = db.execute('select count(*),sum(milliseconds),sum(stream_count),min(day),max(day),min(at),max(at),count(distinct track_id) from events').fetchone()
                audit = {'version': VERSION, 'archive_sha': archive_sha, 'files': len(files), **dict(counts),
                         'events': totals[0], 'milliseconds': totals[1], 'qualified_streams': totals[2], 'first_day': totals[3], 'last_day': totals[4],
                         'first_at': totals[5], 'last_at': totals[6], 'unique_tracks': totals[7], 'timezone': str(TIMEZONE), 'stream_threshold_ms': 30000,
                         'time_allocation': 'source_stream_end_timestamp',
                         'repeated_rows_policy': 'Keep same-file occurrences; merge only matching occurrence identities across overlapping files/imports.',
                         'metadata_api_requests': 0}
                db.execute('insert into imports values(?,?,?)', (archive_sha, VERSION, json.dumps(audit)))
        # Materialize the small catalog once, rather than grouping 200k source
        # events during every dashboard refresh.
        if not existing or not db.execute("select 1 from sqlite_master where name='track_catalog'").fetchone():
            with db:
                db.executescript('drop table if exists track_catalog; create table track_catalog as select track_id,name,artists_json,album_id,album,url,max(at) at from events group by track_id; create unique index track_catalog_id on track_catalog(track_id);')
        (output / 'spotify-import-audit.json').write_text(json.dumps(audit, indent=2) + '\n', encoding='utf-8')
        report = f"# Spotify extended-history import\n\nCoverage of recorded music: {audit['first_day']} through {audit['last_day']} (Eastern).\n\n{audit['events']:,} music records; {audit['qualified_streams']:,} meet the 30-second threshold.\n\nReported listening time: {audit['milliseconds'] / 3600000:,.2f} hours.\n\nOriginal ZIP and all source rows are preserved. Podcasts/audiobooks remain in the raw archive but outside song statistics. Same-file identical occurrences are retained and flagged, because the export provides no unique play ID; repeated imports cannot add them twice. Time is assigned to the documented stream-end timestamp, without inventing a precise playback interval.\n\nArchive SHA256: `{archive_sha}`\n"
        (output / 'spotify-import-report.md').write_text(report, encoding='utf-8')
        return audit


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive')
    parser.add_argument('--output', default=str(Path(__file__).resolve().parents[2] / 'private-data/music/spotify'))
    args = parser.parse_args()
    print(json.dumps(import_history(args.archive, args.output)))
