import React from 'react';
import { Sparkles, AlertCircle, X, Loader2 } from 'lucide-react';

interface AIPanelProps {
  aiAnalysis: string | null;
  aiError: string | null;
  loadingAi: boolean;
  retryAttempt: number;
  isAnalysisDisabled: boolean;
  countdownSeconds: number;
  onAnalyze: () => void;
  onCancel: () => void;
  onClearError: () => void;
}

export const AIAnalysisPanel: React.FC<AIPanelProps> = ({
  aiAnalysis,
  aiError,
  loadingAi,
  retryAttempt,
  isAnalysisDisabled,
  countdownSeconds,
  onAnalyze,
  onCancel,
  onClearError,
}) => {
  return (
    <>
      {/* Header with AI Action Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Panel de Control</h2>
          <p className="text-slate-500">Resumen operativo y financiero</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onAnalyze}
            disabled={loadingAi || isAnalysisDisabled}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 font-semibold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingAi ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analizando...</>
            ) : isAnalysisDisabled ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Esperar {countdownSeconds}s</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Analizar con IA</>
            )}
          </button>
          
          {/* Cancel Button - visible only during loading */}
          {loadingAi && (
            <button
              onClick={onCancel}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-200 flex items-center gap-2 font-semibold transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* AI Analysis Result - Sanitized with DOMPurify */}
      {aiAnalysis && !aiError && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 relative overflow-hidden animate-in slide-in-from-top-4 shadow-lg mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-white p-3 rounded-lg shadow-md shrink-0">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-indigo-900 font-bold text-lg mb-3">✨ {retryAttempt >= 3 ? 'Análisis Local (KPIs)' : 'Análisis de Inteligencia Artificial'}</h3>
              <div className="prose prose-indigo prose-sm max-w-none text-indigo-800 leading-relaxed whitespace-pre-line bg-white bg-opacity-50 rounded-lg p-4 border border-indigo-100">
                {aiAnalysis}
              </div>
              {/* Type indicator */}
              <p className="text-xs text-indigo-600 mt-3 flex items-center gap-1">
                {retryAttempt >= 3 ? '📊 Análisis basado en métricas locales' : '✓ Contenido validado y seguro'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State - With retry option */}
      {aiError && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 relative overflow-hidden animate-in slide-in-from-top-4 shadow-lg mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-white p-3 rounded-lg shadow-md shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-900 font-bold text-lg mb-1">Error en el análisis</h3>
              <p className="text-red-800 mb-4">{aiError}</p>
              {retryAttempt > 0 && (
                <p className="text-xs text-red-700 bg-red-100 px-3 py-2 rounded-lg inline-block mb-4">
                  🔄 Se realizó intento {retryAttempt}/3
                </p>
              )}
              {retryAttempt < 3 && (
                <button
                  onClick={onAnalyze}
                  disabled={isAnalysisDisabled}
                  className="mt-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed"
                >
                  {isAnalysisDisabled ? `Esperar ${countdownSeconds}s` : 'Reintentar análisis'}
                </button>
              )}
              {retryAttempt >= 3 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    📊 Se generará automáticamente un análisis local basado en tus métricas de negocio.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClearError}
              className="shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
