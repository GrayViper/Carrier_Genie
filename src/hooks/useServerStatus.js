import { useState, useEffect, useCallback, useRef } from 'react';

export const SERVER_STATUS = {
  UNKNOWN: 'unknown',
  UP: 'up',
  WAKING: 'waking',   // slow response — Render free tier spinning up
  DOWN: 'down',
};

const HEALTH_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:5178'}/health`;
const FAST_TIMEOUT = 4000;   // if no response in 4s → waking
const DOWN_TIMEOUT = 15000;  // if no response in 15s → down
const POLL_INTERVAL = 30000; // re-check every 30s

async function pingServer() {
  const controller = new AbortController();
  const downTimer = setTimeout(() => controller.abort(), DOWN_TIMEOUT);

  const wakingTimer = setTimeout(() => {
    // Don't abort — let the request continue, just mark as waking
  }, FAST_TIMEOUT);

  const start = Date.now();
  try {
    const res = await fetch(HEALTH_URL, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(downTimer);
    clearTimeout(wakingTimer);
    const elapsed = Date.now() - start;
    if (res.ok) {
      return elapsed > FAST_TIMEOUT ? SERVER_STATUS.WAKING : SERVER_STATUS.UP;
    }
    return SERVER_STATUS.DOWN;
  } catch {
    clearTimeout(downTimer);
    clearTimeout(wakingTimer);
    return SERVER_STATUS.DOWN;
  }
}

export function useServerStatus() {
  const [status, setStatus] = useState(SERVER_STATUS.UNKNOWN);
  const [lastChecked, setLastChecked] = useState(null);
  const wakingTimerRef = useRef(null);

  const check = useCallback(async () => {
    // Immediately mark as waking if unknown or previously down
    // so the banner shows while we wait
    setStatus(prev =>
      prev === SERVER_STATUS.UP ? SERVER_STATUS.UP : SERVER_STATUS.WAKING
    );

    // Set a fast waking indicator after 4s if no response yet
    wakingTimerRef.current = setTimeout(() => {
      setStatus(prev =>
        prev !== SERVER_STATUS.UP ? SERVER_STATUS.WAKING : prev
      );
    }, FAST_TIMEOUT);

    const result = await pingServer();
    clearTimeout(wakingTimerRef.current);
    setStatus(result);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      clearTimeout(wakingTimerRef.current);
    };
  }, [check]);

  return { status, lastChecked, retry: check };
}
