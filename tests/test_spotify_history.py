from contextlib import closing
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts/music'))
from import_spotify_history import import_history


def play(ts='2026-03-08T06:59:59Z', ms=30000):
    return {'ts': ts, 'ms_played': ms, 'spotify_track_uri': 'spotify:track:' + 'a' * 22,
            'master_metadata_track_name': 'Example', 'master_metadata_album_artist_name': 'Example band',
            'master_metadata_album_album_name': 'Example album', 'platform': 'test', 'offline': False}


class SpotifyHistoryTests(unittest.TestCase):
    def test_import_conserves_duration_provenance_repeats_and_timezone(self):
        with tempfile.TemporaryDirectory() as folder:
            archive = Path(folder) / 'source.zip'; output = Path(folder) / 'private'
            a, b = play(), play('2026-03-08T07:00:00Z', 10000)
            podcast = {**play(), 'spotify_episode_uri': 'spotify:episode:' + 'e' * 22}
            bad = {**play(), 'ts': 'invalid'}
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('history/Streaming_History_Audio_2026.json', json.dumps([a, a, b, podcast, bad]))
                z.writestr('history/Streaming_History_Audio_2026_1.json', json.dumps([a, b]))
                z.writestr('history/README.txt', 'Untrusted content is never executed')
            audit = import_history(archive, output)
            self.assertEqual(audit['events'], 3)
            self.assertEqual(audit['milliseconds'], 70000)
            self.assertEqual(audit['qualified_streams'], 2)
            self.assertEqual(audit['identical_rows_retained'], 1)
            self.assertEqual(audit['invalid_records'], 1)
            self.assertEqual(audit['non_music_rows'], 1)
            with closing(sqlite3.connect(output / 'spotify-history.sqlite3')) as db:
                self.assertEqual(db.execute('select count(*) from source_records').fetchone()[0], 7)
                self.assertEqual(db.execute('select count(*) from events where hour=2').fetchone()[0], 0)
                self.assertEqual(db.execute('select count(*) from source_links').fetchone()[0], 5)
            self.assertEqual(import_history(archive, output), audit)
            self.assertTrue((output / f"{audit['archive_sha']}.zip").exists())

    def test_unsafe_zip_and_wrong_schema_fail_without_partial_events(self):
        with tempfile.TemporaryDirectory() as folder:
            for name, rows in [('../Streaming_History_Audio_2026.json', [play()]), ('Streaming_History_Audio_2026.json', [{'endTime': 'wrong schema'}])]:
                archive = Path(folder) / 'bad.zip'
                with zipfile.ZipFile(archive, 'w') as z: z.writestr(name, json.dumps(rows))
                with self.assertRaises(ValueError): import_history(archive, Path(folder) / 'private')


if __name__ == '__main__': unittest.main()
