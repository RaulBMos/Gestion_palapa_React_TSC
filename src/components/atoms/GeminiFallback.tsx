import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Edit3, X } from 'lucide-react';

export interface GeminiFallbackProps {
  error?: string;
  onRetry?: () => void;
  onManualInput?: (manualText: string) => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export const GeminiFallback: React.FC<GeminiFallbackProps> = ({
  error = 'El servicio de IA no está disponible en este momento',
  onRetry,
  onManualInput,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3
}) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSubmit = async () => {
    if (!manualText.trim() || !onManualInput) return;
    
    setIsSubmitting(true);
    try {
      await onManualInput(manualText.trim());
      setManualText('');
      setShowManualInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canRetry = retryCount < maxRetries && onRetry && !isRetrying;

  return (
    <div className="w-full p-6 bg-amber-50 border border-amber-200 rounded-lg">
      {/* Header with warning */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Servicio de IA temporalmente no disponible
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            {error}
          </p>
        </div>
      </div>

      {/* Retry status */}
      {retryCount > 0 && (
        <div className="mb-4 p-3 bg-amber-100 rounded-md">
          <p className="text-xs text-amber-800">
            Intentos de reconexión: {retryCount} de {maxRetries}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Reintentando...' : 'Reintentar'}
          </button>
        )}

        {!showManualInput && onManualInput && (
          <button
            onClick={() => setShowManualInput(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Entrada manual
          </button>
        )}
      </div>

      {/* Manual input section */}
      {showManualInput && onManualInput && (
        <div className="border-t border-amber-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-amber-800">
              Análisis manual de datos
            </h4>
            <button
              onClick={() => {
                setShowManualInput(false);
                setManualText('');
              }}
              className="text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Describe tus observaciones sobre el rendimiento del negocio, ocupación, ingresos, gastos, y cualquier recomendación que consideres relevante..."
              className="w-full h-32 p-3 text-sm border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              disabled={isSubmitting}
            />
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setManualText('');
                }}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!manualText.trim() || isSubmitting}
                className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Guardando...' : 'Usar análisis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alternative options when retry limit reached */}
      {retryCount >= maxRetries && (
        <div className="mt-4 p-3 bg-amber-100 rounded-md">
          <p className="text-xs text-amber-800 mb-2">
            Se alcanzó el límite de intentos. Puedes:
          </p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Usar la entrada manual para agregar tu análisis</li>
            <li>• Esperar unos minutos y volver a intentar</li>
            <li>• Verificar tu conexión a internet</li>
          </ul>
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 text-xs text-amber-600">
        <p>
          <strong>Sugerencia:</strong> El análisis manual te permite proporcionar insights personalizados 
          basados en tu conocimiento del negocio mientras el servicio de IA se recupera.
        </p>
      </div>
    </div>
  );
};

export default GeminiFallback;