"use client";

import { ViewTransition, type ReactNode } from "react";

export function PageMotion({children}:{children:ReactNode}) {
  return <ViewTransition name="page-content" default="none" update="door" enter="door" exit="door">
    <div className="page-stage">{children}</div>
  </ViewTransition>;
}
