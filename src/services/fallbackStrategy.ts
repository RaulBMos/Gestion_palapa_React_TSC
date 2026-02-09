import DOMPurify from 'dompurify';
import {
  AIValidationError,
  CombinedAnalysisData,
  FinancialAnalysisData,
  ReservationAnalysisData,
  ValidatedAIResponse,
} from '@/services/responseValidator';

type ExpectedType = 'financial' | 'reservation' | 'combined';

export class FallbackStrategy {
  private sanitizeContent(content: string): string {
    const config = {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'ul', 'ol', 'li', 'blockquote',
        'code', 'pre', 'a', 'img', 'span', 'div',
        'table', 'tr', 'td', 'th', 'thead', 'tbody',
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src', 'class',
        'id', 'style', 'target', 'rel', 'data-*',
      ],
      KEEP_CONTENT: true,
    };

    return DOMPurify.sanitize(content, config);
  }

  public getSanitizedSummary(response: ValidatedAIResponse, expectedType: ExpectedType): string {
    let contentToSanitize: string;

    if (expectedType === 'combined') {
      const combinedData = response as CombinedAnalysisData;
      contentToSanitize = combinedData.data?.executiveSummary || '';
    } else if (expectedType === 'financial') {
      const financialData = response as FinancialAnalysisData;
      contentToSanitize = financialData.data?.summary || '';
    } else {
      const reservationData = response as ReservationAnalysisData;
      contentToSanitize = reservationData.data?.summary || '';
    }

    if (!contentToSanitize) {
      throw new Error('Faltan datos de resumen en la respuesta validada');
    }

    return this.sanitizeContent(contentToSanitize);
  }

  public buildFinalErrorState(
    finalErrorMessage: string,
    lastAborted: boolean,
    timeoutMs: number,
    maxRetries: number
  ): { userFriendlyError: string; errorType: string } {
    if (lastAborted) {
      return {
        userFriendlyError: `Solicitud cancelada o timeout (${timeoutMs / 1000}s). Intenta nuevamente.`,
        errorType: 'TIMEOUT',
      };
    }

    if (finalErrorMessage.includes('Failed to fetch')) {
      return {
        userFriendlyError: 'No se puede conectar con el servidor. Verifica que esté ejecutándose.',
        errorType: 'NETWORK_ERROR',
      };
    }

    if (finalErrorMessage.includes('AbortError')) {
      return {
        userFriendlyError: 'La solicitud fue cancelada por el usuario.',
        errorType: 'USER_CANCELLED',
      };
    }

    return {
      userFriendlyError: `Error después de ${maxRetries} intentos: ${finalErrorMessage}`,
      errorType: 'MAX_RETRIES_EXCEEDED',
    };
  }

  public isValidationError(error: unknown): error is AIValidationError {
    return error instanceof AIValidationError;
  }
}
