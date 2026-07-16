import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';

// How often to poll (ms). When server is down, poll faster to detect recovery.
const POLL_INTERVAL_UP   = 30_000;
const POLL_INTERVAL_DOWN = 10_000;
const TIMEOUT_MS         = 6_000;

/**
 * Tracks whether the backend is reachable.
 *
 * Returns:
 *   serverStatus — 'checking' | 'up' | 'down' | 'waking'
 *   isDown       — boolean shorthand
 *   isWaking     — true when first request after a down period is in-flight
 *   lastChecked  — Date | null
 *   recheck      — call to trigger an immediate check
 */
export default function useServerStatus() {
  const [status, setStatus]           = useState('checking'); // checking | up | down | waking
  const [lastChecked, setLastChecked] = useState(null);
  const downSince                     = useRef(null);
  const intervalRef                   = useRef(null);

  const check = useCallback(async (isRecoveryAttempt = false) => {
    if (isRecoveryAttempt && status === 'down') {
      setStatus('waking');
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(`${API_BASE}/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (res.ok) {
        downSince.current = null;
        setStatus('up');
      } else {
        if (!downSince.current) downSince.current = new Date();
        setStatus('down');
      }
    } catch {
      if (!downSince.current) downSince.current = new Date();
      setStatus('down');
    }

    setLastChecked(new Date());
  }, [status]);

  // Start polling — faster interval when server is down
  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = status === 'down' ? POLL_INTERVAL_DOWN : POLL_INTERVAL_UP;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => check(), interval);
    return () => clearInterval(intervalRef.current);
  }, [status, check]);

  return {
    serverStatus: status,
    isDown:       status === 'down',
    isWaking:     status === 'waking',
    isChecking:   status === 'checking',
    lastChecked,
    recheck:      () => check(true),
  };
}
