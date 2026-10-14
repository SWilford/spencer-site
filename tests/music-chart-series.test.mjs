import test from 'node:test';
import assert from 'node:assert/strict';
import {musicChartSeries} from '../src/lib/music-chart-series.ts';
const daily=[{day:'2026-10-14',count:3,milliseconds:300000}];
const hours=[{label:'8',count:2,minutes:3},{label:'15',count:1,minutes:2}];
test('one-day charts plot complete hourly buckets instead of a single daily point',()=>{
 const rows=musicChartSeries(daily,false,hours);
 assert.equal(rows.length,24); assert.equal(rows[8].count,2); assert.equal(rows[15].minutes,2);
 assert.equal(rows[0].count,0); assert.equal(rows.reduce((sum,row)=>sum+row.count,0),3);
 assert.equal(rows[8].period,'8 AM\u20139 AM ET');
 assert.ok(rows[0].position>0 && rows.at(-1).position<1);
});
test('hourly cumulative charts start at zero and finish at the daily totals',()=>{
 const rows=musicChartSeries(daily,true,hours);
 assert.equal(rows.length,25); assert.equal(rows[0].count,0); assert.equal(rows[0].position,0);
 assert.equal(rows[9].count,2); assert.equal(rows[16].count,3);
 assert.equal(rows.at(-1).count,3); assert.equal(rows.at(-1).minutes,5); assert.equal(rows.at(-1).position,1);
});
test('multi-day charts preserve date-based daily and cumulative aggregation',()=>{
 const days=[...daily,{day:'2026-10-15',count:2,milliseconds:60000}];
 assert.deepEqual(musicChartSeries(days,false,hours).map(row=>row.count),[3,2]);
 assert.deepEqual(musicChartSeries(days,true,hours).map(row=>row.minutes),[5,6]);
});
