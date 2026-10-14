"""Bounded, local Apple export staging. Source events are not qualified streams."""

import argparse
import collections
import csv
import hashlib
import io
import json
import re
from pathlib import Path, PurePosixPath
import shutil
import sqlite3
import zipfile

PARSER_VERSION = "apple-observed-1"
PREFIX = "Apple_Media_Services/Apple Music Activity/"
ACTIVITY = PREFIX + "Apple Music Play Activity.csv"
DAILY = PREFIX + "Apple Music - Play History Daily Tracks.csv"
MAX_ARCHIVE = 100 * 1024 * 1024
MAX_ENTRY = 128 * 1024 * 1024
MAX_TOTAL = 512 * 1024 * 1024
MAX_ROWS = 500_000


def validate_archive(archive):
    entries = archive.infolist()
    if len(entries) > 500 or sum(e.file_size for e in entries) > MAX_TOTAL:
        raise ValueError("Archive exceeds entry-count or expanded-size limit")
    names = set()
    for entry in entries:
        path = PurePosixPath(entry.filename)
        if path.is_absolute() or ".." in path.parts or "\\" in entry.filename or re.match(r"^[A-Za-z]:", entry.filename):
            raise ValueError("Unsafe archive path")
        if entry.filename in names:
            raise ValueError("Duplicate archive path")
        names.add(entry.filename)
        if entry.flag_bits & 1 or entry.file_size > MAX_ENTRY:
            raise ValueError("Encrypted or oversized archive entry")
        if entry.file_size / max(1, entry.compress_size) > 200:
            raise ValueError("Archive compression ratio exceeds limit")
    if ACTIVITY not in names:
        raise ValueError("Observed Apple Play Activity file is missing; inspect this schema separately")


def rows_from_csv(archive, name):
    with archive.open(name) as stream:
        reader = csv.DictReader(io.TextIOWrapper(stream, encoding="utf-8-sig", newline=""))
        for index, row in enumerate(reader, 1):
            if index > MAX_ROWS or None in row or any(v is None for v in row.values()):
                raise ValueError("CSV row limit or malformed record")
            yield index, row


def milliseconds(value):
    if value == "":
        return None
    number = int(value)
    if number < 0:
        raise ValueError("Negative reported listening duration")
    return number


def stage_archive(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if source.stat().st_size > MAX_ARCHIVE:
        raise ValueError("Compressed archive exceeds limit")
    with source.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    output.mkdir(parents=True, exist_ok=True)
    original = output / f"{digest}.zip"
    if not original.exists():
        shutil.copyfile(source, original)
    with original.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != digest:
            raise ValueError("Private original checksum mismatch")
    database = sqlite3.connect(output / "apple-staging.sqlite3")
    database.executescript("""
      create table if not exists imports (
        sha256 text primary key, parser_version text not null, report_json text not null);
      create table if not exists source_records (
        archive_sha text not null, filename text not null, row_number integer not null,
        record_sha text not null, payload_json text not null,
        primary key (archive_sha,filename,row_number));
      create table if not exists listening_segments (
        archive_sha text not null, record_sha text not null, event_id text,
        source_start text, source_end text, song_name text, album_name text,
        reported_ms integer, duration_kind text not null, stream_count integer,
        primary key (archive_sha,record_sha));
    """)
    existing = database.execute("select report_json from imports where sha256=?", (digest,)).fetchone()
    if existing:
        database.close()
        return {**json.loads(existing[0]), "already_staged": True}
    try:
        with zipfile.ZipFile(original) as archive, database:
            validate_archive(archive)
            report = {"archive_sha256": digest, "parser_version": PARSER_VERSION,
                      "compressed_bytes": source.stat().st_size, "files": [],
                      "event_types": {}, "qualified_stream_count": None,
                      "coverage_complete": None, "warnings": [
                          "PLAY_END records can be partial listening segments, not distinct streams.",
                          "Daily and summary reports overlap detailed events; totals are not additive.",
                          "Raw fields and timestamps are retained; no timezone or matching assumptions applied."]}
            event_types, seen_ids = collections.Counter(), collections.defaultdict(set)
            stamps, duration_errors = [], 0
            for name in [ACTIVITY, DAILY]:
                if name not in archive.namelist():
                    continue
                count, fields = 0, []
                for index, row in rows_from_csv(archive, name):
                    fields = list(row)
                    if name == ACTIVITY and not {"Event ID", "Event Type", "Play Duration Milliseconds", "Event Start Timestamp", "Event End Timestamp", "Song Name"}.issubset(row):
                        raise ValueError("Apple activity schema changed; inspect before parsing")
                    payload = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
                    record_sha = hashlib.sha256(payload.encode()).hexdigest()
                    database.execute("insert into source_records values (?,?,?,?,?)", (digest, name, index, record_sha, payload))
                    count += 1
                    if name != ACTIVITY:
                        continue
                    event_types[row["Event Type"]] += 1
                    if row["Event ID"]:
                        seen_ids[row["Event ID"]].add(record_sha)
                    if row["Event Start Timestamp"]:
                        stamps.append(row["Event Start Timestamp"])
                    if row["Event Type"] != "PLAY_END":
                        continue
                    try:
                        duration = milliseconds(row["Play Duration Milliseconds"])
                    except (ValueError, OverflowError):
                        duration, duration_errors = None, duration_errors + 1
                    database.execute("insert or ignore into listening_segments values (?,?,?,?,?,?,?,?,?,?)", (
                        digest, record_sha, row["Event ID"], row["Event Start Timestamp"],
                        row["Event End Timestamp"], row.get("Song Name"), row.get("Album Name"),
                        duration, "export_reported" if duration is not None else "unknown", None))
                report["files"].append({"name": name, "row_count": count, "fields": fields})
            report["event_types"] = dict(event_types)
            report["source_start_range"] = [min(stamps), max(stamps)] if stamps else None
            report["event_id_conflicts"] = sum(len(hashes) > 1 for hashes in seen_ids.values())
            report["invalid_durations"] = duration_errors
            count, total = database.execute("select count(*),sum(reported_ms) from listening_segments where archive_sha=?", (digest,)).fetchone()
            report["unique_end_segments"] = count
            report["reported_segment_milliseconds"] = total or 0
            report["exact_duplicate_end_rows"] = event_types["PLAY_END"] - count
            database.execute("insert into imports values (?,?,?)", (digest, PARSER_VERSION, json.dumps(report)))
        (output / "apple-audit.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return report
    finally:
        database.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive")
    parser.add_argument("--output", default=str(Path(__file__).resolve().parents[2] / "private-data/music/apple"))
    arguments = parser.parse_args()
    result = stage_archive(arguments.archive, arguments.output)
    print(json.dumps({key: result.get(key) for key in ["already_staged", "source_start_range", "event_types", "unique_end_segments", "exact_duplicate_end_rows", "event_id_conflicts", "invalid_durations", "qualified_stream_count"]}))
