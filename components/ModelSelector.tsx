import React from 'react';
import type { ModelAvailability, ModelChoice } from '../types';
import { MODEL_CHOICES, MODEL_LABELS } from '../models';

interface ModelSelectorProps {
  selected: ModelChoice;
  onChange: (model: ModelChoice) => void;
  availability: Partial<Record<ModelChoice, ModelAvailability>>;
  checking: boolean;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selected, onChange, availability, checking, disabled }) => (
  <div className="space-y-3">
    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
      AI Model
    </label>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {MODEL_CHOICES.map(model => (
        <button
          key={model}
          type="button"
          disabled={disabled}
          aria-pressed={selected === model}
          onClick={() => onChange(model)}
          className={`py-3 px-2 rounded-lg font-bold transition-all duration-200 border-2 text-xs
            ${selected === model
              ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {MODEL_LABELS[model]}
        </button>
      ))}
    </div>
    <p className="text-[10px] text-slate-500 italic" aria-live="polite">
      {checking ? 'Checking available models on your gateway...' :
        availability[selected] === 'available' ? 'Selected model listed by your gateway.' :
        availability[selected] === 'not-listed' ? 'Selected model not listed by gateway. Check its model ID in configuration.' :
        'Gateway availability not verified yet. The selected model will be checked when generating.'}
    </p>
  </div>
);

export default ModelSelector;
