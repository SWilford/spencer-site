"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChartBar } from "@phosphor-icons/react/dist/csr/ChartBar";
import { TrendUp } from "@phosphor-icons/react/dist/csr/TrendUp";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { List } from "@phosphor-icons/react/dist/csr/List";
import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { shiftDay, type RangePreset, type RankingKind } from "@/lib/music-stats";
import type { PublicMusicStats } from "@/lib/music-public";

const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const primaryRanges: RangePreset[] = ["day", "week", "month", "year", "lifetime"];
const label = (value: string) => ({ day: "Day", week: "Week", month: "Month", year: "Year", lifetime: "Lifetime", "past-year": "Past year", ytd: "Year to date", custom: "Custom" })[value] ?? value;
const dateLabel = (day: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) => new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

function Clock({ hours, minutes }: { hours: PublicMusicStats["hours"]; minutes: boolean }) {
  const id = useId(), maximum = Math.max(1, ...hours.map(h => minutes ? h.minutes : h.count));
  const point = (radius: number, angle: number) => `${125 + Math.cos(angle) * radius},${125 + Math.sin(angle) * radius}`;
  const wedge = (start: number, end: number, outer: number) => `M${point(34, start)} L${point(outer, start)} A${outer},${outer} 0 0 1 ${point(outer, end)} L${point(34, end)} A34,34 0 0 0 ${point(34, start)} Z`;
  return <svg viewBox="0 0 250 250" className="stats-clock" role="img" aria-labelledby={id}>
    <title id={id}>{minutes ? "Minutes" : "Streams"} by hour, Eastern time</title>
    {hours.map((h, index) => {
      const start = index / 24 * Math.PI * 2 - Math.PI / 2 + .015, end = (index + 1) / 24 * Math.PI * 2 - Math.PI / 2 - .015;
      const value = minutes ? h.minutes : h.count;
      return <g key={h.label}><path d={wedge(start, end, 108)} className="stats-clock-base" />{value > 0 && <path d={wedge(start, end, 35 + value / maximum * 73)} className="stats-clock-fill"><title>{h.label.padStart(2, "0")}:00 · {n.format(value)} {minutes ? "minutes" : "streams"}</title></path>}</g>;
    })}
    <text x="125" y="107" textAnchor="middle">0</text><text x="146" y="130" textAnchor="middle">6</text><text x="125" y="152" textAnchor="middle">12</text><text x="104" y="130" textAnchor="middle">18</text>
  </svg>;
}

