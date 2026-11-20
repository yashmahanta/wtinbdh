
import React from 'react';
import { MathResult } from '../types';

interface ResultViewProps {
  result: MathResult;
  marks: number;
}

const ResultView: React.FC<ResultViewProps> = ({ result, marks }) => {
  const openInOverleaf = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.overleaf.com/docs';
    form.target = '_blank';

    const snipInput = document.createElement('input');
    snipInput.type = 'hidden';
    snipInput.name = 'snip';
    snipInput.value = result.latexCode;

    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.name = 'snip_name';
    nameInput.value = `BSc_Thermal_Proof_Q${result.startQNum}.tex`;

    form.appendChild(snipInput);
    form.appendChild(nameInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.latexCode);
    alert("LaTeX code copied to academic clipboard.");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="bg-slate-900/50 px-6 py-5 flex flex-wrap gap-4 justify-between items-center border-b border-white/5 backdrop-blur-sm">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex space-x-1.5 mr-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></div>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] font-bold">Consolidated_Proof_Output</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">Tight Crop Mode</span>
              <span className="text-[9px] text-amber-500 font-black uppercase tracking-tighter">{marks} Marks Strategy</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={copyToClipboard}
              className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] px-4 py-2.5 rounded-xl font-black transition-all uppercase tracking-widest border border-white/5"
            >
              Copy
            </button>
            <button 
              onClick={openInOverleaf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-5 py-2.5 rounded-xl font-black flex items-center space-x-2 transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Overleaf</span>
            </button>
          </div>
        </div>
        
        {result.question && (
          <div className="bg-slate-900/30 px-8 py-5 border-b border-white/5">
             <div className="flex items-center space-x-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identified Question Text</h4>
             </div>
             <div className="pl-5 border-l-2 border-amber-500/30">
                <p className="text-slate-300 text-sm font-serif italic leading-relaxed whitespace-pre-wrap">
                  "{result.question}"
                </p>
             </div>
          </div>
        )}

        <div className="p-8 bg-black/40 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <pre className="text-emerald-400/90 font-mono text-[13px] leading-relaxed selection:bg-emerald-500/30">
            {result.latexCode || "% ERROR: Empty syntax stream received."}
          </pre>
        </div>
        
        <div className="bg-slate-900 px-8 py-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Optimized for 57mm Thermal Dispatch (Variable Height)
          </p>
          <div className="flex items-center space-x-2">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Syntax: Standalone class applied</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center space-x-4">
        <div className="bg-amber-100 p-2 rounded-lg shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0116 0z" />
          </svg>
        </div>
        <p className="text-[11px] text-amber-800 font-medium leading-normal">
          <span className="font-black uppercase tracking-tighter">PDF Optimization:</span> This LaTeX code uses the <code className="bg-amber-100 px-1 rounded">standalone</code> class, ensuring the generated PDF is exactly the size of the math content with no trailing blank space.
        </p>
      </div>
    </div>
  );
};

export default ResultView;
