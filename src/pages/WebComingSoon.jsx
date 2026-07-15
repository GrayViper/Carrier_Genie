import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function WebComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080710] text-white">
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative w-full rounded-[32px] border border-white/10 bg-slate-950/90 px-8 py-12 shadow-2xl shadow-indigo-900/20 backdrop-blur-xl sm:px-12">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-t-3xl"></div>
          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl shadow-xl shadow-indigo-500/25 animate-pulse">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Web Update Coming Soon</h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
              Future update is on the way by dev <strong>GrayViper</strong> aka <strong>Krishna</strong>. The web experience is being built with extra polish, and we’ll redirect you there as soon as things are ready.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Back to Home
              </button>
              <button
                onClick={() => window.location.href = 'https://www.example.com'}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Visit the Web hub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
