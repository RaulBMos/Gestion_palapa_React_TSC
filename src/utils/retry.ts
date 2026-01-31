import { logger } from '@/utils/logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryCondition: (error: unknown) => {
    const errorMessage = error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'string'
        ? error.toLowerCase()
        : '';

    const retryableErrors = [
      'network error',
      'timeout',
      'connection',
      'quota exceeded',
      'rate limit',
      'temporarily unavailable',
      'internal server error',
      'bad gateway',
      'service unavailable',
      'gateway timeout'
    ];

    return retryableErrors.some(err => errorMessage.includes(err));
  },
  onRetry: (attempt: number, error: unknown, delay: number) => {
    logger.debug(`Retry attempt ${attempt}`, {
      attempt,
      error: error instanceof Error ? error.message : String(error),
      delay,
      component: 'retry'
    });
  }
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let totalDelay = 0;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt} of ${config.maxAttempts}`, {
        attempt,
        maxAttempts: config.maxAttempts,
        component: 'retry'
      });

      const data = await operation();

      logger.debug(`Operation succeeded on attempt ${attempt}`, {
        attempt,
        totalDelay,
        component: 'retry'
      });

      return {
        success: true,
        data,
        attempts: attempt,
        totalDelay
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn(`Operation failed on attempt ${attempt}`, {
        attempt,
        error: lastError.message,
        component: 'retry'
      });

      const shouldRetry = attempt < config.maxAttempts && config.retryCondition(lastError);

      if (!shouldRetry) {
        break;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );

      totalDelay += delay;

      config.onRetry(attempt, lastError, delay);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  logger.error(`Operation failed after ${config.maxAttempts} attempts`, {
    maxAttempts: config.maxAttempts,
    totalDelay,
    finalError: lastError?.message,
    component: 'retry'
  }, lastError);

  return {
    success: false,
    ...(lastError && { error: lastError }),
    attempts: config.maxAttempts,
    totalDelay
  };
}

export function createRetryWithBackoff(options?: RetryOptions) {
  return <T>(operation: () => Promise<T>) => withRetry(operation, options);
}

export function isRetryableError(error: unknown): boolean {
  return DEFAULT_OPTIONS.retryCondition(error);
}

export function calculateDelay(attempt: number, baseDelay = 1000, maxDelay = 30000, backoffFactor = 2): number {
  return Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
}