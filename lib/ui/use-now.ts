"use client";

import { useSyncExternalStore } from "react";

/*
 * A shared, minute-resolution clock. Keeps render functions pure (no Date.now() in render)
 * and returns 0 during server prerendering, so time-dependent UI only appears on the client.
 */

let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (now === 0) now = Date.now();
  return now;
}

function getServerSnapshot() {
  return 0;
}

/** Current time in ms (updates every minute). 0 on the server. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
