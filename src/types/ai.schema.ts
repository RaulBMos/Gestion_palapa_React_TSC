import { z } from 'zod';

/**
 * Esquema Zod para los metadatos de uso de la API
 */
export const UsageMetadataSchema = z.object({
  promptTokens: z.number().optional(),
  candidatesTokens: z.number().optional(),
  totalTokens: z.number().optional(),
});

/**
 * Esquema Zod para los metadatos de respuesta de Gemini
 */
export const ResponseMetadataSchema = z.object({
  model: z.string(),
  usage: UsageMetadataSchema.optional(),
});

/**
 * Interfaz TypeScript para los metadatos de uso
 */
export type UsageMetadata = z.infer<typeof UsageMetadataSchema>;

/**
 * Interfaz TypeScript para los metadatos de respuesta
 */
export type ResponseMetadata = z.infer<typeof ResponseMetadataSchema>;

/**
 * Interfaz TypeScript para la respuesta de Gemini
 */
export interface GeminiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: ResponseMetadata;
}

/**
 * Esquema Zod para la configuración de Gemini
 */
export const GeminiConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxOutputTokens: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
});

/**
 * Interfaz TypeScript inferida del esquema GeminiConfig
 */
export type GeminiConfig = z.infer<typeof GeminiConfigSchema>;

/**
 * Función para crear un esquema de respuesta de Gemini con el tipo de datos especificado
 */
export const createGeminiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => 
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    metadata: ResponseMetadataSchema.optional(),
  });

/**
 * Esquemas para diferentes tipos de datos de respuesta
 */

// Esquema para respuestas de texto simple
export const TextResponseSchema = z.string();

// Esquema para respuestas JSON genéricas
export const JsonResponseSchema = z.record(z.string(), z.unknown());

/**
 * Tipos de respuesta comunes para la IA
 */
export type TextResponse = z.infer<typeof TextResponseSchema>;
export type JsonResponse = z.infer<typeof JsonResponseSchema>;

/**
 * Esquema para errores de la API
 */
export const ApiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Tipo para errores de API
 */
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Esquemas específicos para diferentes casos de uso
 */

// Esquema para respuestas de análisis
export const AnalysisResponseSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().optional(),
  type: z.enum(['financial', 'reservation', 'combined']),
  summary: z.string(),
  insights: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional(),
});

// Esquema para métricas
export const MetricsSchema = z.object({
  total: z.number(),
  average: z.number().optional(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
  change: z.number().optional(),
});

// Esquema para recomendaciones
export const RecommendationSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  action: z.string(),
  expectedOutcome: z.string(),
  timeline: z.string().optional(),
});

/**
 * Tipos inferidos para los esquemas específicos
 */
export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Esquemas combinados para respuestas complejas
 */
export const ComplexAnalysisSchema = z.object({
  executiveSummary: z.string(),
  analysis: AnalysisResponseSchema,
  metrics: MetricsSchema.optional(),
  recommendations: z.array(RecommendationSchema).optional(),
});

export type ComplexAnalysis = z.infer<typeof ComplexAnalysisSchema>;

/**
 * Funciones de utilidad para crear respuestas tipadas
 */

/**
 * Valida una respuesta de la IA usando el esquema apropiado
 */
export const validateAIResponse = <T>(
  response: unknown,
  dataSchema: z.ZodType<T>
): GeminiResponse<T> => {
  const schema = createGeminiResponseSchema(dataSchema);
  const parsed = schema.parse(response);
  return parsed as GeminiResponse<T>;
};

/**
 * Crea una respuesta exitosa tipada
 */
export const createSuccessResponse = <T>(
  data: T,
  metadata?: ResponseMetadata
): GeminiResponse<T> => {
  const result = {
    success: true as const,
    data,
  };
  
  if (metadata) {
    return { ...result, metadata };
  }
  
  return result;
};

/**
 * Crea una respuesta de error tipada
 */
export const createErrorResponse = (
  error: string,
  metadata?: ResponseMetadata
): GeminiResponse<never> => {
  const result: GeminiResponse<never> = {
    success: false,
    error,
  };
  
  if (metadata) {
    result.metadata = metadata;
  }
  
  return result;
};