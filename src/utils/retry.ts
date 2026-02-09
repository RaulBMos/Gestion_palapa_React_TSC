import { logger } from '@/utils/logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // número de fracasos antes de abrir el circuito
  successThreshold?: number; // llamadas exitosas necesarias para cerrar el circuito desde HALF_OPEN
  resetTimeout?: number; // tiempo en milisegundos para pasar de OPEN a HALF_OPEN
}

const DEFAULT_CIRCUIT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 3,
  successThreshold: 1,
  resetTimeout: 30_000,
};

export class CircuitBreakerError extends Error {
  constructor(service: string, state: CircuitState, message?: string) {
    super(message ?? `Circuit breaker for ${service} is ${state}`);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private static registry = new Map<string, CircuitBreaker>();
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private halfOpenCallInFlight = false;
  private openedAt = 0;
  private config: Required<CircuitBreakerOptions>;
  private readonly componentContext: { component: string; service: string };

  private constructor(private readonly service: string, overrides?: CircuitBreakerOptions) {
    this.config = { ...DEFAULT_CIRCUIT_OPTIONS, ...overrides };
    this.componentContext = { component: 'circuit-breaker', service };
  }

  static for(service: string, overrides?: CircuitBreakerOptions): CircuitBreaker {
    const key = service.toLowerCase();
    const existing = CircuitBreaker.registry.get(key);

    if (existing) {
      existing.updateConfig(overrides);
      return existing;
    }

    const breaker = new CircuitBreaker(service, overrides);
    CircuitBreaker.registry.set(key, breaker);
    return breaker;
  }

  beforeRequest(): void {
    const now = Date.now();

    if (this.state === CircuitState.OPEN) {
      if (now >= this.openedAt + this.config.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(this.service, this.state);
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCallInFlight) {
        throw new CircuitBreakerError(this.service, this.state, 'Half-open trial already running');
      }

      this.halfOpenCallInFlight = true;
    }
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.resetCounts();
      this.transitionTo(CircuitState.CLOSED);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }

    this.halfOpenCallInFlight = false;
  }

  recordFailure(error?: Error): void {
    this.halfOpenCallInFlight = false;
    this.failureCount += 1;

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.config.failureThreshold) {
      this.open(error);
    }
  }

  private open(error?: Error): void {
    this.resetCounts();
    this.openedAt = Date.now();
    this.transitionTo(CircuitState.OPEN, error);
  }

  private transitionTo(next: CircuitState, error?: Error): void {
    if (this.state === next) {
      return;
    }

    const context = {
      ...this.componentContext,
      previousState: this.state,
      nextState: next,
      error: error?.message,
    };

    switch (next) {
      case CircuitState.OPEN:
        logger.warn('Circuit breaker opened', context);
        break;
      case CircuitState.HALF_OPEN:
        logger.info('Circuit breaker moved to HALF_OPEN', context);
        break;
      case CircuitState.CLOSED:
        logger.info('Circuit breaker closed', context);
        break;
    }

    this.state = next;
  }

  private updateConfig(overrides?: CircuitBreakerOptions): void {
    if (!overrides) {
      return;
    }

    this.config = { ...this.config, ...overrides };
  }

  private resetCounts(): void {
    this.failureCount = 0;
  }
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
  circuitBreakerService?: string;
  circuitBreakerOptions?: CircuitBreakerOptions;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

type RetryDefaults = Required<Omit<RetryOptions, 'circuitBreakerService' | 'circuitBreakerOptions'>>;
type RetryConfig = RetryDefaults & Pick<RetryOptions, 'circuitBreakerService' | 'circuitBreakerOptions'>;

const DEFAULT_OPTIONS: RetryDefaults = {
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
  const config: RetryConfig = { ...DEFAULT_OPTIONS, ...options };
  const circuitBreaker = config.circuitBreakerService
    ? CircuitBreaker.for(config.circuitBreakerService, config.circuitBreakerOptions)
    : undefined;
  let lastError: Error | undefined;
  let totalDelay = 0;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      circuitBreaker?.beforeRequest();
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

      circuitBreaker?.recordSuccess();

      return {
        success: true,
        data,
        attempts: attempt,
        totalDelay
      };

    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));
      circuitBreaker?.recordFailure(lastError);

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
