'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function Loader({ fullPage = false, message = 'Loading premium experience...' }) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      {/* Outer Ring & Center Icon */}
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        {/* Ring 1: Glow Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-secondary to-accent opacity-25 blur-md animate-pulse"></div>
        
        {/* Ring 2: Spinning Gradient Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-secondary border-r-accent animate-spin"></div>
        
        {/* Ring 3: Inner pulse */}
        <div className="absolute w-16 h-16 rounded-full bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-800">
          <ShoppingBag className="w-8 h-8 text-secondary animate-bounce" />
        </div>
      </div>

      {/* Brand Name with pulsing gradient */}
      <h3 className="text-2xl font-bold tracking-wider font-sans bg-gradient-to-r from-secondary via-accent to-secondary bg-clip-text text-transparent mb-2 animate-gradient-shimmer">
        Daykart
      </h3>

      {/* Progress Message */}
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs animate-pulse">
        {message}
      </p>

      {/* Subtle indicator bar */}
      <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-gradient-to-r from-secondary to-accent rounded-full animate-loading-bar-progress"></div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="glass rounded-3xl shadow-2xl p-8 max-w-sm mx-4 border border-slate-200/50 dark:border-slate-800/50">
          {loaderContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-[250px]">
      {loaderContent}
    </div>
  );
}
