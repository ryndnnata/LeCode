"use client";

import { usePathname } from "next/navigation";
import { LenDock } from "./LenDock";
import { useLenState } from "./len-context";


export function LenLauncher() {
  const pathname = usePathname() ?? "";
  const { question, context } = useLenState();

  if (pathname.startsWith("/studio")) return null;

  if (/^\/game\/[^/]+\/arena\/?$/.test(pathname)) return null;

  // Di halaman pelajaran, panel Len permanen sudah tampil pada layar xl.
  const lessonDetail = /^\/belajar\/[^/]+/.test(pathname);

  return (
    <LenDock
      key={pathname}
      question={question ?? undefined}
      context={context}
      hideAtXl={lessonDetail}
    />
  );
}
