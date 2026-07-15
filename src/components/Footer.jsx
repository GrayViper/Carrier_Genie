import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Share2, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/80 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                G
              </div>
              <span className="font-display text-lg font-semibold text-white">CareerGenie</span>
            </div>
            <p className="text-xs text-gray-500">© 2026 CareerGenie Platform. Smart resume analysis, job matching, and recruiter workflows.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 md:justify-end">
            <Link to="#" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link to="#" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link to="#" className="transition-colors hover:text-white">Help Center</Link>
            <Link to="#" className="transition-colors hover:text-white">Contact</Link>
          </div>

          <div className="flex items-center justify-center gap-2 md:justify-end">
            <button 
              className="rounded-full border border-white/10 p-2 text-gray-400 transition-colors hover:border-white/20 hover:text-white"
              aria-label="Language selection"
              onClick={() => alert('Language selection is mocked. English is currently default.')}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button 
              className="rounded-full border border-white/10 p-2 text-gray-400 transition-colors hover:border-white/20 hover:text-white"
              aria-label="Share platform"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.origin);
                  alert('Share link copied to clipboard!');
                } else {
                  alert('Mock sharing triggered!');
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
              <Sparkles className="h-3 w-3" />
              AI ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
