import { Transaction, Reservation } from "../types";
import DOMPurify from 'dompurify';

interface AnalysisResult {
  success: boolean;
  data?: string;
  error?: string;
  sanitized?: boolean;
}

interface AnalysisOptions {
  maxRetries?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: string) => void;
}

/**
 * Configuración por defecto para análisis de IA
 */
const DEFAULT_OPTIONS: Required<AnalysisOptions> = {
  maxRetries: 3,
  timeoutMs: 20000,
  onRetry: () => {},
};

/**
 * Calcula el delay exponencial con jitter
 * Fórmula: delay = (baseDelay * (2 ^ attempt)) + jitter
 * 
 * @param attempt - Número de intento (0-indexed)
 * @param baseDelay - Delay base en ms
 * @returns Delay en milisegundos
 */
const getExponentialBackoffDelay = (attempt: number, baseDelay: number = 500): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * (exponentialDelay * 0.1); // 10% jitter
  return exponentialDelay + jitter;
};

/**
 * Espera un número específico de milisegundos
 * @param ms - Milisegundos a esperar
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sanitiza HTML/Markdown recibido usando DOMPurify
 * Protege contra XSS mientras preserva el contenido Markdown
 * 
 * @param content - Contenido a sanitizar
 * @returns Contenido sanitizado
 */
const sanitizeContent = (content: string): string => {
  // Configuración permisiva para Markdown (preserva formato básico)
  const config = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
      'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'class', 'id', 'style',
      'target', 'rel', 'data-*'
    ],
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(content, config);
};

/**
 * Realiza una solicitud con reintento exponencial y AbortController
 * 
 * @param transactions - Array de transacciones
 * @param reservations - Array de reservaciones
 * @param options - Opciones de configuración
 * @returns Resultado con análisis o error
 */
export const analyzeBusinessData = async (
  transactions: Transaction[],
  reservations: Reservation[],
  options?: AnalysisOptions
): Promise<AnalysisResult> => {
  const config: Required<AnalysisOptions> = { ...DEFAULT_OPTIONS, ...options };
  const serverUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:3001';

  // Validación básica
  if (!Array.isArray(transactions) || !Array.isArray(reservations)) {
    return {
      success: false,
      error: 'Datos inválidos',
    };
  }

  if (transactions.length === 0 && reservations.length === 0) {
    return {
      success: false,
      error: 'Se requieren datos para el análisis',
    };
  }

  let lastError: Error | null = null;
  let lastAborted = false;

  // Reintentos con backoff exponencial
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      
      // Configurar timeout de 20 segundos
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, config.timeoutMs);

      try {
        const response = await fetch(`${serverUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions,
            reservations,
          }),
          signal: controller.signal,
        });

        // Limpiar timeout inmediatamente
        clearTimeout(timeoutId);

        // Parsear respuesta
        const result: AnalysisResult = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Error del servidor (${response.status})`);
        }

        // ✅ SANITIZAR respuesta Markdown
        if (result.success && result.data) {
          result.data = sanitizeContent(result.data);
          result.sanitized = true;
        }

        return result;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido');
      const errorMessage = lastError.message;

      // ✅ Detectar si fue abortado por timeout
      if (errorMessage.includes('AbortError')) {
        lastAborted = true;
      }

      console.error(`Analysis Attempt ${attempt + 1}/${config.maxRetries}:`, {
        timestamp: new Date().toISOString(),
        error: errorMessage,
        attempt: attempt + 1,
      });

      // Si es el último intento, retornar error
      if (attempt === config.maxRetries - 1) {
        break;
      }

      // ✅ Reintento con backoff exponencial
      const backoffDelay = getExponentialBackoffDelay(attempt);
      config.onRetry(attempt + 1, errorMessage);
      
      console.info(`Reintentando en ${backoffDelay.toFixed(0)}ms...`);
      await delay(backoffDelay);
    }
  }

  // Retornar error final con contexto
  const finalErrorMessage = lastError?.message || 'Error desconocido';
  
  let userFriendlyError: string;
  if (lastAborted) {
    userFriendlyError = `Solicitud cancelada o timeout (${config.timeoutMs / 1000}s). Intenta nuevamente.`;
  } else if (finalErrorMessage.includes('Failed to fetch')) {
    userFriendlyError = 'No se puede conectar con el servidor. Verifica que esté ejecutándose.';
  } else if (finalErrorMessage.includes('AbortError')) {
    userFriendlyError = 'La solicitud fue cancelada por el usuario.';
  } else {
    userFriendlyError = `Error después de ${config.maxRetries} intentos: ${finalErrorMessage}`;
  }

  return {
    success: false,
    error: userFriendlyError,
  };
};