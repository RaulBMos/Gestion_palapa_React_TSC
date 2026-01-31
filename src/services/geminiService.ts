import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { logger, logError, logInfo, logWarning, logDebug } from '@/utils/logger';
import { withRetry, type RetryOptions } from '@/utils/retry';
import { ZodSchema, ZodError } from 'zod';
import {
  GeminiResponse,
  GeminiConfig,
  ComplexAnalysis, // Type
  AnalysisResponse, // Type
  ComplexAnalysisSchema, // Zod Schema
  AnalysisResponseSchema, // Zod Schema
  createGeminiResponseSchema // Helper
} from '@/types';
import { Transaction, Reservation } from '@/types';
import DOMPurify from 'dompurify';
import { VITE_SERVER_URL } from '@/config/env';

/**
 * Environment Variables for Gemini Service Configuration:
 * 
 * Google SDK Mode (default):
 * - VITE_GEMINI_API_KEY: Required for direct Google SDK access
 * 
 * Proxy API Mode:
 * - VITE_USE_PROXY_API=true: Enable proxy mode
 * - VITE_PROXY_API_URL: Required proxy endpoint (e.g., https://api.example.com)
 * 
 * Examples:
 * .env (Google SDK): VITE_GEMINI_API_KEY=your_api_key
 * .env (Proxy API): VITE_USE_PROXY_API=true&VITE_PROXY_API_URL=https://proxy-api.com
 */

interface ApiResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

/**
 * Error personalizado para validación de respuestas de IA
 * Extiende Error para que pueda ser capturado por ErrorBoundary
 */
export class AIValidationError extends Error {
  public readonly cause: ZodError | Error;
  public readonly response: unknown;

  constructor(message: string, cause: ZodError | Error, response: unknown) {
    super(message);
    this.name = 'AIValidationError';
    this.cause = cause;
    this.response = response;

    // Mantener stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIValidationError);
    }
  }

  /**
   * Formatea el error para logging/debugging
   */
  public toDetailedString(): string {
    const validationErrors = this.cause instanceof ZodError
      ? this.cause.issues.map(issue =>
        `- ${issue.path.join('.')}: ${issue.message}`
      ).join('\n')
      : this.cause.message;

    return `${this.message}\nValidation Errors: ${validationErrors}\nOriginal Response: ${JSON.stringify(this.response, null, 2)}`;
  }
}

/**
 * Esquemas Zod para validación de respuestas de la IA
 */

// Esquema base para respuestas de análisis
// const BaseAnalysisSchema = {
//   success: true,
//   timestamp: true,
//   analysisId: true,
// };

// Esquema para análisis financiero completo
// const FinancialAnalysisSchema = {
//   ...BaseAnalysisSchema,
//   success: true,
//   data: {
//     summary: true,
//     insights: true,
//     metrics: {
//       totalRevenue: true,
//       totalExpenses: true,
//       netIncome: true,
//       profitMargin: true,
//       revenueGrowth: true,
//     },
//     trends: true,
//     recommendations: true,
//     confidence: true,
//   },
// };

// Esquema para análisis de reservaciones
// const ReservationAnalysisSchema = {
//   ...BaseAnalysisSchema,
//   success: true,
//   data: {
//     summary: true,
//     occupancy: {
//       currentRate: true,
//       averageRate: true,
//       trend: true,
//     },
//     bookings: {
//       total: true,
//       confirmed: true,
//       pending: true,
//       cancelled: true,
//     },
//     peakSeasons: true,
//     recommendations: true,
//   },
// };

// Esquema para análisis combinado (ambos tipos de datos)
// const CombinedAnalysisSchema = {
//   ...BaseAnalysisSchema,
//   success: true,
//   data: {
//     executiveSummary: true,
//     financial: FinancialAnalysisSchema.data,
//     reservations: ReservationAnalysisSchema.data,
//     crossInsights: true,
//     strategicRecommendations: true,
//     overallHealth: true,
//   },
// };

// Esquema para respuestas de error
// const ErrorAnalysisSchema = {
//   ...BaseAnalysisSchema,
//   success: false,
//   error: true,
//   errorCode: true,
//   details: true,
// };

