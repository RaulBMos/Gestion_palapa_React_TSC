import { describe, it, expect } from 'vitest';
import { ResponseValidator, AIValidationError } from '../responseValidator';
import type {
  CombinedAnalysisData,
  FinancialAnalysisData,
  ReservationAnalysisData,
} from '../responseValidator';

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

const financialResponse: FinancialAnalysisData = {
  success: true,
  data: {
    type: 'financial',
    summary: 'financial summary',
    insights: ['metric'],
    confidence: 0.5,
  },
};

const reservationResponse: ReservationAnalysisData = {
  success: true,
  data: {
    type: 'reservation',
    summary: 'reservation summary',
    insights: ['occupancy'],
    confidence: 0.6,
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

  it('validates a financial response when expectedType is financial', () => {
    const validated = validator.validate(financialResponse, 'financial') as FinancialAnalysisData;
    expect(validated.data?.summary).toBe('financial summary');
  });

  it('validates a reservation response when expectedType is reservation', () => {
    const validated = validator.validate(reservationResponse, 'reservation') as ReservationAnalysisData;
    expect(validated.data?.summary).toBe('reservation summary');
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

  it('returns null when input string is malformed JSON', () => {
    const sanitized = validator.safeValidate('not-json', 'combined');
    expect(sanitized).toBeNull();
  });

  it('throws AIValidationError when validate receives malformed string', () => {
    expect(() => validator.validate('not-json', 'combined')).toThrow(AIValidationError);
  });
});
