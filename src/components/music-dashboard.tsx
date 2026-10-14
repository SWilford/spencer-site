"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ArrowClockwise } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { breakdown, dailySeries, dayKey, PRESETS, presetRange, rank, shiftDay, summarize, TIMEZONE,
  type DateRange, type DurationMode, type MusicSnapshot, type RangePreset, type RankingKind } from "@/lib/music-stats";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const prettyDay = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
const stamp = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const fmtTime = (ms: number) => ms >= 3600000 ? `${number.format(ms / 3600000)} hr` : `${number.format(ms / 60000)} min`;

function RangeControl({ label, preset, setPreset, range, setRange, year, setYear }: {
  label: string; preset: RangePreset; setPreset: (v: RangePreset) => void;
  range: DateRange; setRange: (r: DateRange) => void; year: number; setYear: (v: number) => void;
}) {
  const id = useId();
  return <div className="music-range-control">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={preset} onChange={e => setPreset(e.target.value as RangePreset)}>
      {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
    </select>
    {preset === "year" && <label className="music-inline-field">Year <input aria-label={`${label} year`} type="number" min="2000" max={new Date().getFullYear()} value={year} onChange={e => { if (Number(e.target.value) >= 2000) setYear(Number(e.target.value)); }} /></label>}
    {preset === "custom" && <div className="music-custom-dates">
      <label>From<input type="date" aria-label={`${label} start date`} value={range.start} max={range.end} onChange={e => { if (e.target.value) setRange({ ...range, start: e.target.value }); }} /></label>
      <label>To<input type="date" aria-label={`${label} end date`} value={range.end} min={range.start} onChange={e => { if (e.target.value) setRange({ ...range, end: e.target.value }); }} /></label>
    </div>}
  </div>;
}

function ListeningChart({ series, metric, cumulative, timeAvailable }: {
  series: ReturnType<typeof dailySeries>; metric: "plays" | "minutes"; cumulative: boolean; timeAvailable: boolean;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  // Large ranges use monthly chart bins; summaries and the expandable table retain daily precision.
  const bins: { day: string; value: number }[] = [];
  let running = 0;
  for (const d of series) {
    const value = metric === "plays" ? d.count : d.milliseconds / 60000;
    running += value;
    const key = series.length > 370 ? d.day.slice(0, 7) : d.day;
    const last = bins.at(-1);
    if (last?.day === key) last.value = cumulative ? running : last.value + value;
    else bins.push({ day: key, value: cumulative ? running : value });
  }
  const maximum = Math.max(1, ...bins.map(d => d.value));
  const x = (index: number) => 46 + (index + .5) * 700 / Math.max(1, bins.length);
  const y = (value: number) => 194 - value / maximum * 162;
  const selected = active === null ? null : bins[active];
  const name = metric === "plays" ? "recorded plays" : "minutes";
  return <>
    <div className="music-chart-caption" aria-live="polite">
      {selected ? `${selected.day}: ${number.format(selected.value)} ${name}` : `${cumulative ? "Running total" : series.length > 370 ? "Monthly totals" : "Daily totals"} · ${name}`}
    </div>
    {metric === "minutes" && !timeAvailable ? <div className="music-chart-empty"><p>No measured listening time yet.</p><span>Choose song-length estimates, or view recorded plays.</span></div> : <svg className="music-chart" viewBox="0 0 760 240" role="img" aria-labelledby={id}>
      <title id={id}>{cumulative ? "Cumulative" : "Daily"} {name} in the selected range. A data table follows.</title>
      {[0, .5, 1].map(step => <g key={step}><line x1="46" x2="748" y1={y(maximum * step)} y2={y(maximum * step)} className="music-chart-guide" /><text x="34" y={y(maximum * step) + 4} textAnchor="end">{number.format(maximum * step)}</text></g>)}
      {cumulative && <path d={bins.map((d, index) => `${index ? "L" : "M"}${x(index)},${y(d.value)}`).join(" ")} className="music-chart-line" />}
      {bins.map((d, index) => <rect key={d.day} x={x(index) - Math.max(1, 700 / bins.length - 4) / 2} y={cumulative ? 26 : y(d.value)} width={Math.max(1, 700 / bins.length - 4)} height={cumulative ? 170 : Math.max(2, 194 - y(d.value))}
        className={cumulative ? "music-chart-hit" : d.value ? "music-chart-bar" : "music-chart-zero"}
        tabIndex={bins.length <= 62 ? 0 : undefined} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}
        aria-label={`${d.day}: ${number.format(d.value)} ${name}`}><title>{d.day}: {number.format(d.value)} {name}</title></rect>)}
      {bins.length > 0 && <><text x="46" y="226">{bins[0].day.length === 7 ? bins[0].day : prettyDay(bins[0].day)}</text><text x="748" y="226" textAnchor="end">{bins.at(-1)!.day.length === 7 ? bins.at(-1)!.day : prettyDay(bins.at(-1)!.day)}</text></>}
    </svg>}
    <details className="music-data-table"><summary>View daily data</summary><div><table><caption>Daily recorded plays and listening minutes</caption><thead><tr><th>Date</th><th>Plays</th><th>Minutes</th></tr></thead><tbody>{series.map(d => <tr key={d.day}><td>{d.day}</td><td>{d.count}</td><td>{timeAvailable ? number.format(d.milliseconds / 60000) : "Unavailable"}</td></tr>)}</tbody></table></div></details>
  </>;
}

function ListeningClock({ hours, available }: { hours: ReturnType<typeof breakdown>; available: boolean }) {
  const maximum = Math.max(1, ...hours.map(h => h.minutes));
  return <svg viewBox="0 0 250 250" className="music-clock" role="img" aria-label="Listening minutes by hour, Eastern time. Midnight is at the top; noon is at the bottom.">
    <circle cx="125" cy="125" r="85" className="music-clock-guide" />
    <circle cx="125" cy="125" r="47" className="music-clock-guide" />
    {hours.map((hour, index) => {
      const angle = index / 24 * Math.PI * 2 - Math.PI / 2;
      const length = 7 + hour.minutes / maximum * 43;
      return <line key={hour.label} x1={125 + Math.cos(angle) * 48} y1={125 + Math.sin(angle) * 48}
        x2={125 + Math.cos(angle) * (48 + length)} y2={125 + Math.sin(angle) * (48 + length)} className={hour.minutes ? "music-clock-ray" : "music-clock-tick"}><title>{hour.label.padStart(2, "0")}:00 · {available ? `${number.format(hour.minutes)} minutes` : "Measured time unavailable"}</title></line>;
    })}
    <text x="125" y="18" textAnchor="middle">00</text><text x="238" y="129" textAnchor="end">06</text><text x="125" y="245" textAnchor="middle">12</text><text x="12" y="129">18</text>
    <text x="125" y="123" textAnchor="middle" className="music-clock-center">Eastern</text><text x="125" y="143" textAnchor="middle">24 hours</text>
  </svg>;
}

export function MusicDashboard() {
  const [snapshot, setSnapshot] = useState<MusicSnapshot | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<DurationMode>("estimated");
  const [preset, setPreset] = useState<RangePreset>("month");
  const [topPreset, setTopPreset] = useState<RangePreset>("month");
  const [custom, setCustom] = useState<DateRange>({ start: "", end: "" });
  const [topCustom, setTopCustom] = useState<DateRange>({ start: "", end: "" });
  const [year, setYear] = useState(0);
  const [topYear, setTopYear] = useState(0);
  const [kind, setKind] = useState<RankingKind>("tracks");
  const [sort, setSort] = useState<"plays" | "time">("plays");
  const [chartMetric, setChartMetric] = useState<"plays" | "minutes">("plays");
  const [cumulative, setCumulative] = useState(false);
  const [grouping, setGrouping] = useState<"weekday" | "month" | "year">("weekday");
  const [average, setAverage] = useState<"calendar" | "active">("calendar");
  const [threshold, setThreshold] = useState(30);
  const [limit, setLimit] = useState(10);
  const [source, setSource] = useState("spotify");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/music-stats", { cache: "no-store", signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Saved statistics are unavailable.");
      setSnapshot(result); setError("");
    }).catch(reason => { if (reason.name !== "AbortError") setError(reason.message); }).finally(() => { if (!controller.signal.aborted) setRefreshing(false); });
    return () => controller.abort();
  }, [attempt]);
  const refresh = () => { setRefreshing(true); setAttempt(v => v + 1); };
  useEffect(() => {
    const interval = setInterval(() => { if (document.visibilityState === "visible") setAttempt(v => v + 1); }, 60_000);
    return () => clearInterval(interval);
  }, []);
  const today = snapshot ? dayKey(snapshot.generatedAt) : "1970-01-01";
  const selectedYear = year || Number(today.slice(0, 4));
  const selectedTopYear = topYear || Number(today.slice(0, 4));
  const earliest = snapshot?.plays.length ? snapshot.plays.map(p => dayKey(p.at)).sort()[0] : today;
  const range = preset === "custom" && custom.start ? custom : presetRange(preset, today, earliest, selectedYear);
  const topRange = topPreset === "custom" && topCustom.start ? topCustom : presetRange(topPreset, today, earliest, selectedTopYear);
  const plays = source === "apple" ? [] : snapshot?.plays ?? [];
  const summary = summarize(plays, range, mode);
  const series = dailySeries(plays, range, mode);
  const ranked = rank(plays, topRange, mode, kind, sort);
  const hours = breakdown(summary.selected, mode, "hour");
  const groups = breakdown(summary.selected, mode, grouping);
  const groupMax = Math.max(1, ...groups.map(g => g.minutes));
  const timeAvailable = summary.durationKnown > 0;
  const measured = summary.selected.filter(p => p.actualMs !== null);
  const qualified = measured.length ? measured.filter(p => p.actualMs! >= threshold * 1000).length : null;
  const denominator = average === "active" ? summary.activeDays : summary.days;
  const previous = { start: shiftDay(range.start, -summary.days), end: shiftDay(range.start, -1) };
  const prior = summarize(plays, previous, mode);
  const stale = Boolean(snapshot?.lastCollection && Date.parse(snapshot.generatedAt) - Date.parse(snapshot.lastCollection) > 30 * 60000);
  const metrics = [
    ["Recorded plays", number.format(summary.count), "Playback entries saved"],
    [mode === "estimated" ? "Estimated listening" : "Measured listening", timeAvailable ? fmtTime(summary.milliseconds) : "—", timeAvailable ? `${number.format(summary.milliseconds / 60000)} minutes` : "Awaiting duration evidence"],
    ["Unique tracks", number.format(summary.tracks), "Distinct provider track IDs"],
    ["Artists", number.format(summary.artists), "Including collaborations"],
    ["Albums", number.format(summary.albums), "Known album IDs"],
    ["Active days", number.format(summary.activeDays), "Days with recorded plays"],
  ];
  return <>
    <div className="music-page-title"><div><h1>Music Stats</h1><p>Listening history, favorites, and patterns over time.</p></div><span className="music-access-label">Private local preview</span></div>
    <div className="music-status-line"><span className={`music-status-dot${stale || snapshot?.collectionError ? " is-stale" : ""}`} />
      <span>{snapshot ? snapshot.lastCollection ? `${stale ? "Collection delayed" : "Last collected"} · ${stamp(snapshot.lastCollection)} ET` : "Waiting for first collection" : "Loading saved listening data…"}</span>
      <span className="music-status-separator">/</span><span>Every 10 minutes</span>
      <button className="music-refresh" onClick={refresh} disabled={refreshing} aria-label="Refresh saved statistics"><ArrowClockwise size={16} />{refreshing ? "Refreshing…" : "Refresh"}</button>
    </div>
    {error && <div className="music-message" role="alert"><h2>Couldn’t load saved statistics</h2><p>{error}</p><button className="music-button" onClick={refresh} disabled={refreshing}>Try again</button></div>}
    {!snapshot && !error && <div className="music-loading" role="status"><div /><div /><div /><span>Loading Music Stats</span></div>}
    {snapshot && <>
      <section className="music-workspace" aria-label="Listening overview">
        <div className="music-toolbar"><RangeControl label="Summary range" preset={preset} setPreset={setPreset} range={custom.start ? custom : range} setRange={setCustom} year={selectedYear} setYear={setYear} />
          <label className="music-select-label">Source<select value={source} onChange={e => setSource(e.target.value)}><option value="spotify">Spotify</option><option value="apple">Apple Music · staged</option><option value="all">All connected sources</option></select></label>
          <label className="music-select-label">Listening time<select value={mode} onChange={e => setMode(e.target.value as DurationMode)}><option value="estimated">Song-length estimates</option><option value="measured">Measured only</option></select></label>
        </div>
        <div className="music-evidence-note"><strong>{mode === "estimated" ? "Estimated time" : "Measured time"}</strong><p>{mode === "estimated" ? "Recent Spotify history reports song length, not how long you listened. Skips and pauses can make these estimates too high." : "No measured Spotify listening durations are available yet. Recorded-play counts remain available."}</p></div>
        {source === "apple" && <p className="music-source-note">Your Apple archive is preserved and staged. Playback segments are being reconciled before they enter these statistics.</p>}
        {snapshot.truncated && <p className="music-source-note">This preview contains the latest 25,000 saved plays. Earlier records remain stored; lifetime totals here are partial.</p>}
        <div className="music-range-heading"><h2>Overview</h2><span>{prettyDay(range.start)} – {prettyDay(range.end)}, {range.end.slice(0, 4)} · Eastern</span></div>
        <dl className="music-metrics">{metrics.map(([label, value, detail]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><span>{detail}</span></div>)}</dl>
        <div className="music-secondary-metrics">
          <p><strong>{qualified === null ? "—" : number.format(qualified)}</strong> qualified streams <span>At least <input aria-label="Stream qualification threshold in seconds" type="number" min="1" max="3600" value={threshold} onChange={e => setThreshold(Math.max(1, Number(e.target.value)))} /> seconds of measured listening</span></p>
          <p><strong>{timeAvailable ? number.format(summary.milliseconds / 86400000) : "—"}</strong> days of listening<span>{mode === "estimated" ? "Song-length estimate" : "Measured duration"}</span></p>
          <p><strong>{number.format(denominator ? summary.count / denominator : 0)}</strong> plays / day<span>{denominator} {average === "active" ? "active" : "calendar"} days in range</span></p>
          <p><strong>{timeAvailable ? number.format(denominator ? summary.milliseconds / 60000 / denominator : 0) : "—"}</strong> min / day<label className="music-average"><span className="sr-only">Average denominator</span><select aria-label="Average denominator" value={average} onChange={e => setAverage(e.target.value as "calendar" | "active")}><option value="calendar">Calendar days</option><option value="active">Active days</option></select></label></p>
        </div>
      </section>
      <div className="music-chart-layout">
        <section className="music-panel music-history"><div className="music-panel-heading"><h2>Listening activity</h2><div className="music-segments" aria-label="Chart view"><button aria-pressed={!cumulative} onClick={() => setCumulative(false)}>Daily</button><button aria-pressed={cumulative} onClick={() => setCumulative(true)}>Cumulative</button></div></div>
          <label className="music-chart-select">Show<select value={chartMetric} onChange={e => setChartMetric(e.target.value as "plays" | "minutes")}><option value="plays">Recorded plays</option><option value="minutes">{mode === "estimated" ? "Estimated minutes" : "Measured minutes"}</option></select></label>
          <ListeningChart series={series} metric={chartMetric} cumulative={cumulative} timeAvailable={timeAvailable} />
          <p className="music-footnote">Empty dates mean no saved records, not confirmed silence. Playback timestamps determine the day.</p>
        </section>
        <section className="music-panel music-clock-panel"><div className="music-panel-heading"><h2>Listening clock</h2></div><p className="music-subtitle">{mode === "estimated" ? "Estimated minutes" : "Measured minutes"} by hour</p><ListeningClock hours={hours} available={timeAvailable} /><p className="music-footnote">America/New_York · daylight saving aware</p></section>
      </div>
      <div className="music-lower-layout">
        <section className="music-panel music-rankings"><div className="music-panel-heading"><h2>Your top {kind}</h2><label className="music-chart-select">Sort by<select value={sort} onChange={e => setSort(e.target.value as "plays" | "time")}><option value="plays">Recorded plays</option><option value="time">{mode === "estimated" ? "Estimated time" : "Measured time"}</option></select></label></div>
          <div className="music-ranking-toolbar"><div className="music-segments" aria-label="Top list type">{(["tracks", "artists", "albums"] as const).map(type => <button key={type} aria-pressed={kind === type} onClick={() => { setKind(type); setLimit(10); }}>{type[0].toUpperCase() + type.slice(1)}</button>)}</div>
            <RangeControl label="Top-list range" preset={topPreset} setPreset={setTopPreset} range={topCustom.start ? topCustom : topRange} setRange={setTopCustom} year={selectedTopYear} setYear={setTopYear} />
          </div>
          <p className="music-subtitle">{prettyDay(topRange.start)} – {prettyDay(topRange.end)}, {topRange.end.slice(0, 4)} · Independent of overview</p>
          {ranked.length ? <ol className="music-ranked-list">{ranked.slice(0, limit).map((row, index) => <li key={row.id}>
            <span className="music-rank-number">{String(index + 1).padStart(2, "0")}</span>
            {row.artwork ? <div className="music-artwork"><Image unoptimized src={row.artwork} alt={kind === "artists" ? `Album artwork associated with ${row.name}` : ""} loading="lazy" width={48} height={48} referrerPolicy="no-referrer" /></div> : <span className="music-artwork music-artwork-empty" aria-label="Artwork unavailable" />}
            <div className="music-rank-copy">{row.url ? <a href={row.url} target="_blank" rel="noreferrer">{row.name}<ArrowUpRight size={13} /></a> : <strong>{row.name}</strong>}<span>{row.detail}</span></div>
            <div className="music-rank-value"><strong>{sort === "plays" ? number.format(row.count) : mode === "measured" && !snapshot.plays.some(p => p.actualMs !== null) ? "—" : fmtTime(row.milliseconds)}</strong><span>{sort === "plays" ? "plays" : mode === "estimated" ? "estimated" : "measured"}</span></div>
          </li>)}</ol> : <div className="music-empty"><h3>No plays in this range</h3><p>Try Lifetime or another date range. Apple’s staged archive isn’t included yet.</p></div>}
          {ranked.length > limit && <button className="music-button music-show-more" onClick={() => setLimit(v => v + 10)}>Show 10 more</button>}
          <p className="music-footnote">{kind === "artists" ? "Artists use album artwork as a fallback. Collaborations credit each artist, so artist totals overlap." : "Source: saved Spotify playback history. Track versions retain their Spotify identities."}</p>
        </section>
        <aside className="music-side-stack">
          <section className="music-panel"><div className="music-panel-heading"><h2>Listening patterns</h2></div><label className="music-chart-select">Group by<select value={grouping} onChange={e => setGrouping(e.target.value as typeof grouping)}><option value="weekday">Weekday</option><option value="month">Month</option><option value="year">Year</option></select></label>
            <div className="music-breakdown">{groups.map(g => <div key={g.label}><span>{g.label}</span><div><i style={{ width: `${g.minutes / groupMax * 100}%` }} /></div><strong>{timeAvailable ? `${number.format(g.minutes)}m` : "—"}</strong></div>)}</div>
            <p className="music-footnote">{mode === "estimated" ? "Estimated minutes" : "Measured minutes"} · Summary range</p>
          </section>
          <section className="music-panel music-coverage"><h2>Data coverage</h2><dl><div><dt>Spotify collection</dt><dd>{snapshot.collectionStartedAt ? `Started ${prettyDay(dayKey(snapshot.collectionStartedAt))}` : "Awaiting first run"}</dd></div><div><dt>Extended Spotify history</dt><dd>Requested · waiting for export</dd></div><div><dt>Apple Music archive</dt><dd>Preserved · reconciliation pending</dd></div><div><dt>Public sharing</dt><dd>Off · private local preview</dd></div></dl><p className="music-footnote">Lifetime means all imported and collected records available here. It does not yet cover your full listening history.</p></section>
          <section className="music-comparison"><h2>Period comparison</h2><p>{prior.count > 0 && summary.count > 0 ? `${number.format((summary.count - prior.count) / prior.count * 100)}% change in recorded plays` : "Not enough recorded history to compare yet."}</p><span>Compared with the preceding {summary.days} days. Coverage may differ between periods.</span></section>
        </aside>
      </div>
    </>}
  </>;
}
