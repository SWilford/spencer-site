"""Build a private, offline dashboard input from the reviewed Apple import run.

Apple is a one-time supplied-file import. No Apple API or credentials are used.
Time-only aggregate/invalid items stay in the audit, outside song rankings.
"""
import argparse
from collections import defaultdict
from contextlib import closing
import json
from pathlib import Path
import sqlite3

from normalize_apple import digest, iso, norm


def export_dashboard(directory):
    directory = Path(directory)
    audit = json.loads((directory / 'apple-normalization-audit.json').read_text(encoding='utf-8'))
    run = audit['run_key']
    plays = []
    with closing(sqlite3.connect(directory / 'apple-normalized.sqlite3')) as db:
        stored = db.execute('select audit_json from normalization_runs where run_key=?', (run,)).fetchone()
        if not stored or json.loads(stored[0]) != audit:
            raise ValueError('Audit does not match a saved normalization run')
        for (payload,) in db.execute('select payload_json from sessions where run_key=? order by session_key', (run,)):
            session = json.loads(payload)
            if session['session_kind'] != 'inferred_attempt':
                continue
            catalog = session['catalog']
            buckets = defaultdict(int)
            first = None
            for key in session['segment_keys']:
                row = db.execute('select payload_json from segments where run_key=? and segment_key=?', (run, key)).fetchone()
                if not row:
                    raise ValueError('Missing source segment')
                segment = json.loads(row[0])
                cursor, end = segment['start'], segment['end']
                first = cursor if first is None else min(first, cursor)
                assigned = 0
                if cursor == end:
                    buckets[cursor // 3600000 * 3600000] += segment['milliseconds']
                while cursor < end:
                    boundary = min(end, (cursor // 3600000 + 1) * 3600000)
                    cumulative = segment['milliseconds'] if boundary == end else round(segment['milliseconds'] * (boundary - segment['start']) / (end - segment['start']))
                    buckets[cursor // 3600000 * 3600000] += cumulative - assigned
                    assigned, cursor = cumulative, boundary
            if first is None or sum(buckets.values()) != session['milliseconds']:
                raise ValueError('Attempt duration does not reconcile')
            if not session['milliseconds'] and not session['qualified']:
                continue
            artist = catalog.get('artist')
            artist_id = 'apple:artist:' + digest(norm(artist)) if artist else None
            album_id = 'apple:album:' + digest([norm(artist), norm(catalog.get('album'))]) if catalog.get('album') else None
            for hour, milliseconds in sorted(buckets.items()):
                is_first = hour == first // 3600000 * 3600000
                plays.append({'id': f"apple:{session['key']}:{hour}", 'at': iso(first if is_first else hour),
                              'provider': 'apple', 'songLengthMs': catalog.get('media_ms'), 'actualMs': milliseconds,
                              'streamCount': int(bool(session['qualified']) and is_first),
                              'trackId': catalog['key'], 'name': catalog['title'],
                              'url': f"https://music.apple.com/song/{catalog['apple_id']}" if catalog.get('apple_id') else None,
                              'artists': [{'id': artist_id, 'name': artist}] if artist else [],
                              'albumId': album_id, 'album': catalog.get('album'), 'artwork': None})
    expected = audit['time_by_item_type'].get('ITUNES_STORE_CONTENT', {}).get('milliseconds', 0)
    if sum(p['actualMs'] for p in plays) != expected or sum(p['streamCount'] for p in plays) != audit['qualified_candidates']:
        raise ValueError('Dashboard input does not reconcile with import totals')
    result = {'schemaVersion': 1, 'runKey': run, 'source': 'one-time-apple-file-import',
              'policy': audit['config'], 'plays': plays}
    (directory / 'apple-dashboard.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    return {'fragments': len(plays), 'streams': sum(p['streamCount'] for p in plays),
            'milliseconds': sum(p['actualMs'] for p in plays), 'run_key': run}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', default=str(Path(__file__).resolve().parents[2] / 'private-data/music/apple'))
    print(json.dumps(export_dashboard(parser.parse_args().directory)))
