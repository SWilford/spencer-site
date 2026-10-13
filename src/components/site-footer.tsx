"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname=usePathname();
  if(pathname==="/") return null;
  return <footer className="site-footer"><span>Spencer Wilford</span><Link href="/contact">Contact</Link></footer>;
}
