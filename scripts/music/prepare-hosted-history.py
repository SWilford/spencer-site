"""Build a compact private read replica, preserving originals and all listening facts."""
from pathlib import Path
import gzip, hashlib, json, shutil, sqlite3
base = Path(__file__).resolve().parents[2] / "private-data/music"
dest = base / "hosted"
dest.mkdir(exist_ok=True)
temporary = dest / "history-next.sqlite3"
if temporary.exists():
    raise RuntimeError("A previous build is incomplete; inspect history-next.sqlite3 first")
target = sqlite3.connect(temporary, uri=True)
target.execute("attach database ? as source", ((base / "spotify/spotify-history.sqlite3").resolve().as_uri() + "?mode=ro",))
target.executescript("""
create table track_catalog as select rowid catalog_id,* from source.track_catalog;
create unique index catalog_id on track_catalog(catalog_id);
create unique index track_id on track_catalog(track_id);
create table event_facts as select e.rowid event_key,e.at,e.day,e.hour,e.weekday,e.milliseconds,e.stream_count,t.rowid catalog_id
 from source.events e join source.track_catalog t on t.track_id=e.track_id;
create index fact_day on event_facts(day);
create index fact_track_time on event_facts(catalog_id,at);
create view events as select e.event_key,e.at,e.day,e.hour,e.weekday,e.milliseconds,e.stream_count,
 t.track_id,t.name,t.artists_json,t.album_id,t.album,t.url from event_facts e join track_catalog t using(catalog_id);
""")
checks = "select count(*),sum(milliseconds),sum(stream_count),min(at),max(at) from {}"
expected = target.execute(checks.format("source.events")).fetchone()
actual = target.execute(checks.format("events")).fetchone()
if actual != expected:
    raise RuntimeError("Read replica conservation failed")
target.commit()
target.close()
output = dest / "history.sqlite3"
temporary.replace(output)
files = {"history.sqlite3": output, "apple.json": base / "apple/apple-dashboard.json", "apple-enrichment.json": base / "apple/spotify-enrichment.json", "catalog.json": base / "spotify/catalog-display.json"}
manifest = {}
for name, original in files.items():
    archive = dest / (name + ".gz")
    with original.open("rb") as src, gzip.open(archive, "wb", compresslevel=6) as out:
        shutil.copyfileobj(src, out)
    manifest[name] = {"sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "bytes": archive.stat().st_size}
(dest / "manifest.json").write_text(json.dumps(manifest))
print(json.dumps({"verified": True, "records": actual[0], "milliseconds": actual[1], "streams": actual[2], "compressedBytes": sum(x["bytes"] for x in manifest.values())}))