// Tipo inferido del esquema
// Tipos fuertemente tipados
export type CombinedAnalysisData = GeminiResponse<ComplexAnalysis>;
export type FinancialAnalysisData = GeminiResponse<AnalysisResponse>;
export type ReservationAnalysisData = GeminiResponse<AnalysisResponse>;

export type ValidatedAIResponse = CombinedAnalysisData | FinancialAnalysisData | ReservationAnalysisData;

/**
 * Función de validación principal
 * Transforma el string de la IA en un objeto tipado y validado
 */
export const validateAIResponse = (
  response: unknown,
  expectedType: 'financial' | 'reservation' | 'combined' = 'combined'
): ValidatedAIResponse => {
  try {
    // Si la respuesta es un string, intentar parsear como JSON primero
    let parsedResponse = response;
    if (typeof response === 'string') {
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        const jsonError = new Error('La respuesta de la IA no es un JSON válido');
        const emptyZodError = Object.create(ZodError.prototype);
        emptyZodError.issues = [];
        emptyZodError.name = 'ZodError';
        throw new AIValidationError(
          jsonError.message,
          emptyZodError,
          response
        );
      }
    }

    // Seleccionar esquema basado en el tipo esperado
    let schema;
    if (expectedType === 'combined') {
      schema = createGeminiResponseSchema(ComplexAnalysisSchema);
    } else {
      schema = createGeminiResponseSchema(AnalysisResponseSchema);
    }

    // Validar con Zod
    const validatedData = schema.parse(parsedResponse);
    return validatedData as ValidatedAIResponse;

  } catch (validationError) {
    if (validationError instanceof ZodError) {
      throw new AIValidationError(
        `Validación fallida para respuesta de tipo ${expectedType}`,
        validationError,
        response
      );
    }

    if (validationError instanceof AIValidationError) {
      throw validationError;
    }

    const unexpectedError = new Error(`Error inesperado al validar respuesta: ${validationError instanceof Error ? validationError.message : 'Error desconocido'}`);
    const emptyZodError = Object.create(ZodError.prototype);
    emptyZodError.issues = [];
    emptyZodError.name = 'ZodError';
    throw new AIValidationError(
      unexpectedError.message,
      emptyZodError,
      response
    );
  }
};

/**
 * Función de validación segura con fallback
 * Retorna null si la validación falla en lugar de lanzar error
 */
