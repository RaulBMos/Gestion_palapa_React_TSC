import { describe, it, expect } from 'vitest';
import { ResponseValidator, AIValidationError } from '../responseValidator';
import type { CombinedAnalysisData } from '../responseValidator';

const validator = new ResponseValidator();

const combinedResponse: CombinedAnalysisData = {
  success: true,
  data: {
    executiveSummary: 'Executive summary',
    analysis: {
      id: 'analysis-1',
      timestamp: new Date().toISOString(),
      type: 'combined' as const,
      summary: 'analysis summary',
      insights: ['insight'],
      confidence: 0.8,
    },
  },
};

describe('ResponseValidator', () => {
  it('validates a combined response successfully', () => {
    const validated = validator.validate(combinedResponse, 'combined');
    expect(validated.success).toBe(true);
    expect(validated.data).toBeDefined();
    const data = validated.data as NonNullable<CombinedAnalysisData['data']>;
    expect(data.executiveSummary).toBe('Executive summary');
  });

  it('throws AIValidationError when expected fields are missing', () => {
    const existingData = combinedResponse.data!;
    const invalid = { success: true, data: { analysis: existingData.analysis } };
    expect(() => validator.validate(invalid, 'combined')).toThrow(AIValidationError);
  });

  it('safeValidate returns parsed result when valid', () => {
    const validated = validator.safeValidate(combinedResponse, 'combined');
    expect(validated).not.toBeNull();
    expect(validated?.success).toBe(true);
  });

  it('safeValidate returns null when invalid', () => {
    const existingData = combinedResponse.data!;
    const invalid = { success: true, data: { analysis: existingData.analysis } };
    const sanitized = validator.safeValidate(invalid, 'combined');
    expect(sanitized).toBeNull();
  });
});
