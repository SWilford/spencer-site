from contextlib import closing
import csv
import datetime as dt
import io
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
import zipfile
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts/music'))
import apple_archive as apple
import normalize_apple as normal


def end(event, start, milliseconds, position=0, reason='NATURAL_END_OF_TRACK', title='Example', item='ITUNES_STORE_CONTENT'):
    stamp=dt.datetime.fromisoformat(start.replace('Z','+00:00'))
    return {'Event ID':event,'Event Type':'PLAY_END','Event Start Timestamp':start,
            'Event End Timestamp':(stamp+dt.timedelta(milliseconds=milliseconds)).isoformat().replace('+00:00','Z'),
            'Song Name':title,'Album Name':'Example album','Play Duration Milliseconds':str(milliseconds),
            'Media Duration In Milliseconds':'180000','Start Position In Milliseconds':str(position),
            'End Position In Milliseconds':str(position+milliseconds),'End Reason Type':reason,
            'Item Type':item,'Source Type':'ORIGINATING_DEVICE','Device App Name':'Music','Client Device Name':'Synthetic device'}


def csv_text(rows):
    fields=list(dict.fromkeys(k for row in rows for k in row))
    stream=io.StringIO();writer=csv.DictWriter(stream,fieldnames=fields)
    writer.writeheader();writer.writerows(rows)
    return stream.getvalue()


def json_zip(filename,data):
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w') as z:z.writestr(filename,json.dumps(data))
    return stream.getvalue()