function LineChart({ daily, cumulative }: { daily: PublicMusicStats["daily"]; cumulative: boolean }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const rows: { day: string; count: number; minutes: number }[] = [];
  let count = 0, minutes = 0;
  for (const row of daily) {
    count += row.count; minutes += row.milliseconds / 60000;
    const key = daily.length > 730 ? row.day.slice(0, 7) : row.day;
    const last = rows.at(-1);
    if (last?.day === key) { last.count = cumulative ? count : last.count + row.count; last.minutes = cumulative ? minutes : last.minutes + row.milliseconds / 60000; }
    else rows.push({ day: key, count: cumulative ? count : row.count, minutes: cumulative ? minutes : row.milliseconds / 60000 });
  }
  const maximum = Math.max(1, ...rows.flatMap(r => [r.count, r.minutes]));
  const x = (i: number) => 62 + i / Math.max(1, rows.length - 1) * 660;
  const y = (v: number) => 208 - v / maximum * 173;
  const line = (field: "count" | "minutes") => rows.map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r[field])}`).join(" ");
  const selected = hover === null ? null : rows[hover];
  return <div className="stats-chart-wrap">
    <div className="stats-chart-readout" aria-live="polite">{selected ? `${selected.day} · ${n.format(selected.count)} streams · ${n.format(selected.minutes)} minutes` : " "}</div>
    <svg viewBox="0 0 760 250" className="stats-line-chart" role="img" aria-labelledby={id}><title id={id}>{cumulative ? "Cumulative" : "Daily"} streams and minutes</title>
      {[0, .5, 1].map(v => <g key={v}><line x1="62" x2="722" y1={y(maximum * v)} y2={y(maximum * v)} className="stats-chart-rule" /><text x="48" y={y(maximum * v) + 4} textAnchor="end">{n.format(maximum * v)}</text></g>)}
      <path d={line("minutes")} className="stats-line minutes" /><path d={line("count")} className="stats-line streams" />
      {rows.length === 1 && <><circle cx={x(0)} cy={y(rows[0].minutes)} r="4" className="stats-dot minutes" /><circle cx={x(0)} cy={y(rows[0].count)} r="4" className="stats-dot streams" /></>}
      {rows.map((r, i) => <rect key={r.day} x={i === 0 ? 62 : (x(i - 1) + x(i)) / 2} y="25" width={(i === rows.length - 1 ? 722 : (x(i) + x(i + 1)) / 2) - (i === 0 ? 62 : (x(i - 1) + x(i)) / 2)} height="188" fill="transparent" tabIndex={rows.length <= 31 ? 0 : undefined}
        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`${r.day}, ${n.format(r.count)} streams, ${n.format(r.minutes)} minutes`}><title>{r.day}: {n.format(r.count)} streams · {n.format(r.minutes)} minutes</title></rect>)}
      {rows.length > 0 && <><text x="62" y="241">{rows[0].day.length === 7 ? rows[0].day : dateLabel(rows[0].day, { month: "short", day: "numeric" })}</text><text x="722" y="241" textAnchor="end">{rows.at(-1)!.day.length === 7 ? rows.at(-1)!.day : dateLabel(rows.at(-1)!.day, { month: "short", day: "numeric" })}</text></>}
    </svg>
    <div className="stats-chart-legend"><span><i className="streams" />streams</span><span title="Time may use song-length estimates"><i className="minutes" />minutes</span></div>
    <details className="stats-chart-data"><summary>Chart data</summary><div><table><caption>{cumulative ? "Cumulative" : daily.length > 730 ? "Monthly" : "Daily"} listening values</caption><thead><tr><th scope="col">Date</th><th scope="col">Streams</th><th scope="col">Minutes</th></tr></thead><tbody>{rows.map(row => <tr key={row.day}><th scope="row">{row.day}</th><td>{n.format(row.count)}</td><td>{n.format(row.minutes)}</td></tr>)}</tbody></table></div></details>
  </div>;
}

function Bars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const maximum = Math.max(1, ...rows.map(r => r.count));
  return <section className="stats-section"><h2>{title}</h2><div className="stats-bars-scroll"><div className="stats-bars" style={{ minWidth: rows.length > 7 ? `${rows.length * 62}px` : undefined }}>
    {rows.map(row => <div key={row.label} className="stats-bar-column"><div className="stats-bar-space"><strong>{n.format(row.count)}</strong><i style={{ height: `${Math.max(row.count ? 4 : 1, row.count / maximum * 155)}px` }} /></div><span>{row.label}</span></div>)}
  </div></div></section>;
}

export function MusicDashboard() {
  const [data, setData] = useState<PublicMusicStats | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"stats" | "top">("stats");
  const [preset, setPreset] = useState<RangePreset>("month");
  const [anchor, setAnchor] = useState("");
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [tick, setTick] = useState(0);
  const [kind, setKind] = useState<RankingKind>("artists");
  const [sort, setSort] = useState<"time" | "streams">("time");
  const [layout, setLayout] = useState<"list" | "grid">("grid");
  const [columns, setColumns] = useState(3);
  const [limit, setLimit] = useState(30);
  const [committedRequest, setCommittedRequest] = useState("");
  const [failedRequest, setFailedRequest] = useState("");
  const params = new URLSearchParams({ preset });
  if (anchor) params.set("anchor", anchor);
  if (preset === "custom" && custom.start && custom.end) { params.set("start", custom.start); params.set("end", custom.end); }
  const requestKey = params.toString();
  const loading = committedRequest !== requestKey && failedRequest !== requestKey;
  const hasResults = !!data && committedRequest === requestKey;
  const currentError = failedRequest === requestKey ? error : "";
  useEffect(() => {
    const abort = new AbortController();
    if (preset === "custom" && (!custom.start || !custom.end)) return;
    fetch(`/api/music-stats?${requestKey}`, { signal: abort.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Statistics are unavailable.");
      setData(result); setError(""); setCommittedRequest(requestKey); setFailedRequest("");
    }).catch(e => { if (e.name !== "AbortError") { setError(e.message); setFailedRequest(requestKey); } });
    return () => abort.abort();
  }, [requestKey, preset, custom.start, custom.end, tick]);
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === "visible") setTick(t => t + 1); }, 60000); return () => clearInterval(timer); }, []);
  const chooseRange = (next: RangePreset) => {
    if (next === "custom" && !custom.start && data) setCustom(data.range);
    setPreset(next);
  };
  const period = anchor || data?.today || "";
  const navigate = (direction: number) => {
    if (!period) return;
    let next = period;
    if (preset === "day" || preset === "week") next = shiftDay(period, direction * (preset === "day" ? 1 : 7));
    else { const date = new Date(`${period.slice(0, 7)}-01T12:00:00Z`); if (preset === "year") date.setUTCFullYear(date.getUTCFullYear() + direction); else date.setUTCMonth(date.getUTCMonth() + direction); next = date.toISOString().slice(0, 10); }
    if (data && next <= data.today && next >= "2000-01-01") setAnchor(next);
  };
  const periodName = data ? preset === "lifetime" ? "Lifetime" : preset === "year" ? data.range.start.slice(0, 4) : preset === "month" ? dateLabel(data.range.start, { month: "long", year: "numeric" })
    : preset === "day" ? dateLabel(data.range.start) : `${dateLabel(data.range.start)} – ${dateLabel(data.range.end)}` : "Loading…";
  const ranks = data ? [...data.rankings[kind]].sort((a, b) => (sort === "streams" ? b.count - a.count : b.milliseconds - a.milliseconds) || a.name.localeCompare(b.name)) : [];
  const summary = data?.summary;
  const metrics = summary ? [
    ["streams", summary.streams, data.previous.streams, false], ["different tracks", summary.tracks, data.previous.tracks, false],
    ["minutes", summary.milliseconds / 60000, data.previous.milliseconds / 60000, true], ["different artists", summary.artists, data.previous.artists, false],
    ["hours", summary.milliseconds / 3600000, data.previous.milliseconds / 3600000, true], ["different albums", summary.albums, data.previous.albums, false],
    ["days of listening", summary.milliseconds / 86400000, data.previous.milliseconds / 86400000, true], ["active days", summary.activeDays, data.previous.activeDays, false],
  ] as const : [];
  const timeTitle = data?.timeBasis === "song-length-estimate" ? "Song-length estimate" : "Export-reported listening duration";
  return <>
    <div className="stats-title-row"><h1>Music Stats</h1><div className="stats-view-tabs" aria-label="Music view">
      <button aria-pressed={view === "stats"} onClick={() => setView("stats")} title="Stats"><ChartBar size={21} /><span>Stats</span></button>
      <button aria-pressed={view === "top"} onClick={() => setView("top")} title="Top Artists"><TrendUp size={21} /><span>Top Artists</span></button>
    </div></div>
    <p className="stats-freshness">{data?.lastCollection ? `Last collected · ${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(data.lastCollection))} ET` : "Loading statistics…"}</p>
    <div className="stats-timeframe" aria-label="Timeframe">
      <div className="stats-period-picker"><button aria-label="Previous period" onClick={() => navigate(-1)} disabled={!data || !["day", "week", "month", "year"].includes(preset)}><CaretLeft size={18} /></button><strong>{periodName}</strong><button aria-label="Next period" onClick={() => navigate(1)} disabled={!data || !["day", "week", "month", "year"].includes(preset) || data.range.end >= data.today}><CaretRight size={18} /></button></div>
      <div className="stats-range-tabs">{primaryRanges.map(value => <button key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label(value)}</button>)}
        <select aria-label="More timeframes" value={primaryRanges.includes(preset) ? "" : preset} onChange={e => { if (e.target.value) chooseRange(e.target.value as RangePreset); }}><option value="">More</option><option value="past-year">Past year</option><option value="ytd">Year to date</option><option value="custom">Custom</option></select>
      </div>
      {preset === "custom" && <div className="stats-custom-range"><label>From<input type="date" value={custom.start} max={custom.end || data?.today} onChange={e => setCustom({ ...custom, start: e.target.value })} /></label><label>To<input type="date" value={custom.end} min={custom.start} max={data?.today} onChange={e => setCustom({ ...custom, end: e.target.value })} /></label></div>}
    </div>
    {currentError && <p className="stats-error" role="alert">{currentError}</p>}
    {loading && <div className="stats-loading" role="status">Loading Music Stats…</div>}
    {hasResults && data && summary && view === "stats" && <div className="stats-content">
      <dl className="stats-metric-grid">{metrics.map(([name, value, prior, time]) => {
        const change = prior > 0 && data.previous.streams > 0 ? (Number(value) - Number(prior)) / Number(prior) * 100 : null;
        return <div key={name} className="stats-metric" title={time ? timeTitle : name === "streams" ? "Recorded playback entries" : undefined}><dd>{name === "days of listening" ? decimal.format(Number(value)) : n.format(Number(value))}{change !== null && preset !== "lifetime" && <span className={change >= 0 ? "stats-change positive" : "stats-change"} title="Compared with the preceding period of the same length">{change > 0 ? "+" : ""}{n.format(change)}%</span>}</dd><dt>{name}</dt></div>;
      })}</dl>
      <section className="stats-section"><h2>Listening clocks</h2><div className="stats-clocks"><div><Clock hours={data.hours} minutes={false} /><strong>streams</strong></div><div title={timeTitle}><Clock hours={data.hours} minutes /><strong>minutes</strong></div></div></section>
      <section className="stats-section"><h2>Streams and minutes per day</h2><dl className="stats-average-grid"><div className="stats-metric"><dd>{n.format(summary.streams / summary.days)}</dd><dt>average streams per day</dt></div><div className="stats-metric" title={timeTitle}><dd>{n.format(summary.milliseconds / 60000 / summary.days)}</dd><dt>average minutes per day</dt></div></dl></section>
      <div className="stats-chart-grid"><section className="stats-section"><h2>Daily</h2><LineChart daily={data.daily} cumulative={false} /></section><section className="stats-section"><h2>Cumulative</h2><LineChart daily={data.daily} cumulative /></section></div>
      <div className="stats-breakdown-grid"><Bars title="Streams by day of the week" rows={data.weekdays} /><Bars title="Streams by month" rows={data.months} /></div>
      {data.years.length > 0 && <Bars title="Streams by year" rows={data.years} />}
    </div>}
    {hasResults && data && view === "top" && <div className="stats-top-content"><div className="stats-top-toolbar">
      <div className="stats-kind-tabs" aria-label="Ranking type">{(["tracks", "artists", "albums"] as const).map(value => <button key={value} aria-pressed={kind === value} onClick={() => { setKind(value); setLimit(30); }}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div>
      <div className="stats-top-options"><select aria-label="Sort top results" value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="time">Listening time</option><option value="streams">Streams</option></select>
        <button className="stats-icon-button" aria-label={layout === "grid" ? "Switch to list layout" : "Switch to grid layout"} title={layout === "grid" ? "List layout" : "Grid layout"} onClick={() => setLayout(layout === "grid" ? "list" : "grid")}>{layout === "grid" ? <List size={23} /> : <SquaresFour size={23} />}</button>
        {layout === "grid" && <select aria-label="Grid columns" value={columns} onChange={e => setColumns(Number(e.target.value))}><option value={3}>3 columns</option><option value={4}>4 columns</option><option value={5}>5 columns</option></select>}
      </div>
    </div>
      {ranks.length ? <ol className={`stats-ranks ${layout}`} style={layout === "grid" ? { gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` } : undefined}>{ranks.slice(0, limit).map((row, index) => <li key={row.id}>
        {layout === "list" && <span className="stats-list-position">#{index + 1}</span>}
        <div className="stats-rank-surface"><div className="stats-rank-art">{row.artwork && <Image src={row.artwork} unoptimized alt={kind === "artists" ? `Album artwork associated with ${row.name}` : ""} width={400} height={400} loading="lazy" />}</div>
          <div className="stats-rank-text"><h2>{row.url ? <a href={row.url} target="_blank" rel="noreferrer" title={row.name}>{layout === "grid" ? `${index + 1}. ` : ""}{row.name}</a> : <span title={row.name}>{layout === "grid" ? `${index + 1}. ` : ""}{row.name}</span>}</h2>
            <p title={timeTitle}>{n.format(row.milliseconds / 60000)} minutes · {n.format(row.count)} streams</p>{layout === "list" && kind !== "artists" && <span>{row.detail}</span>}
          </div></div>
      </li>)}</ol> : <p className="stats-empty">No listening records in this timeframe.</p>}
      {ranks.length > limit && <button className="stats-show-more" onClick={() => setLimit(v => v + 30)}>Show more</button>}
    </div>}
  </>;
}
