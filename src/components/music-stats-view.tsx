"use client";



import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { ChartBar } from "@phosphor-icons/react/dist/csr/ChartBar";

import { TrendUp } from "@phosphor-icons/react/dist/csr/TrendUp";

import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";

import { List } from "@phosphor-icons/react/dist/csr/List";

import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";

import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";

import { SpotifyLogo } from "@phosphor-icons/react/dist/csr/SpotifyLogo";
import { CirclesThree } from "@phosphor-icons/react/dist/csr/CirclesThree";
import type { MusicRanking } from "@/lib/music-entity-details";
import { MusicBalls } from "./music-balls";
import { MusicDetailPanel, type DetailSelection } from "./music-detail-panel";
import { Funnel } from "@phosphor-icons/react/dist/csr/Funnel";

import { Clock, LineChart } from "./music-charts";
import { StatsMenu } from "./music-controls";
import { MusicButton, MusicInteractions, MusicLink } from "./music-interactions";

import { shiftDay, type RangePreset, type RankingKind } from "@/lib/music-stats";

import { MUSIC_BROWSE_START } from "@/lib/music-browsing";
import type { PublicMusicStats } from "@/lib/music-public";



const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const primaryRanges: RangePreset[] = ["day", "week", "month", "year", "lifetime"];

const label = (value: string) => ({ day: "Day", week: "Week", month: "Month", year: "Year", lifetime: "Lifetime", "past-year": "Past year", ytd: "Year to date", custom: "Custom" })[value] ?? value;

