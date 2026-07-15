import React, { useState } from 'react';
import { Wifi, WifiOff, Loader2, X, RefreshCw } from 'lucide-react';
import { SERVER_STATUS } from '../hooks/useServerStatus';

export default function ServerStatusBanner({ status, retry }) {
  const [dismissed, setDismissed] = useState(false);

  // Only show when there's a problem, and not if user dismissed
  if (status === SERVER_STATUS.UP || status === SERVER_STATUS.UNKNOWN || dismissed) {
    return null;
  }

  const isWaking = status === SERVER_STATUS.WAKING;

  return (
    <div
      className={`relative z-50 w-full px-4 py-2.5 text-sm flex items-center justify-between gap-4 ${
        isWaking
          ? 'bg-amber-500/10 border-b border-amber-500/20 text-amber-200'
          : 'bg-rose-500/10 border-b border-rose-500/20 text-rose-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isWaking ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0 text-rose-400" />
        )}
        <span className="text-xs font-medium truncate">
          {isWaking
            ? 'Server is waking up — this takes up to 60 seconds on the free tier. Features will be available shortly.'
            : 'Server appears to be offline. You can still browse jobs, but login and applications require the server.'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={retry}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border transition ${
            isWaking
              ? 'border-amber-400/30 text-amber-300 hover:bg-amber-400/10'
              : 'border-rose-400/30 text-rose-300 hover:bg-rose-400/10'
          }`}
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white transition"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
