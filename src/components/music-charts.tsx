"use client";
import { useId, useState } from "react";
import { musicChartSeries, hourLabel } from "@/lib/music-chart-series";
import type { PublicMusicStats } from "@/lib/music-public";
const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const dateLabel = (day: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) => new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
export function Clock({ hours, minutes }: { hours: PublicMusicStats["hours"]; minutes: boolean }) {

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



export function LineChart({ daily, cumulative, hours }: { daily: PublicMusicStats["daily"]; cumulative: boolean; hours?: PublicMusicStats["hours"] }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const hourly = !!hours && daily.length === 1;
  const rows = musicChartSeries(daily, cumulative, hours);
  const maximum = Math.max(1, ...rows.flatMap(row => [row.count, row.minutes]));
  const x = (index: number) => 62 + (rows[index]?.position ?? 0) * 660;
  const y = (value: number) => 208 - value / maximum * 173;
  const line = (field: "count" | "minutes") => rows.map((row, index) => `${index ? "L" : "M"}${x(index)},${y(row[field])}`).join(" ");
  const selected = hover === null ? null : rows[hover];
  const heading = cumulative ? "Cumulative" : "Daily";
  return <div className="stats-chart-wrap">
    {selected && <div className="stats-tooltip chart-tooltip" role="tooltip" id={`${id}-value`} style={{ left: `${Math.max(26, Math.min(74, x(hover!) / 760 * 100))}%` }}><b>{selected.day.length === 7 ? selected.day : dateLabel(selected.day)}</b>{selected.period && <span>{selected.period}</span>}<span>{n.format(selected.count)} streams</span><span>{n.format(selected.minutes)} min · {decimal.format(selected.minutes / 60)} hr</span></div>}
    <svg viewBox="0 0 760 250" className="stats-line-chart" role="group" tabIndex={0} aria-label={`${heading} streams and minutes${hourly ? " by hour" : ""}. Use arrow keys to inspect ${hourly ? "hours" : "dates"}.`} aria-describedby={selected ? `${id}-value` : undefined}
      onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const position = ((event.clientX - bounds.left) / bounds.width * 760 - 62) / 660; let nearest = 0; for (let index = 1; index < rows.length; index++) if (Math.abs(rows[index].position - position) < Math.abs(rows[nearest].position - position)) nearest = index; setHover(nearest); }}
      onPointerLeave={() => setHover(null)} onFocus={() => setHover(0)} onBlur={() => setHover(null)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) { event.preventDefault(); setHover(event.key === "Escape" ? null : event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : Math.max(0, Math.min(rows.length - 1, (hover ?? 0) + (event.key === "ArrowRight" ? 1 : -1)))); } }}><title id={id}>{heading} streams and minutes{hourly ? " by hour" : ""}</title>
      {[0, .5, 1].map(value => <g key={value}><line x1="62" x2="722" y1={y(maximum * value)} y2={y(maximum * value)} className="stats-chart-rule" /><text x="48" y={y(maximum * value) + 4} textAnchor="end">{n.format(maximum * value)}</text></g>)}
      <path d={line("minutes")} className="stats-line minutes" /><path d={line("count")} className="stats-line streams" />
      {rows.length === 1 && <><circle cx={x(0)} cy={y(rows[0].minutes)} r="4" className="stats-dot minutes" /><circle cx={x(0)} cy={y(rows[0].count)} r="4" className="stats-dot streams" /></>}
      {selected && <g className="stats-crosshair"><line x1={x(hover!)} x2={x(hover!)} y1="14" y2="208" /><circle cx={x(hover!)} cy={y(selected.count)} r="5" className="stats-dot streams" /><circle cx={x(hover!)} cy={y(selected.minutes)} r="5" className="stats-dot minutes" /></g>}
      {hourly ? [0, 6, 12, 18, 24].map(hour => <text key={hour} x={62 + hour / 24 * 660} y="241" textAnchor={hour === 0 ? "start" : hour === 24 ? "end" : "middle"}>{hourLabel(hour)}</text>) : rows.length > 0 && <><text x="62" y="241">{rows[0].day.length === 7 ? rows[0].day : dateLabel(rows[0].day, { month: "short", day: "numeric" })}</text><text x="722" y="241" textAnchor="end">{rows.at(-1)!.day.length === 7 ? rows.at(-1)!.day : dateLabel(rows.at(-1)!.day, { month: "short", day: "numeric" })}</text></>}
    </svg>
    <div className="stats-chart-legend"><span><i className="streams" />streams</span><span title="Time may use song-length estimates"><i className="minutes" />minutes</span></div>
    <span className="sr-only" aria-live="polite">{selected ? `${selected.day} ${selected.period ?? ""}: ${n.format(selected.count)} streams, ${n.format(selected.minutes)} minutes` : `Use arrow keys, Home, or End to inspect chart ${hourly ? "hours" : "dates"}.`}</span>
  </div>;
}


