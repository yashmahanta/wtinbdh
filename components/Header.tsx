
import React from 'react';
import type { ModelChoice } from '../types';
import { MODEL_LABELS } from '../models';

const Header: React.FC<{ activeModel: ModelChoice }> = ({ activeModel }) => {
  return (
    <header className="bg-slate-950 text-white py-8 px-4 border-b border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
      <div className="max-w-5xl mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-5">
          <div className="bg-amber-500 p-3 rounded-2xl shadow-xl shadow-amber-500/20 rotate-3 transition-transform hover:rotate-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1">BSc Math Assistant</h1>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">Academic Division</span>
              <span className="h-1 w-1 bg-slate-700 rounded-full"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">V3.1 · {MODEL_LABELS[activeModel]}</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{MODEL_LABELS[activeModel]} Selected</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Self-Hosted Gateway</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