const dateLabel = (day: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) => new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));



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

  const [display, setDisplay] = useState<"rankings" | "balls">("rankings");
  const [selected, setSelected] = useState<DetailSelection | null>(null);

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

    if (next === "custom" && !custom.start && data) setCustom({ start: data.range.start < MUSIC_BROWSE_START ? MUSIC_BROWSE_START : data.range.start, end: data.range.end });

    setPreset(next);

  };

  const period = anchor || data?.today || "";

  const navigate = (direction: number) => {

    if (!period) return;

    let next = period;

    if (preset === "day" || preset === "week") next = shiftDay(period, direction * (preset === "day" ? 1 : 7));

    else { const date = new Date(`${period.slice(0, 7)}-01T12:00:00Z`); if (preset === "year") date.setUTCFullYear(date.getUTCFullYear() + direction); else date.setUTCMonth(date.getUTCMonth() + direction); next = date.toISOString().slice(0, 10); }

    if (next < MUSIC_BROWSE_START) next = MUSIC_BROWSE_START;
    if (data && next <= data.today) setAnchor(next);

  };

  const periodName = loading ? "Loading…" : data ? preset === "lifetime" ? "Lifetime" : preset === "year" ? data.range.start.slice(0, 4) : preset === "month" ? dateLabel(data.range.start, { month: "long", year: "numeric" })

    : preset === "day" ? dateLabel(data.range.start) : `${dateLabel(data.range.start)} – ${dateLabel(data.range.end)}` : "Loading…";

  // A saved-data freshness refresh must not restart an unchanged physics scene.
  const rankingContent = JSON.stringify(data?.rankings[kind] ?? []);
  const ranks = useMemo(() => (JSON.parse(rankingContent) as MusicRanking[]).sort((a, b) => (sort === "streams" ? b.count - a.count : b.milliseconds - a.milliseconds) || a.name.localeCompare(b.name)), [rankingContent, sort]);
  const visibleRanks = useMemo(() => ranks.slice(0, limit), [ranks, limit]);

  const summary = data?.summary;

  const metrics = summary ? [

    ["streams", summary.streams, data.previous.streams, false], ["different tracks", summary.tracks, data.previous.tracks, false],

    ["minutes", summary.milliseconds / 60000, data.previous.milliseconds / 60000, true], ["different artists", summary.artists, data.previous.artists, false],

    ["hours", summary.milliseconds / 3600000, data.previous.milliseconds / 3600000, true], ["different albums", summary.albums, data.previous.albums, false],

    ["days of listening", summary.milliseconds / 86400000, data.previous.milliseconds / 86400000, true], ["active days", summary.activeDays, data.previous.activeDays, false],

  ] as const : [];

  const timeTitle = data?.timeBasis === "song-length-estimate" ? "Song-length estimate" : "Export-reported listening duration";

  return <MusicInteractions>

    <div className="stats-title-row"><h1>Music Stats</h1><div className="stats-view-tabs" aria-label="Music view">

      <MusicButton aria-pressed={view === "stats"} onClick={() => setView("stats")} aria-label="Stats" title="Stats"><ChartBar size={21} /><span>Stats</span></MusicButton>

      <MusicButton aria-pressed={view === "top"} onClick={() => setView("top")} aria-label="Top" title="Top"><TrendUp size={21} /><span>Top</span></MusicButton>

    </div></div>

    <p className="stats-freshness">{data?.lastCollection ? `Last collected · ${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(data.lastCollection))} ET` : "Loading statistics…"}</p>

    <div className="stats-timeframe" aria-label="Timeframe">

      <div className="stats-period-picker"><MusicButton aria-label="Previous period" onClick={() => navigate(-1)} disabled={!data || !["day", "week", "month", "year"].includes(preset) || data.range.start <= MUSIC_BROWSE_START}><CaretLeft size={18} /></MusicButton><strong>{periodName}</strong><MusicButton aria-label="Next period" onClick={() => navigate(1)} disabled={!data || !["day", "week", "month", "year"].includes(preset) || data.range.end >= data.today}><CaretRight size={18} /></MusicButton></div>

      <div className="stats-range-tabs">{primaryRanges.map(value => <MusicButton className={value === "week" || value === "year" ? "range-secondary" : ""} key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label(value)}</MusicButton>)}

        <div className="stats-extended-ranges">{(["past-year", "ytd", "custom"] as const).map(value => <MusicButton key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label(value)}</MusicButton>)}</div>

        <StatsMenu className="stats-range-menu" label="More timeframes" icon={<List size={21} />}>{(["week", "year", "past-year", "ytd", "custom"] as const).map(value => <MusicButton className={value === "week" || value === "year" ? "menu-compact-only" : ""} key={value} aria-pressed={preset === value} onClick={() => chooseRange(value)}>{label(value)}</MusicButton>)}</StatsMenu>

      </div>

      {preset === "custom" && <div className="stats-custom-range"><label>From<input type="date" min={MUSIC_BROWSE_START} value={custom.start} max={custom.end || data?.today} onChange={e => setCustom({ ...custom, start: e.target.value && e.target.value < MUSIC_BROWSE_START ? MUSIC_BROWSE_START : e.target.value })} /></label><label>To<input type="date" value={custom.end} min={custom.start || MUSIC_BROWSE_START} max={data?.today} onChange={e => setCustom({ ...custom, end: e.target.value && e.target.value < MUSIC_BROWSE_START ? MUSIC_BROWSE_START : e.target.value })} /></label></div>}

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

      <div className="stats-chart-grid"><section className="stats-section"><h2>Daily</h2><LineChart daily={data.daily} hours={data.range.start === data.range.end ? data.hours : undefined} cumulative={false} /></section><section className="stats-section"><h2>Cumulative</h2><LineChart daily={data.daily} hours={data.range.start === data.range.end ? data.hours : undefined} cumulative /></section></div>

      <div className="stats-breakdown-grid"><Bars title="Streams by day of the week" rows={data.weekdays} /><Bars title="Streams by month" rows={data.months} /></div>

      {data.years.length > 0 && <Bars title="Streams by year" rows={data.years} />}

    </div>}

    {hasResults && data && view === "top" && <div className="stats-top-content"><div className="stats-top-toolbar">

      <div className="stats-kind-tabs" aria-label="Ranking type">{(["tracks", "artists", "albums"] as const).map(value => <MusicButton key={value} aria-pressed={kind === value} onClick={() => { setKind(value); setLimit(30); }}>{value[0].toUpperCase() + value.slice(1)}</MusicButton>)}</div>

      <div className="stats-top-options"><MusicLink className="stats-spotify-credit" href="https://open.spotify.com" target="_blank" rel="noreferrer" aria-label="Music metadata from Spotify"><SpotifyLogo size={20} /></MusicLink><StatsMenu label="Filter" icon={<Funnel size={21} />}><p>Sort by</p><MusicButton aria-pressed={sort === "time"} onClick={() => setSort("time")}>Listening time</MusicButton><MusicButton aria-pressed={sort === "streams"} onClick={() => setSort("streams")}>Streams</MusicButton><p>Display</p><MusicButton aria-pressed={display === "rankings"} onClick={() => setDisplay("rankings")}>Rankings</MusicButton><MusicButton aria-pressed={display === "balls"} onClick={() => setDisplay("balls")}>Falling balls</MusicButton></StatsMenu>

        {display === "rankings" ? <MusicButton className="stats-control stats-layout-control" aria-label={`Change layout: ${density ?? "responsive"} ${layout}. Cycle 3, 4, 5 columns and list.`} onClick={cycleLayout}>{layout === "list" ? <List size={21} /> : <SquaresFour size={21} />}<span className="stats-control-label">{layout === "list" ? "List" : "Grid"}</span>{layout === "grid" && <small>{density ?? <><i className="grid-default-wide">5</i><i className="grid-default-normal">4</i><i className="grid-default-small">3</i></>}</small>}</MusicButton> : <span className="stats-balls-indicator" aria-label="Falling balls view"><CirclesThree size={21}/></span>}

      </div>

    </div>

      {ranks.length ? display === "balls" ? <MusicBalls rows={visibleRanks} sort={sort} suspended={!!selected} onSelect={row => setSelected({ kind, row })}/> : <ol className={`stats-ranks ${layout}`} style={typeof density === "number" ? { gridTemplateColumns: `repeat(${density},minmax(0,1fr))` } : undefined}>{visibleRanks.map((row, index) => <li key={row.id}>

        {layout === "list" && <span className="stats-list-position">#{index + 1}</span>}

        <div className="stats-rank-surface"><button className="stats-art-hit" data-music-magnet="art" aria-label={`View stats for ${row.name}`} onClick={() => setSelected({ kind, row })}><div className="stats-rank-art">{row.artwork && <Image className={kind === "artists" ? "stats-artist-image" : undefined} src={row.artwork} unoptimized alt={kind === "artists" ? `${row.name} artist profile` : ""} width={400} height={400} loading="lazy" />}{!row.artwork && <span className="stats-art-placeholder" aria-label={kind === "artists" ? `No artist profile image available for ${row.name}` : "Artwork unavailable"}>{row.name.slice(0, 1)}</span>}</div></button>

          <div className="stats-rank-text"><h2><MusicButton className="stats-name-button" title={row.name} onClick={() => setSelected({ kind, row })}>{layout === "grid" ? `${index + 1}. ` : ""}{row.name}</MusicButton></h2>

            <p title={timeTitle}>{n.format(row.milliseconds / 60000)} minutes · {n.format(row.count)} streams</p>{layout === "list" && kind !== "artists" && <span>{row.detail}</span>}

          </div></div>

      </li>)}</ol> : <p className="stats-empty">No listening records in this timeframe.</p>}

      {ranks.length > limit && <MusicButton className="stats-show-more" onClick={() => setLimit(v => v + 30)}>Show more</MusicButton>}

    </div>}

    {selected && <MusicDetailPanel selection={selected} timeframe={requestKey} onSelect={setSelected} onClose={() => setSelected(null)}/>}
  </MusicInteractions>;

}