class AppleNormalizationTests(unittest.TestCase):
    def test_reconstruction_preserves_duration_and_excludes_overlapping_reports(self):
        first=end('a','2026-03-08T06:59:30Z',20000,reason='PLAYBACK_MANUALLY_PAUSED')
        second=end('b','2026-03-08T07:00:00Z',20000,position=20000,reason='TRACK_SKIPPED_FORWARDS')
        rows=[first,second,second,end('c','2026-03-08T07:00:30Z',180000),end('d','2026-03-08T07:03:30Z',180000),
              end('e','2026-03-08T07:07:00Z',10000,title='Unmatched example'),
              end('f','2026-03-08T07:07:30Z',1500,title='',item='AGGREGATE_NON_CATALOG_PLAY_TIME')]
        lyric={**first,'Event ID':'lyrics','Event Type':'LYRIC_DISPLAY','Play Duration Milliseconds':'900000'}
        rows.append(lyric)
        rows.extend([{**first,'Event Type':'PLAY_START','Event ID':'conflict','Play Duration Milliseconds':'','Event End Timestamp':''}, {**first,'Event Type':'PLAY_START','Event ID':'conflict','Event Start Timestamp':'2026-03-08T08:00:00Z','Play Duration Milliseconds':'','Event End Timestamp':''}])
        rows.append({**end('bad','2026-03-08T08:00:00Z',7000),'Event Start Timestamp':'invalid'})
        library=[{'Track Identifier':1,'Title':'Example','Artist':'Example artist','Album':'Example album','Track Duration':180000,'Apple Music Track Identifier':123}]
        daily=[{'Date Played':'20260308','Track Identifier':'123','Track Description':'Example artist - Example','Play Duration Milliseconds':'900000','Play Count':'9','Skip Count':'8'}]
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/'fixture.zip';output=Path(folder)/'private'
            with zipfile.ZipFile(source,'w') as z:
                z.writestr(apple.ACTIVITY,csv_text(rows));z.writestr(apple.DAILY,csv_text(daily))
                z.writestr(apple.PREFIX+'Apple Music Library Tracks.json.zip',json_zip('tracks.json',library))
                z.writestr(apple.PREFIX+'Identifier Information.json.zip',json_zip('identifiers.json',[]))
            audit=normal.normalize(source,output)
            self.assertEqual(audit['end_segments'],6)
            self.assertEqual(audit['unallocated_reported_milliseconds'],7000)
            self.assertEqual(audit['start_id_conflicts'],1)
            self.assertEqual(audit['issues']['invalid_end_segment'],1)
            self.assertEqual(audit['reported_milliseconds'],411500)
            self.assertEqual(audit['candidate_attempts'],4)
            self.assertEqual(audit['qualified_candidates'],3)
            self.assertEqual(audit['time_only_records'],1)
            self.assertEqual(audit['continued_segments'],1)
            self.assertEqual(audit['catalog_matched_segments'],4)
            self.assertEqual(audit['catalog_unmatched_segments'],2)
            self.assertEqual(audit['daily_report']['milliseconds'],900000)
            self.assertEqual(audit['excluded_event_types']['LYRIC_DISPLAY'],1)
            with closing(sqlite3.connect(output/'apple-normalized.sqlite3')) as db:
                self.assertEqual(db.execute('select sum(milliseconds) from hourly').fetchone()[0],411500)
                self.assertEqual(db.execute('select count(*) from hourly where hour=2').fetchone()[0],0)
                before=db.execute('select count(*) from segments').fetchone()[0]
            self.assertTrue(normal.normalize(source,output)['already_normalized'])
            with closing(sqlite3.connect(output/'apple-normalized.sqlite3')) as db:self.assertEqual(db.execute('select count(*) from segments').fetchone()[0],before)

    def test_repeats_stay_distinct_and_seek_continuations_do_not_add_pause_time(self):
        raw=[end('a','2026-01-01T00:00:00Z',10000,reason='SCRUB_BEGIN'),
             end('b','2026-01-01T00:00:11Z',20000,position=90000),
             end('c','2026-01-01T00:00:31Z',30000)]
        segments=[normal.segment_from_row(r,str(i)) for i,r in enumerate(raw)]
        for segment in segments:segment['catalog']={'key':'example'}
        sessions=normal.group_sessions(segments,1800000,30000)
        self.assertEqual(len(sessions),2)
        self.assertEqual(sessions[0]['milliseconds'],30000)
        self.assertEqual(sessions[0]['joins'],['adjacent_seek'])
        self.assertEqual(sessions[1]['milliseconds'],30000)

    def test_catalog_keeps_versions_and_ambiguous_identities_separate(self):
        tracks=[{'Track Identifier':1,'Apple Music Track Identifier':10,'Title':'Example','Artist':'Artist','Album':'Album','Track Duration':180000},
                {'Track Identifier':2,'Apple Music Track Identifier':11,'Title':'Example (Live)','Artist':'Artist','Album':'Album','Track Duration':180000}]
        index=normal.catalog_index(tracks)
        base={'title':'Example','album':'Album','media_ms':180000}
        self.assertEqual(normal.match_catalog(base,index)['key'],'apple:catalog:10')
        self.assertEqual(normal.match_catalog({**base,'title':'Example (Live)'},index)['key'],'apple:catalog:11')
        index=normal.catalog_index(tracks+[{**tracks[0],'Track Identifier':3,'Apple Music Track Identifier':12}])
        match=normal.match_catalog(base,index)
        self.assertEqual(match['match'],'ambiguous')
        self.assertIsNone(match['artist'])
        self.assertEqual(len(match['candidate_ids']),2)

    def test_midnight_and_fall_back_split_without_losing_milliseconds(self):
        timezone=ZoneInfo('America/New_York')
        segment=normal.segment_from_row(end('x','2026-01-02T04:59:30Z',60000),'x')
        self.assertEqual(normal.hour_buckets(segment,timezone),[('2026-01-01',23,30000),('2026-01-02',0,30000)])
        segment=normal.segment_from_row(end('y','2026-11-01T05:59:30Z',60000),'y')
        buckets=normal.hour_buckets(segment,timezone)
        self.assertEqual(sum(ms for _,_,ms in buckets),60000)
        self.assertEqual({hour for _,hour,_ in buckets},{1})

    def test_overlaps_remain_visible_without_discarding_reported_time(self):
        rows=[{'start':0,'end':100,'channel':'a'}, {'start':20,'end':50,'channel':'a'},
              {'start':80,'end':150,'channel':'b'}, {'start':200,'end':200,'channel':'a'}]
        self.assertEqual(normal.interval_audit(rows), {'elapsed_interval_sum_ms':200,
                         'wall_clock_union_ms':150, 'overlap_excess_ms':50,
                         'within_channel_overlap_excess_ms':30})
        self.assertEqual(normal.interval_audit([])['wall_clock_union_ms'],0)

    def test_unsafe_nested_archives_and_absent_timezones_are_rejected(self):
        with self.assertRaises(ValueError):normal.timestamp('2026-01-01T00:00:00')
        outer=io.BytesIO()
        with zipfile.ZipFile(outer,'w') as z:z.writestr('nested.zip',json_zip('../escape.json',[]))
        outer.seek(0)
        with zipfile.ZipFile(outer) as z:
            with self.assertRaises(ValueError):normal.nested_json(z,'nested.zip')
        with self.assertRaises(ValueError):normal.segment_from_row(end('bad','2026-01-01T00:00:00Z',-1),'x')


if __name__=='__main__':unittest.main()
