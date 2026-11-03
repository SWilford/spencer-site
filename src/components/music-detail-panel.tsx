"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { SpotifyLogo } from "@phosphor-icons/react/dist/csr/SpotifyLogo";
import type { MusicRanking, PublicMusicDetail } from "@/lib/music-entity-details";
import type { RankingKind } from "@/lib/music-stats";
import { Clock, LineChart } from "./music-charts";
import { MusicButton, MusicLink } from "./music-interactions";

export type DetailSelection = { kind: RankingKind; row: MusicRanking };
const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const day = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
const kindName = { artists: "Artist", tracks: "Track", albums: "Album" };

export function MusicDetailPanel({ selection, timeframe, onSelect, onClose }: { selection: DetailSelection; timeframe: string; onSelect(value: DetailSelection): void; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [resource, setResource] = useState<{ key: string; data?: PublicMusicDetail; error?: string }>({ key: "" });
  const [retry, setRetry] = useState(0);
  const params = new URLSearchParams(timeframe);
  params.set("entityKind", selection.kind); params.set("entityKey", selection.row.key);
  const key = params.toString();
  const data = resource.key === key ? resource.data : undefined;
  const error = resource.key === key ? resource.error : undefined;
  const entity = data?.entity ?? selection.row;
  useEffect(() => { const modal = dialog.current!; modal.showModal(); return () => modal.close(); }, []);
  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api/music-stats?${key}`, { signal: abort.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t load these stats.");
      setResource({ key, data: result }); dialog.current?.scrollTo({ top: 0, behavior: "instant" });
    }).catch(error => { if (error.name !== "AbortError") setResource({ key, error: error.message }); });
    return () => abort.abort();
  }, [key, retry]);
  const related: RankingKind[] = selection.kind === "artists" ? ["tracks", "albums"] : selection.kind === "albums" ? ["tracks", "artists"] : ["artists", "albums"];
  return <dialog ref={dialog} className="music-detail-dialog" aria-labelledby="music-detail-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="music-detail-inner">
      <div className="music-detail-toolbar"><span>{kindName[selection.kind]} stats</span><MusicButton className="stats-control" aria-label="Close listening stats" onClick={onClose}><X size={21}/></MusicButton></div>
      <header className="music-detail-header"><div className="music-detail-art">{entity.artwork ? <Image src={entity.artwork} alt={entity.name} width={240} height={240} unoptimized/> : <span>{entity.name.slice(0, 1)}</span>}</div>
        <div><h2 id="music-detail-title">{entity.name}</h2>{selection.kind !== "artists" && <p>{entity.detail}</p>}{data && <p className="music-detail-range">{day(data.stats.range.start)} – {day(data.stats.range.end)}</p>}{entity.url && <MusicLink className="music-detail-spotify" href={entity.url} target="_blank" rel="noreferrer"><SpotifyLogo size={18}/> Open in Spotify</MusicLink>}</div></header>
      {error ? <div className="music-detail-status" role="alert"><p>{error}</p><MusicButton className="stats-control" onClick={() => setRetry(value => value + 1)}>Try again</MusicButton></div> : !data ? <div className="music-detail-status" role="status"><span className="music-detail-loader"/> Loading listening stats…</div> : <>
        <dl className="music-detail-totals">{[["Streams", data.stats.summary.streams], ["Minutes", data.stats.summary.milliseconds / 60000], ["Hours", data.stats.summary.milliseconds / 3600000], ["Active days", data.stats.summary.activeDays]].map(([label, value]) => <div key={label}><dd>{n.format(Number(value))}</dd><dt>{label}</dt></div>)}</dl>
        <div className="music-detail-facts"><p><span>Lifetime</span><strong>{n.format(data.lifetime.streams)} streams · {n.format(data.lifetime.milliseconds / 3600000)} hours</strong></p>{selection.kind !== "tracks" && <p><span>In this period</span><strong>{n.format(data.stats.summary.tracks)} tracks · {n.format(data.stats.summary.albums)} albums</strong></p>}<p><span>First / last day in this period</span><strong>{data.firstDay ? day(data.firstDay) : "No listening"}{data.lastDay && data.lastDay !== data.firstDay ? ` / ${day(data.lastDay)}` : ""}</strong></p></div>
        <section className="stats-section music-detail-daily"><h3>Listening over time</h3><LineChart daily={data.stats.daily} cumulative={false} hours={data.stats.hours}/></section>
        <section className="stats-section"><h3>Time of day</h3><div className="stats-clocks music-detail-clocks"><div><Clock hours={data.stats.hours} minutes={false}/><strong>streams</strong></div><div><Clock hours={data.stats.hours} minutes/><strong>minutes</strong></div></div></section>
        <div className="music-detail-related">{related.map(kind => <section key={kind}><h3>{kind === "tracks" ? "Top tracks" : kind === "albums" ? "Albums" : "Artists"}</h3>{data.stats.rankings[kind].slice(0, 8).map((row, index) => <button className="music-related-row" key={row.key} onClick={() => onSelect({ kind, row })}><span className="music-related-number">{index + 1}</span>{row.artwork ? <Image src={row.artwork} alt="" width={48} height={48} unoptimized loading="lazy"/> : <span className="music-related-placeholder">{row.name.slice(0, 1)}</span>}<span><b>{row.name}</b><small>{n.format(row.milliseconds / 60000)} min · {n.format(row.count)} streams</small></span></button>)}{!data.stats.rankings[kind].length && <p className="stats-empty">No listening in this period.</p>}</section>)}</div>
      </>}
    </div>
  </dialog>;
}
