
import React from 'react';
import { MarkType } from '../types';

interface MarksSelectorProps {
  selected: MarkType;
  onChange: (marks: MarkType) => void;
  disabled?: boolean;
}

const MarksSelector: React.FC<MarksSelectorProps> = ({ selected, onChange, disabled }) => {
  const marks: MarkType[] = [1, 2, 3, 4];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
        Allotted Marks
      </label>
      <div className="grid grid-cols-4 gap-2">
        {marks.map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m)}
            className={`
              py-3 px-4 rounded-lg font-bold transition-all duration-200 border-2
              ${selected === m 
                ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-md transform scale-105' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 italic">
        * 1 mark: one-line highlighted answer · 2 marks: ~30 words · 3 marks: ~100 words · 4 marks: ~200 words.
      </p>
    </div>
  );
};

export default MarksSelector;