export const safeValidateAIResponse = (
  response: unknown,
  expectedType: 'financial' | 'reservation' | 'combined' = 'combined'
): ValidatedAIResponse | null => {
  try {
    return validateAIResponse(response, expectedType);
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Validation error'), {
      component: 'geminiService',
      action: 'safeValidateAIResponse',
      expectedType,
      response: typeof response === 'string' ? response.substring(0, 200) + '...' : response,
    });
    return null;
  }
};

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
  onRetry: () => { },
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

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private defaultConfig = {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxOutputTokens: 1024,
    topP: 0.8,
    topK: 40
  };

  constructor() {
    this.initializeClient();
  }

  /**
   * Único método que interactúa con variables de entorno
   * Centraliza toda la configuración y decide qué método de fetch usar
   */
  private async executeRequest(
    prompt: string,
    config?: Partial<GeminiConfig>
  ): Promise<ApiResponse> {
    // Verificar modo de ejecución mediante variables de entorno
    const useProxy = import.meta.env.VITE_USE_PROXY_API === 'true';
    const proxyUrl = import.meta.env.VITE_PROXY_API_URL;

    if (useProxy && proxyUrl) {
      logger.info('Using proxy API for Gemini request', {
        service: 'gemini',
        proxyUrl: proxyUrl.replace(/\/api.*$/, '') // Ocultar ruta completa en logs
      });
      return this.executeProxyRequest(prompt, config, proxyUrl);
    } else {
      logger.info('Using Google SDK for Gemini request', { service: 'gemini' });
      return this.executeGoogleSDKRequest(prompt, config);
    }
  }

  /**
   * Método privado para obtener API key (únicamente usado por SDK de Google)
   */
  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }

    return apiKey;
  }

  /**
   * Inicializa cliente SDK de Google (solo si se usa SDK directo)
   */
  private initializeClient(): void {
    try {
      const useProxy = import.meta.env.VITE_USE_PROXY_API === 'true';

      if (!useProxy) {
        const apiKey = this.getApiKey();
        this.genAI = new GoogleGenerativeAI(apiKey);
        logger.info('Gemini client initialized successfully', { service: 'gemini', method: 'google-sdk' });
      } else {
        logger.info('Proxy API mode detected, skipping Google SDK initialization', {
          service: 'gemini',
          method: 'proxy-api'
        });
      }
    } catch (error) {
      logger.error('Failed to initialize Gemini client', { service: 'gemini' }, error as Error);
      throw error;
    }
  }

  /**
   * Ejecuta request usando SDK de Google directamente
   */
  private async executeGoogleSDKRequest(
    prompt: string,
    config?: Partial<GeminiConfig>
  ): Promise<ApiResponse> {
    const model = this.getModel(config);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    return {
      text,
      model: config?.model || this.defaultConfig.model,
      ...(response.usageMetadata && {
        usage: {
          promptTokens: response.usageMetadata.promptTokenCount,
          candidatesTokens: response.usageMetadata.candidatesTokenCount,
          totalTokens: response.usageMetadata.totalTokenCount
        }
      })
    };
  }

  /**
   * Ejecuta request usando API Proxy propia
   */
  private async executeProxyRequest(
    prompt: string,
    config?: Partial<GeminiConfig>,
    proxyUrl?: string
  ): Promise<ApiResponse> {
    if (!proxyUrl) {
      throw new Error('Proxy URL not configured. Set VITE_PROXY_API_URL environment variable.');
    }

    const requestConfig = { ...this.defaultConfig, ...config };

    const response = await fetch(`${proxyUrl}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        config: requestConfig,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Proxy API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    if (!data.text) {
      throw new Error('Empty response from Proxy API');
    }

    return {
      text: data.text,
      model: data.model || requestConfig.model,
      usage: data.usage,
    };
  }

  private getModel(config?: Partial<GeminiConfig>): GenerativeModel {
    const finalConfig = { ...this.defaultConfig, ...config } as typeof this.defaultConfig;

    if (!this.genAI) {
      throw new Error('Gemini client not initialized');
    }

    return this.genAI.getGenerativeModel({
      model: finalConfig.model,
      generationConfig: {
        temperature: finalConfig.temperature,
        maxOutputTokens: finalConfig.maxOutputTokens,
        topP: finalConfig.topP,
        topK: finalConfig.topK
      } as GenerationConfig
    });
  }

  /**
   * Procesa la respuesta de la API (separación de lógica de fetch vs procesamiento)
   */
  private processApiResponse<T>(
    response: ApiResponse,
    schema?: ZodSchema<T>,
    _config?: Partial<GeminiConfig>
  ): GeminiResponse<T> {
    logger.debug('Processing API response', {
      service: 'gemini',
      responseLength: response.text.length,
      schema: schema ? 'provided' : 'none'
    });

    let data: T;

    if (schema) {
      try {
        const cleanText = this.extractJsonFromResponse(response.text);
        const parsed = JSON.parse(cleanText);

        // Type narrowing with Zod validation
        const validatedData = schema.parse(parsed);
        data = validatedData;

        logger.debug('Response validated with Zod schema', { service: 'gemini' });
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          logger.error('Zod validation failed',
            { service: 'gemini', response: response.text, issues: validationError.issues },
            validationError
          );
          return {
            success: false,
            error: `Validation failed: ${validationError.issues.map(issue => issue.message).join(', ')}`,
          };
        } else {
          logger.error('Failed to parse JSON response',
            { service: 'gemini', response: response.text },
            validationError as Error
          );
          return {
            success: false,
            error: 'Response parsing failed',
          };
        }
      }
    } else {
      data = response.text as unknown as T;
    }

    const metadata: GeminiResponse<T>['metadata'] = {
      model: response.model,
      ...(response.usage && { usage: response.usage })
    };

    logger.info('API response processed successfully', {
      service: 'gemini',
      model: metadata.model,
      usage: metadata.usage
    });

    return {
      success: true,
      data,
      ...metadata && { metadata }
    };
  }

  /**
   * Maneja requests con lógica de fetch separada del procesamiento
   */
  private async handleRequest<T>(
    prompt: string,
    schema?: ZodSchema<T>,
    config?: Partial<GeminiConfig>,
    retryOptions?: RetryOptions
  ): Promise<GeminiResponse<T>> {
    const makeRequest = async (): Promise<GeminiResponse<T>> => {
      // 1. Fetch logic - usa executeRequest (único método que interactúa con env vars)
      const apiResponse = await this.executeRequest(prompt, config);

      // 2. Processing logic - usa processApiResponse
      return this.processApiResponse(apiResponse, schema, config);
    };

    try {
      const retryResult = await withRetry(makeRequest, retryOptions);

      if (retryResult.success) {
        return retryResult.data!;
      } else {
        return this.handleError(retryResult.error!, config?.model || this.defaultConfig.model);
      }
    } catch (error) {
      return this.handleError(error as Error, config?.model || this.defaultConfig.model);
    }
  }

  private extractJsonFromResponse(text: string): string {
    // Primero intentar con el patrón original para backwards compatibility
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|{[\s\S]*}|\[[\s\S]*\]/;
    const match = text.match(jsonRegex);

    if (match) {
      return match[1] || match[0];
    }

    // Si no funciona, buscar el primer { y el último }
    const firstBraceIndex = text.indexOf('{');
    const lastBraceIndex = text.lastIndexOf('}');

    if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
      const extractedJson = text.substring(firstBraceIndex, lastBraceIndex + 1);
      return extractedJson.trim();
    }

    return text.trim();
  }

  private handleError(error: Error, model: string): GeminiResponse<never> {
    const errorMessage = error.message;

    if (errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('quota')) {
      logger.quotaExceeded('gemini', { model, error: errorMessage });
      return {
        success: false,
        error: 'API quota exceeded. Please try again later.',
        metadata: { model }
      };
    }

    if (errorMessage.includes('NETWORK_ERROR') || errorMessage.includes('fetch')) {
      logger.networkError('gemini-api', error, { model });
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        metadata: { model }
      };
    }

    if (errorMessage.includes('API_KEY') || errorMessage.includes('authentication')) {
      logger.error('Authentication error with Gemini API', { service: 'gemini', model }, error);
      return {
        success: false,
        error: 'Authentication failed. Please check your API key.',
        metadata: { model }
      };
    }

    if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      logger.warn('Content blocked by Gemini safety filters', { service: 'gemini', model });
      return {
        success: false,
        error: 'Content blocked by safety filters. Please modify your request.',
        metadata: { model }
      };
    }

    logger.error('Gemini API error', { service: 'gemini', model, error: errorMessage }, error);

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      metadata: { model }
    };
  }

  public async generateText(
    prompt: string,
    config?: Partial<GeminiConfig>,
    retryOptions?: RetryOptions
  ): Promise<GeminiResponse<string>> {
    return this.handleRequest<string>(prompt, undefined, config, retryOptions);
  }

  public async generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    config?: Partial<GeminiConfig>,
    retryOptions?: RetryOptions
  ): Promise<GeminiResponse<T>> {
    const schemaInstruction = `
Please respond with valid JSON.

Your response should be ONLY the JSON object, without any additional text or explanation.
`;

    const enhancedPrompt = `${prompt}

${schemaInstruction}`;

    return this.handleRequest<T>(enhancedPrompt, schema, config, retryOptions);
  }

  public async generateWithPrompt<T>(
    systemPrompt: string,
    userPrompt: string,
    schema?: ZodSchema<T>,
    config?: Partial<GeminiConfig>,
    retryOptions?: RetryOptions
  ): Promise<GeminiResponse<T>> {
    const fullPrompt = `
System Instructions:
${systemPrompt}

User Request:
${userPrompt}
`;

    return this.handleRequest<T>(fullPrompt, schema, config, retryOptions);
  }

  public isInitialized(): boolean {
    return this.genAI !== null;
  }

  public setDefaultConfig(config: Partial<GeminiConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config } as typeof this.defaultConfig;
    logger.info('Gemini default config updated', { service: 'gemini', config: this.defaultConfig });
  }
}

/**
 * Realiza una solicitud con reintento exponencial y AbortController
 * Implementa capa de validación Zod para respuestas de IA
 * 
 * @param transactions - Array de transacciones
 * @param reservations - Array de reservaciones
 * @param options - Opciones de configuración
 * @returns Resultado con análisis validado o error
 */
export const analyzeBusinessData = async (
  transactions: Transaction[],
  reservations: Reservation[],
  options?: AnalysisOptions
): Promise<AnalysisResult> => {
  const config: Required<AnalysisOptions> = { ...DEFAULT_OPTIONS, ...options };
  const serverUrl = VITE_SERVER_URL;

  logInfo('Iniciando análisis de datos de negocio', {
    component: 'geminiService',
    action: 'analyzeBusinessData',
    transactionsCount: transactions.length,
    reservationsCount: reservations.length,
    options: config,
  });

  // Validación básica de inputs
  if (!Array.isArray(transactions) || !Array.isArray(reservations)) {
    const error = new Error('Datos inválidos: se esperan arrays');
    logError(error, {
      component: 'geminiService',
      action: 'analyzeBusinessData',
      phase: 'input_validation',
      transactionsType: typeof transactions,
      reservationsType: typeof reservations,
    });
    return {
      success: false,
      error: 'Datos inválidos',
    };
  }

  if (transactions.length === 0 && reservations.length === 0) {
    const error = new Error('No hay datos para analizar');
    logError(error, {
      component: 'geminiService',
      action: 'analyzeBusinessData',
      phase: 'input_validation',
      transactionsCount: transactions.length,
      reservationsCount: reservations.length,
    });
    return {
      success: false,
      error: 'Se requieren datos para el análisis',
    };
  }

  // Determinar tipo de análisis esperado basado en los datos disponibles
  const expectedType = transactions.length > 0 && reservations.length > 0
    ? 'combined' as const
    : transactions.length > 0
      ? 'financial' as const
      : 'reservation' as const;

  let lastError: Error | null = null;
  let lastAborted = false;

  // Reintentos con backoff exponencial
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();

      // Configurar timeout
      const timeoutId = setTimeout(() => {
        logWarning('Timeout de solicitud de análisis', {
          component: 'geminiService',
          action: 'analyzeBusinessData',
          phase: 'network_request',
          attempt: attempt + 1,
          timeoutMs: config.timeoutMs,
        });
        controller.abort();
      }, config.timeoutMs);

      try {
        logDebug(`Realizando intento de análisis ${attempt + 1}/${config.maxRetries}`, {
          component: 'geminiService',
          action: 'analyzeBusinessData',
          phase: 'network_request',
          attempt: attempt + 1,
          serverUrl: `${serverUrl}/api/analyze`,
        });

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

        // Limpiar timeout
        clearTimeout(timeoutId);

        logDebug('Respuesta recibida del servidor', {
          component: 'geminiService',
          action: 'analyzeBusinessData',
          phase: 'network_request',
          attempt: attempt + 1,
          status: response.status,
          ok: response.ok,
        });

        // Parsear respuesta bruta
        let rawResult;
        try {
          rawResult = await response.json();
        } catch {
          const error = new Error('Error al parsear respuesta JSON del servidor');
          logError(error, {
            component: 'geminiService',
            action: 'analyzeBusinessData',
            phase: 'response_parsing',
            attempt: attempt + 1,
            responseStatus: response.status,
            responseText: await response.text(),
          });
          throw error;
        }

        if (!response.ok) {
          const error = new Error(rawResult.error || `Error del servidor (${response.status})`);
          logError(error, {
            component: 'geminiService',
            action: 'analyzeBusinessData',
            phase: 'response_validation',
            attempt: attempt + 1,
            status: response.status,
            statusText: response.statusText,
            serverError: rawResult.error,
          });
          throw error;
        }

        // ✅ VALIDAR respuesta de la IA con Zod
        let validatedResponse: ValidatedAIResponse;
        try {
          validatedResponse = validateAIResponse(rawResult, expectedType);
          logDebug('Respuesta validada exitosamente', {
            component: 'geminiService',
            action: 'analyzeBusinessData',
            phase: 'response_validation',
            attempt: attempt + 1,
            expectedType,
            success: validatedResponse.success,
          });
        } catch (validationError) {
          if (validationError instanceof AIValidationError) {
            logError(validationError, {
              component: 'geminiService',
              action: 'analyzeBusinessData',
              phase: 'response_validation',
              attempt: attempt + 1,
              expectedType,
              validationDetails: validationError.toDetailedString(),
            });
            throw validationError;
          }
          logError(validationError instanceof Error ? validationError : new Error('Unknown validation error'), {
            component: 'geminiService',
            action: 'analyzeBusinessData',
            phase: 'response_validation',
            attempt: attempt + 1,
            expectedType,
          });
          throw validationError;
        }

        // Si la respuesta es exitosa, procesar y sanitizar
        if (validatedResponse.success) {
          if (!validatedResponse.data) {
            throw new Error('La respuesta fue exitosa pero no contiene datos');
          }

          // Extraer contenido para sanitización
          let contentToSanitize: string;

          if (expectedType === 'combined') {
            const combinedData = validatedResponse as CombinedAnalysisData;
            // Assert data existence since we checked validatedResponse.data above
            contentToSanitize = combinedData.data!.executiveSummary;
          } else if (expectedType === 'financial') {
            const financialData = validatedResponse as FinancialAnalysisData;
            contentToSanitize = financialData.data!.summary;
          } else {
            const reservationData = validatedResponse as ReservationAnalysisData;
            contentToSanitize = reservationData.data!.summary;
          }

          // Sanitizar contenido
          const sanitizedContent = sanitizeContent(contentToSanitize);

          return {
            success: true,
            data: sanitizedContent,
            sanitized: true,
          };
        }

        // Si la respuesta indica error del servidor de IA
        if (validatedResponse.success === false) {
          return {
            success: false,
            error: validatedResponse.error || 'Error en el análisis de IA',
          };
        }

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido');
      const errorMessage = lastError.message;

      // Detectar si fue abortado por timeout
      if (errorMessage.includes('AbortError')) {
        lastAborted = true;
      }

      // Si es un error de validación, no reintentar
      if (error instanceof AIValidationError) {
        logError(error, {
          component: 'geminiService',
          action: 'analyzeBusinessData',
          phase: 'validation_error',
          attempt: attempt + 1,
          expectedType,
          errorType: 'AIValidationError',
        });
        return {
          success: false,
          error: `La respuesta de la IA no es válida: ${error.message}`,
        };
      }

      logError(lastError, {
        component: 'geminiService',
        action: 'analyzeBusinessData',
        phase: 'retry_attempt',
        attempt: attempt + 1,
        totalAttempts: config.maxRetries,
        errorMessage,
        aborted: lastAborted,
      });

      // Si es el último intento, retornar error
      if (attempt === config.maxRetries - 1) {
        break;
      }

      // Reintento con backoff exponencial
      const backoffDelay = getExponentialBackoffDelay(attempt);
      config.onRetry(attempt + 1, errorMessage);

      logInfo(`Reintentando análisis en ${backoffDelay.toFixed(0)}ms`, {
        component: 'geminiService',
        action: 'analyzeBusinessData',
        phase: 'retry_delay',
        attempt: attempt + 1,
        backoffDelay,
      });

      await delay(backoffDelay);
    }
  }

  // Retornar error final con contexto
  const finalErrorMessage = lastError?.message || 'Error desconocido';

  let userFriendlyError: string;
  let errorType: string;

  if (lastAborted) {
    userFriendlyError = `Solicitud cancelada o timeout (${config.timeoutMs / 1000}s). Intenta nuevamente.`;
    errorType = 'TIMEOUT';
  } else if (finalErrorMessage.includes('Failed to fetch')) {
    userFriendlyError = 'No se puede conectar con el servidor. Verifica que esté ejecutándose.';
    errorType = 'NETWORK_ERROR';
  } else if (finalErrorMessage.includes('AbortError')) {
    userFriendlyError = 'La solicitud fue cancelada por el usuario.';
    errorType = 'USER_CANCELLED';
  } else {
    userFriendlyError = `Error después de ${config.maxRetries} intentos: ${finalErrorMessage}`;
    errorType = 'MAX_RETRIES_EXCEEDED';
  }

  logError(new Error(finalErrorMessage), {
    component: 'geminiService',
    action: 'analyzeBusinessData',
    phase: 'final_error',
    errorType,
    maxRetries: config.maxRetries,
    timeoutMs: config.timeoutMs,
    finalAttempt: config.maxRetries,
    userFriendlyError,
  });

  return {
    success: false,
    error: userFriendlyError,
  };
};

// Named exports
export const geminiService = new GeminiService();
export { GeminiService };
export type { ApiResponse, AnalysisResult, AnalysisOptions };