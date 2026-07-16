import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, RefreshCw, X, Wifi } from 'lucide-react';

/**
 * Sticky banner that appears when the backend is unreachable.
 * Dismissible per-session. Auto-hides when server comes back up.
 */
export default function ServerStatusBanner({ serverStatus, isDown, isWaking, lastChecked, recheck }) {
  const [dismissed, setDismissed] = useState(false);
  const [justRecovered, setJustRecovered] = useState(false);

  // When server comes back up, briefly show a "back online" message
  useEffect(() => {
    if (serverStatus === 'up' && dismissed) {
      setDismissed(false);
    }
    if (serverStatus === 'up') {
      setJustRecovered(true);
      const t = setTimeout(() => setJustRecovered(false), 4000);
      return () => clearTimeout(t);
    }
  }, [serverStatus]);

  // Nothing to show when up and not just recovered
  if (serverStatus === 'up' && !justRecovered) return null;
  if (serverStatus === 'checking') return null;
  if (dismissed && !justRecovered) return null;

  if (justRecovered) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 shadow-xl backdrop-blur-md animate-fade-up">
        <Wifi className="h-4 w-4 shrink-0" />
        <span className="font-semibold">Back online</span>
        <span className="text-emerald-400/70 text-xs">Server reconnected</span>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-30 w-full">
      <div className={`border-b px-4 py-2.5 text-sm backdrop-blur-md flex items-center justify-between gap-4 ${
        isWaking
          ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
          : 'border-rose-500/20 bg-rose-500/10 text-rose-200'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {isWaking ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-300" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" />
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            {isWaking ? (
              <>
                <span className="font-semibold text-amber-200">Server waking up</span>
                <span className="text-amber-300/70 text-xs">
                  Render's free tier spins down after inactivity — this takes up to 60 seconds.
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold text-rose-200">Backend unreachable</span>
                <span className="text-rose-300/70 text-xs">
                  Some features may be unavailable. Saved data still works offline.
                  {lastChecked && (
                    <span className="ml-1 opacity-60">
                      Last checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isWaking && (
            <button
              type="button"
              onClick={recheck}
              className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/20"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-full p-1 text-current opacity-50 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
