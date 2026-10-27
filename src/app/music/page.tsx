import { pageMetadata } from "@/lib/site-metadata";
import { MusicDashboard } from "@/components/music-stats-view";
import "./music-simplified.css";
export const metadata = pageMetadata('Music Stats', 'Listening statistics, top tracks, artists, and albums from Spencer’s Spotify and imported Apple Music history.', "/music", true);
export default function MusicPage() {
  return <main id="main" className="page-content interior-page music-page"><MusicDashboard /></main>;
}
