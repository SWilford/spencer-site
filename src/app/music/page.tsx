import { MusicDashboard } from "@/components/music-stats-view";
import "./music-simplified.css";

export const metadata = { title: "Music Stats · Spencer Wilford" };
export default function MusicPage() {
  return <main id="main" className="page-content interior-page music-page"><MusicDashboard /></main>;
}
