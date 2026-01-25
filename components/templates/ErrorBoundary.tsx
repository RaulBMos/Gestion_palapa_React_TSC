import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Captura errores de componentes hijos y muestra una UI amigable
 * 
 * Uso:
 * <ErrorBoundary>
 *   <TuComponente />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error para debugging
    console.error('Error capturado por ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-red-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <AlertCircle size={32} />
                <h1 className="text-2xl font-bold">¡Algo salió mal!</h1>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-slate-700 font-medium">
                Hemos encontrado un error inesperado en la aplicación.
              </p>

              {/* Error Details (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-slate-100 p-3 rounded border border-slate-300">
                  <p className="text-xs font-mono text-slate-600 break-words">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer font-semibold text-slate-700">
                        Detalles técnicos
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border border-slate-200">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.resetError}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Intentar de nuevo
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Volver al inicio
                </button>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900">
                  💡 <strong>Tip:</strong> Si el problema persiste, intenta:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                  <li>Limpiar la caché del navegador</li>
                  <li>Recargar la página (F5)</li>
                  <li>Contactar con soporte si el error continúa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
