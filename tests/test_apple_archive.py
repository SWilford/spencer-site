import csv
from contextlib import closing
import importlib.util
import io
from pathlib import Path
import sqlite3
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location("apple_archive", Path(__file__).resolve().parents[1] / "scripts/music/apple_archive.py")
apple = importlib.util.module_from_spec(spec)
spec.loader.exec_module(apple)


class AppleArchiveTests(unittest.TestCase):
    def test_duration_provenance_duplicates_and_no_invented_streams(self):
        fields = ["Event ID", "Event Type", "Play Duration Milliseconds", "Event Start Timestamp", "Event End Timestamp", "Song Name"]
        end = ["event-1", "PLAY_END", "7970", "2026-03-08T06:59:55Z", "2026-03-08T07:00:03Z", "Example"]
        text = io.StringIO()
        writer = csv.writer(text)
        writer.writerow(fields)
        writer.writerows([end, end, ["event-2", "LYRIC_DISPLAY", "2000", "2026-03-08T07:00:00Z", "", "Example"], ["event-3", "PLAY_START", "", "2026-03-08T07:01:00Z", "", "Example"], ["event-1", "PLAY_END", "100", "2026-03-08T07:02:00Z", "", "Example"]])
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "input.zip"
            with zipfile.ZipFile(source, "w") as archive:
                archive.writestr(apple.ACTIVITY, text.getvalue())
            output = Path(directory) / "private"
            report = apple.stage_archive(source, output)
            self.assertEqual(report["reported_segment_milliseconds"], 8070)
            self.assertEqual(report["exact_duplicate_end_rows"], 1)
            self.assertEqual(report["event_id_conflicts"], 1)
            self.assertIsNone(report["qualified_stream_count"])
            with closing(sqlite3.connect(output / "apple-staging.sqlite3")) as db:
                self.assertEqual(db.execute("select count(*) from source_records").fetchone()[0], 5)
                self.assertEqual(db.execute("select source_start from listening_segments order by source_start limit 1").fetchone()[0], end[3])
            self.assertTrue(apple.stage_archive(source, output)["already_staged"])

    def test_unsafe_archive_paths_rejected(self):
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w") as archive:
            archive.writestr("../escape.csv", "example")
        stream.seek(0)
        with zipfile.ZipFile(stream) as archive:
            with self.assertRaises(ValueError):
                apple.validate_archive(archive)


if __name__ == "__main__":
    unittest.main()
