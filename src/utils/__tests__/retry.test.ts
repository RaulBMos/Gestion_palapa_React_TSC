import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withRetry, CircuitBreakerError } from '../retry';

vi.mock('@/utils/logger', () => {
  const warn = vi.fn();
  const info = vi.fn();
  const debug = vi.fn();
  const error = vi.fn();

  return {
    logger: { warn, info, debug, error },
    logError: vi.fn(),
    logWarning: vi.fn(),
    logInfo: vi.fn(),
    logDebug: vi.fn(),
  };
});

import { logger } from '@/utils/logger';

const loggerMock = logger as typeof logger & {
  warn: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

describe('Circuit breaker integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const createFailingOperation = () => {
    return vi.fn(async () => {
      throw new Error('boom');
    });
  };

  const openBreaker = async (service: string, failOp: ReturnType<typeof createFailingOperation>) => {
    const retryConfig = {
      maxAttempts: 1,
      circuitBreakerService: service,
      circuitBreakerOptions: {
        failureThreshold: 5,
        resetTimeout: 30_000,
      },
    };

    for (let i = 0; i < 5; i += 1) {
      const result = await withRetry(failOp, retryConfig);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('boom');
    }

    return retryConfig;
  };

  it('opens the circuit after the configured failure threshold', async () => {
    const service = 'breaker-open-after-threshold';
    const failingOperation = createFailingOperation();
    const retryConfig = await openBreaker(service, failingOperation);

    await expect(withRetry(failingOperation, retryConfig)).rejects.toBeInstanceOf(CircuitBreakerError);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      'Circuit breaker opened',
      expect.objectContaining({ service, nextState: 'OPEN' })
    );
  });

  it('does not execute the wrapped operation while the breaker is open', async () => {
    const service = 'breaker-blocks-execution';
    const failingOperation = createFailingOperation();
    const retryConfig = await openBreaker(service, failingOperation);

    const blockedOperation = vi.fn(async () => 'unreachable');
    await expect(withRetry(blockedOperation, retryConfig)).rejects.toBeInstanceOf(CircuitBreakerError);
    expect(blockedOperation).not.toHaveBeenCalled();
  });

  it('moves into HALF_OPEN after the reset timeout and allows one trial call', async () => {
    const service = 'breaker-half-open';
    const failingOperation = createFailingOperation();
    const retryConfig = await openBreaker(service, failingOperation);

    vi.advanceTimersByTime(30_000);

    const successOperation = vi.fn(async () => 'ok');
    const result = await withRetry(successOperation, retryConfig);

    expect(result.success).toBe(true);
    expect(result.data).toBe('ok');
    expect(successOperation).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith(
      'Circuit breaker moved to HALF_OPEN',
      expect.objectContaining({ service, nextState: 'HALF_OPEN' })
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      'Circuit breaker closed',
      expect.objectContaining({ service, nextState: 'CLOSED' })
    );
  });

  it('fully recovers to CLOSED after a successful HALF_OPEN trial', async () => {
    const service = 'breaker-recovery';
    const failingOperation = createFailingOperation();
    const retryConfig = await openBreaker(service, failingOperation);

    vi.advanceTimersByTime(30_000);
    await withRetry(vi.fn(async () => 'fixed'), retryConfig);

    const recoveryOperation = vi.fn(async () => {
      throw new Error('retry');
    });

    for (let i = 0; i < 4; i += 1) {
      const result = await withRetry(recoveryOperation, retryConfig);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('retry');
    }

    const fifthResult = await withRetry(recoveryOperation, retryConfig);
    expect(fifthResult.success).toBe(false);
    await expect(withRetry(recoveryOperation, retryConfig)).rejects.toBeInstanceOf(CircuitBreakerError);
  });
});
