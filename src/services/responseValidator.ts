import { logError } from '@/utils/logger';
import {
  GeminiResponse,
  ComplexAnalysis,
  AnalysisResponse,
  ComplexAnalysisSchema,
  AnalysisResponseSchema,
  createGeminiResponseSchema,
} from '@/types';
import { ZodError } from 'zod';

export type CombinedAnalysisData = GeminiResponse<ComplexAnalysis>;
export type FinancialAnalysisData = GeminiResponse<AnalysisResponse>;
export type ReservationAnalysisData = GeminiResponse<AnalysisResponse>;

export type ValidatedAIResponse =
  | CombinedAnalysisData
  | FinancialAnalysisData
  | ReservationAnalysisData;

export class AIValidationError extends Error {
  public readonly cause: ZodError | Error;
  public readonly response: unknown;

  constructor(message: string, cause: ZodError | Error, response: unknown) {
    super(message);
    this.name = 'AIValidationError';
    this.cause = cause;
    this.response = response;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIValidationError);
    }
  }

  public toDetailedString(): string {
    const validationErrors = this.cause instanceof ZodError
      ? this.cause.issues.map(issue => `- ${issue.path.join('.')}: ${issue.message}`).join('\n')
      : this.cause.message;

    return `${this.message}\nValidation Errors: ${validationErrors}\nOriginal Response: ${JSON.stringify(this.response, null, 2)}`;
  }
}

export class ResponseValidator {
  public validate(
    response: unknown,
    expectedType: 'financial' | 'reservation' | 'combined' = 'combined'
  ): ValidatedAIResponse {
    try {
      let parsedResponse = response;
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
          } catch {
            const jsonError = new Error('La respuesta de la IA no es un JSON válido');
            const emptyZodError = Object.create(ZodError.prototype);
            emptyZodError.issues = [];
            emptyZodError.name = 'ZodError';
            throw new AIValidationError(jsonError.message, emptyZodError, response);
          }
        }

      const schema = expectedType === 'combined'
        ? createGeminiResponseSchema(ComplexAnalysisSchema)
        : createGeminiResponseSchema(AnalysisResponseSchema);

      const validatedData = schema.parse(parsedResponse);
      return validatedData as ValidatedAIResponse;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AIValidationError(
          `Validación fallida para respuesta de tipo ${expectedType}`,
          error,
          response
        );
      }

      if (error instanceof AIValidationError) {
        throw error;
      }

      const unexpectedError = new Error(
        `Error inesperado al validar respuesta: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
      const emptyZodError = Object.create(ZodError.prototype);
      emptyZodError.issues = [];
      emptyZodError.name = 'ZodError';
      throw new AIValidationError(unexpectedError.message, emptyZodError, response);
    }
  }

  public safeValidate(
    response: unknown,
    expectedType: 'financial' | 'reservation' | 'combined' = 'combined'
  ): ValidatedAIResponse | null {
    try {
      return this.validate(response, expectedType);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Validation error'), {
        component: 'geminiService',
        action: 'safeValidateAIResponse',
        expectedType,
        response: typeof response === 'string' ? `${response.substring(0, 200)}...` : response,
      });
      return null;
    }
  }
}
