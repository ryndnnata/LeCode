"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";


export function SiteFooter() {
  const pathname = usePathname() ?? "";
  if (/^\/game\/[^/]+\/arena\/?$/.test(pathname)) return null;
  return <Footer />;
}
