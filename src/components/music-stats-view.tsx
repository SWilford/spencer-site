"use client";



import { useEffect, useId, useState } from "react";

import Image from "next/image";

import { ChartBar } from "@phosphor-icons/react/dist/csr/ChartBar";

import { TrendUp } from "@phosphor-icons/react/dist/csr/TrendUp";

import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";

import { List } from "@phosphor-icons/react/dist/csr/List";

import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";

import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";

import { Funnel } from "@phosphor-icons/react/dist/csr/Funnel";

import { StatsMenu } from "./music-controls";

import { shiftDay, type RangePreset, type RankingKind } from "@/lib/music-stats";

import type { PublicMusicStats } from "@/lib/music-public";



const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const primaryRanges: RangePreset[] = ["day", "week", "month", "year", "lifetime"];

const label = (value: string) => ({ day: "Day", week: "Week", month: "Month", year: "Year", lifetime: "Lifetime", "past-year": "Past year", ytd: "Year to date", custom: "Custom" })[value] ?? value;

const dateLabel = (day: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) => new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));



function Clock({ hours, minutes }: { hours: PublicMusicStats["hours"]; minutes: boolean }) {

  const id = useId(), [active, setActive] = useState<number | null>(null);

  const maximum = Math.max(1, ...hours.map(h => minutes ? h.minutes : h.count));

  const point = (radius: number, angle: number) => `${125 + Math.cos(angle) * radius},${125 + Math.sin(angle) * radius}`;

  const wedge = (start: number, end: number, outer: number) => `M${point(34, start)} L${point(outer, start)} A${outer},${outer} 0 0 1 ${point(outer, end)} L${point(34, end)} A34,34 0 0 0 ${point(34, start)} Z`;

  const selected = active === null ? null : hours[active];

  const angle = ((active ?? 0) + .5) / 24 * Math.PI * 2 - Math.PI / 2;

  return <div className="stats-clock-wrap" onPointerLeave={() => setActive(null)}>

    <svg viewBox="0 0 250 250" className="stats-clock" role="group" aria-label={`${minutes ? "Minutes" : "Streams"} by hour, Eastern time`} tabIndex={0} aria-describedby={selected ? id : undefined}

      onFocus={() => setActive(0)} onBlur={() => setActive(null)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) { event.preventDefault(); setActive(event.key === "Escape" ? null : event.key === "Home" ? 0 : event.key === "End" ? 23 : ((active ?? 0) + (event.key === "ArrowRight" ? 1 : 23)) % 24); } }}>

      {hours.map((h, index) => {

        const start = index / 24 * Math.PI * 2 - Math.PI / 2 + .015, end = (index + 1) / 24 * Math.PI * 2 - Math.PI / 2 - .015;

        const value = minutes ? h.minutes : h.count;

        return <g key={h.label} className={active === index ? "clock-sector active" : "clock-sector"} onPointerEnter={() => setActive(index)} onPointerDown={() => setActive(index)}><path d={wedge(start, end, 108)} className="stats-clock-base" />{value > 0 && <path d={wedge(start, end, 35 + value / maximum * 73)} className="stats-clock-fill" />}</g>;

      })}

      <text x="125" y="107" textAnchor="middle">0</text><text x="146" y="130" textAnchor="middle">6</text><text x="125" y="152" textAnchor="middle">12</text><text x="104" y="130" textAnchor="middle">18</text>

    </svg>

    {selected && <div id={id} role="tooltip" className="stats-tooltip clock-tooltip" style={{ left: `${Math.max(25, Math.min(75, 50 + Math.cos(angle) * 27))}%`, top: `${50 + Math.sin(angle) * 27}%` }}><b>{selected.label.padStart(2, "0")}:00–{String((Number(selected.label) + 1) % 24).padStart(2, "0")}:00 ET</b><span>{minutes ? `${n.format(selected.minutes)} min · ${decimal.format(selected.minutes / 60)} hr` : `${n.format(selected.count)} streams`}</span></div>}

    <span className="sr-only" aria-live="polite">{selected ? `${selected.label}:00, ${minutes ? `${n.format(selected.minutes)} minutes` : `${selected.count} streams`}` : "Use left and right arrows to inspect each hour."}</span>

  </div>;

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

    {selected && <div className="stats-tooltip chart-tooltip" role="tooltip" id={`${id}-value`} style={{ left: `${Math.max(26, Math.min(74, x(hover!) / 760 * 100))}%` }}><b>{selected.day.length === 7 ? selected.day : dateLabel(selected.day)}</b><span>{n.format(selected.count)} streams</span><span>{n.format(selected.minutes)} min · {decimal.format(selected.minutes / 60)} hr</span></div>}

    <svg viewBox="0 0 760 250" className="stats-line-chart" role="group" tabIndex={0} aria-label={`${cumulative ? "Cumulative" : "Daily"} streams and minutes. Use arrow keys to inspect dates.`} aria-describedby={selected ? `${id}-value` : undefined}

      onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const px = (event.clientX - bounds.left) / bounds.width * 760; setHover(Math.max(0, Math.min(rows.length - 1, Math.round((px - 62) / 660 * (rows.length - 1))))); }}

      onPointerLeave={() => setHover(null)} onFocus={() => setHover(0)} onBlur={() => setHover(null)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) { event.preventDefault(); setHover(event.key === "Escape" ? null : event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : Math.max(0, Math.min(rows.length - 1, (hover ?? 0) + (event.key === "ArrowRight" ? 1 : -1)))); } }}><title id={id}>{cumulative ? "Cumulative" : "Daily"} streams and minutes</title>

      {[0, .5, 1].map(v => <g key={v}><line x1="62" x2="722" y1={y(maximum * v)} y2={y(maximum * v)} className="stats-chart-rule" /><text x="48" y={y(maximum * v) + 4} textAnchor="end">{n.format(maximum * v)}</text></g>)}

      <path d={line("minutes")} className="stats-line minutes" /><path d={line("count")} className="stats-line streams" />

      {rows.length === 1 && <><circle cx={x(0)} cy={y(rows[0].minutes)} r="4" className="stats-dot minutes" /><circle cx={x(0)} cy={y(rows[0].count)} r="4" className="stats-dot streams" /></>}

      {selected && <g className="stats-crosshair"><line x1={x(hover!)} x2={x(hover!)} y1="14" y2="208" /><circle cx={x(hover!)} cy={y(selected.count)} r="5" className="stats-dot streams" /><circle cx={x(hover!)} cy={y(selected.minutes)} r="5" className="stats-dot minutes" /></g>}

      {rows.length > 0 && <><text x="62" y="241">{rows[0].day.length === 7 ? rows[0].day : dateLabel(rows[0].day, { month: "short", day: "numeric" })}</text><text x="722" y="241" textAnchor="end">{rows.at(-1)!.day.length === 7 ? rows.at(-1)!.day : dateLabel(rows.at(-1)!.day, { month: "short", day: "numeric" })}</text></>}

    </svg>

    <div className="stats-chart-legend"><span><i className="streams" />streams</span><span title="Time may use song-length estimates"><i className="minutes" />minutes</span></div>

    <span className="sr-only" aria-live="polite">{selected ? `${selected.day}: ${n.format(selected.count)} streams, ${n.format(selected.minutes)} minutes` : "Use arrow keys, Home, or End to inspect chart values."}</span>

  </div>;

}



