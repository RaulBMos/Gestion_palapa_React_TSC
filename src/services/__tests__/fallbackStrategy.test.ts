import { describe, it, expect } from 'vitest';
import { FallbackStrategy } from '../fallbackStrategy';
import { AIValidationError } from '../responseValidator';
import type { CombinedAnalysisData } from '../responseValidator';

const strategy = new FallbackStrategy();

const combinedResponse: CombinedAnalysisData = {
  success: true,
  data: {
    executiveSummary: '<script>malicious()</script><p>safe summary</p>',
    analysis: {
      id: 'analysis-id',
      timestamp: new Date().toISOString(),
      type: 'combined',
      summary: 'summary',
      insights: ['one'],
    },
  },
};

describe('FallbackStrategy', () => {
  it('sanitizes executive summary output', () => {
    const sanitized = strategy.getSanitizedSummary(combinedResponse, 'combined');
    expect(sanitized).toContain('<p>safe summary</p>');
    expect(sanitized).not.toContain('<script>');
  });

  it('classifies timeout errors', () => {
    const state = strategy.buildFinalErrorState('timeout', true, 2000, 3);
    expect(state.errorType).toBe('TIMEOUT');
  });

  it('classifies network errors', () => {
    const state = strategy.buildFinalErrorState('Failed to fetch', false, 1000, 3);
    expect(state.errorType).toBe('NETWORK_ERROR');
  });

  it('recognizes user-initiated aborts', () => {
    const state = strategy.buildFinalErrorState('AbortError', false, 1000, 3);
    expect(state.errorType).toBe('USER_CANCELLED');
  });

  it('defaults to max retries exceeded on others', () => {
    const state = strategy.buildFinalErrorState('something else', false, 1000, 3);
    expect(state.errorType).toBe('MAX_RETRIES_EXCEEDED');
  });

  it('detects AI validation errors', () => {
    const validationError = new AIValidationError('fail', new Error('details'), {});
    expect(strategy.isValidationError(validationError)).toBe(true);
    expect(strategy.isValidationError(new Error('generic'))).toBe(false);
  });
});
