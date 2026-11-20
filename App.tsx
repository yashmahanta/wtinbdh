
import React, { useEffect, useState } from 'react';
import { AppState, MarkType, ModelChoice, ModelAvailability } from './types';
import { MODEL_LABELS } from './models';
import ModelSelector from './components/ModelSelector';
import Header from './components/Header';
import MarksSelector from './components/MarksSelector';
import ImageUpload from './components/ImageUpload';
import ResultView from './components/ResultView';
import ImageCropper from './components/ImageCropper';
import { analyzeMathQuestion } from './geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    images: [],
    marks: 4,
    loading: false,
    result: null,
    error: null,
    statusMessage: "Awaiting source material.",
    isCropping: false,
    pendingImage: null
  });

  const [selectedModel, setSelectedModel] = useState<ModelChoice>('gemini');
  const [availability, setAvailability] = useState<Partial<Record<ModelChoice, ModelAvailability>>>({});
  const [checkingModels, setCheckingModels] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/generate', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Model discovery unavailable');
        return response.json();
      })
      .then(data => setAvailability(data.availability ?? {}))
      .catch(() => { if (!controller.signal.aborted) setAvailability({}); })
      .finally(() => { if (!controller.signal.aborted) setCheckingModels(false); });
    return () => controller.abort();
  }, []);

  const handleModelChange = (model: ModelChoice) => {
    setSelectedModel(model);
    setState(prev => ({
      ...prev,
      result: null,
      error: null,
      statusMessage: `${MODEL_LABELS[model]} selected.`,
    }));
  };

  const handleImageSelect = (base64: string) => {
    setState(prev => ({ 
      ...prev, 
      pendingImage: base64,
      isCropping: true,
      error: null
    }));
  };

  const handleCropComplete = (croppedBase64: string) => {
    setState(prev => ({
      ...prev,
      images: [...prev.images, croppedBase64],
      isCropping: false,
      pendingImage: null,
      statusMessage: `Fragment #${prev.images.length + 1} captured.`
    }));
  };

  const removeImage = (index: number) => {
    setState(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const clearAllImages = () => {
    setState(prev => ({ ...prev, images: [], result: null, statusMessage: "Workspace cleared.", error: null }));
  };

  const handleMarksChange = (marks: MarkType) => {
    setState(prev => ({ 
      ...prev, 
      marks,
      statusMessage: `Complexity set to ${marks} marks.`
    }));
  };

  const handleAnalyze = async () => {
    if (state.images.length === 0) {
      setState(prev => ({ ...prev, error: "Upload at least one question fragment." }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      result: null,
      statusMessage: `Activating ${MODEL_LABELS[selectedModel]}...`
    }));

    const academicMessages = [
      `Accessing ${MODEL_LABELS[selectedModel]}...`,
      "Parsing visual symbolic data...",
      "Assembling axiomatic proof...",
      "Compiling standalone LaTeX...",
      "Optimizing thermal margins..."
    ];

    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % academicMessages.length;
      setState(prev => ({ ...prev, statusMessage: academicMessages[msgIndex] }));
    }, 1200);

    try {
      const result = await analyzeMathQuestion(state.images, state.marks, selectedModel);
      setState(prev => ({ 
        ...prev, 
        result, 
        loading: false,
        statusMessage: "Derivation complete."
      }));
    } catch (err: any) {
      console.error("Analysis Error:", err);
      let errorMessage = err?.message || "Academic verification failed.";
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage,
        statusMessage: "Engine stall."
      }));
    } finally {
      clearInterval(interval);
    }
  };

  const reset = () => {
    setState({
      images: [],
      marks: 4,
      loading: false,
      result: null,
      error: null,
      statusMessage: "Environment reset.",
      isCropping: false,
      pendingImage: null
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe]">
      <Header activeModel={selectedModel} />
      
      {state.isCropping && state.pendingImage && (
        <ImageCropper 
          key={state.pendingImage.slice(-20)}
          imageSrc={state.pendingImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setState(prev => ({ ...prev, isCropping: false, pendingImage: null }))} 
        />
      )}

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 space-y-6 sticky top-8">
              <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">Inference Engine</h2>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{MODEL_LABELS[selectedModel]} Selected</span>
                  </div>
                </div>
                <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                  {availability[selectedModel] === "available" ? "Available" : availability[selectedModel] === "not-listed" ? "Unlisted" : "Selected"}
                </div>
              </div>
              
              <ImageUpload 
                onImageSelect={handleImageSelect} 
                onRemoveImage={removeImage}
                onClearAll={clearAllImages}
                images={state.images}
                disabled={state.loading} 
              />
              
              <ModelSelector
                selected={selectedModel}
                onChange={handleModelChange}
                availability={availability}
                checking={checkingModels}
                disabled={state.loading}
              />

              <MarksSelector 
                selected={state.marks} 
                onChange={handleMarksChange} 
                disabled={state.loading} 
              />

              <div className="pt-2 flex flex-col space-y-3">
                <button
                  onClick={handleAnalyze}
                  disabled={state.loading || state.images.length === 0}
                  className={`
                    group relative overflow-hidden w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl uppercase tracking-tighter text-sm
                    ${state.loading || state.images.length === 0 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                      : 'bg-slate-900 hover:bg-black active:scale-[0.98] hover:shadow-emerald-500/10'}
                  `}
                >
                  {state.loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Synthesizing...
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <span>Generate Proof</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </button>
                
                {state.images.length > 0 && (
                  <button 
                    onClick={reset}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all text-[10px] uppercase tracking-[0.2em] border border-red-200 shadow-sm active:scale-[0.98]"
                  >
                    Clear Workspace
                  </button>
                )}
              </div>

              {state.statusMessage && (
                <div className={`text-[9px] font-black px-4 py-3 rounded-2xl flex items-center justify-between transition-colors border ${state.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                   <span className="uppercase tracking-[0.15em] truncate">{state.statusMessage}</span>
                   <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${state.loading ? 'bg-amber-500 animate-ping' : state.error ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            {state.error && (
              <div className="bg-red-50 border border-red-100 p-6 rounded-[2.5rem] mb-6 flex items-start space-x-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-red-500/10 p-2 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Inference Warning</h3>
                  <p className="text-xs text-red-700 font-bold leading-relaxed break-words">{state.error}</p>
                </div>
              </div>
            )}

            {!state.result && !state.loading && !state.error && (
              <div className="bg-white rounded-[3rem] border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[550px] shadow-sm">
                <div className="bg-slate-50 p-10 rounded-full mb-8 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tighter uppercase">{MODEL_LABELS[selectedModel]} Idle</h3>
                <p className="text-slate-400 max-w-xs text-xs font-bold leading-relaxed tracking-wide uppercase">
                  Segment your problem fragments for cost-effective BSc derivation.
                </p>
              </div>
            )}

            {state.loading && (
              <div className="bg-white rounded-[3rem] border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[550px] shadow-sm">
                <div className="relative w-32 h-32 mb-12">
                  <div className="absolute inset-0 border-[8px] border-slate-50 rounded-full"></div>
                  <div className="absolute inset-0 border-[8px] border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-sm font-black text-slate-800 mb-3 uppercase tracking-[0.3em]">{MODEL_LABELS[selectedModel]} Processing</h3>
                <p className="text-slate-400 text-[10px] font-bold italic tracking-[0.15em] animate-pulse">"{state.statusMessage}"</p>
              </div>
            )}

            {state.result && <ResultView key={JSON.stringify(state.result).slice(0, 50)} result={state.result} marks={state.marks} />}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 px-4 mt-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-40">
          <div className="flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest">
            <span>BSc Synthesis Lab</span>
            <span>Oxford-Standard Proofs</span>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] space-x-4">
            <span>57MM Thermal</span>
            <span>{MODEL_LABELS[selectedModel]}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