function Bars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {

  const maximum = Math.max(1, ...rows.map(r => r.count));

  return <section className="stats-section"><h2>{title}</h2><div className="stats-bars-wrap"><div className={`stats-bars ${rows.length === 12 ? "months" : ""}`} style={{ gridTemplateColumns: `repeat(${rows.length},minmax(0,1fr))` }}>

    {rows.map(row => <div key={row.label} className="stats-bar-column" role="img" aria-label={`${row.label}: ${n.format(row.count)} streams`}><div className="stats-bar-space"><strong>{n.format(row.count)}</strong><i style={{ height: `${Math.max(row.count ? 4 : 1, row.count / maximum * 155)}px` }} /></div><span><span className="bar-full-label">{row.label}</span><span className="bar-short-label" aria-hidden="true">{row.label.slice(0, 1)}</span></span></div>)}

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

  const [density, setDensity] = useState<3 | 4 | 5 | "list" | null>(null);

  const layout = density === "list" ? "list" : "grid";

  const cycleLayout = () => {

    const current = density ?? (window.innerWidth >= 1280 ? 5 : window.innerWidth > 680 ? 4 : 3);

    setDensity(current === 5 ? "list" : current === "list" ? 3 : current === 3 ? 4 : 5);

  };

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

  const periodName = loading ? "Loading…" : data ? preset === "lifetime" ? "Lifetime" : preset === "year" ? data.range.start.slice(0, 4) : preset === "month" ? dateLabel(data.range.start, { month: "long", year: "numeric" })

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

      <button aria-pressed={view === "stats"} onClick={() => setView("stats")} aria-label="Stats" title="Stats"><ChartBar size={21} /><span>Stats</span></button>

      <button aria-pressed={view === "top"} onClick={() => setView("top")} aria-label="Top" title="Top"><TrendUp size={21} /><span>Top</span></button>

    </div></div>

    <p className="stats-freshness">{data?.lastCollection ? `Last collected · ${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(data.lastCollection))} ET` : "Loading statistics…"}</p>

    <div className="stats-timeframe" aria-label="Timeframe">

      <div className="stats-period-picker"><button aria-label="Previous period" onClick={() => navigate(-1)} disabled={!data || !["day", "week", "month", "year"].includes(preset)}><CaretLeft size={18} /></button><strong>{periodName}</strong><button aria-label="Next period" onClick={() => navigate(1)} disabled={!data || !["day", "week", "month", "year"].includes(preset) || data.range.end >= data.today}><CaretRight size={18} /></button></div>

      <div className="stats-range-tabs">{primaryRanges.map(value => <button className={value === "week" || value === "year" ? "range-secondary" : ""} key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label(value)}</button>)}

        <div className="stats-extended-ranges">{(["past-year", "ytd", "custom"] as const).map(value => <button key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label(value)}</button>)}</div>

        <StatsMenu className="stats-range-menu" label="More timeframes" icon={<List size={21} />}>{(["week", "year", "past-year", "ytd", "custom"] as const).map(value => <button className={value === "week" || value === "year" ? "menu-compact-only" : ""} key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label(value)}</button>)}</StatsMenu>

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

      <div className="stats-top-options"><StatsMenu label="Filter" icon={<Funnel size={21} />}><p>Sort by</p><button aria-pressed={sort === "time"} onClick={() => setSort("time")}>Listening time</button><button aria-pressed={sort === "streams"} onClick={() => setSort("streams")}>Streams</button></StatsMenu>

        <button className="stats-control stats-layout-control" aria-label={`Change layout: ${density ?? "responsive"} ${layout}. Cycle 3, 4, 5 columns and list.`} onClick={cycleLayout}>{layout === "list" ? <List size={21} /> : <SquaresFour size={21} />}<span className="stats-control-label">{layout === "list" ? "List" : "Grid"}</span>{layout === "grid" && <small>{density ?? <><i className="grid-default-wide">5</i><i className="grid-default-normal">4</i><i className="grid-default-small">3</i></>}</small>}</button>

      </div>

    </div>

      {ranks.length ? <ol className={`stats-ranks ${layout}`} style={typeof density === "number" ? { gridTemplateColumns: `repeat(${density},minmax(0,1fr))` } : undefined}>{ranks.slice(0, limit).map((row, index) => <li key={row.id}>

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
