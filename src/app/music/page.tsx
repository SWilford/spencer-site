import { MusicDashboard } from "@/components/music-dashboard";
import "./music-stats.css";

export const metadata = { title: "Music Stats · Spencer Wilford", robots: { index: false, follow: false } };
export default function MusicPage() {
  return <main id="main" className="page-content interior-page music-page"><MusicDashboard /></main>;
}
