"use client";

import { useLayoutEffect } from "react";

/**
 * Locks body scroll while the preview is open.
 *
 * `scrollbar-gutter: stable` on `<html>` (set in globals.css) reserves
 * the scrollbar space permanently, so toggling `overflow: hidden` never
 * changes the layout width.  Zero shift, zero flicker, zero bounce.
 */
export function useScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;

    html.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevOverflow || "";
    };
  }, [active]);
}
