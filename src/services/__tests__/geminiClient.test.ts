import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClient } from '../geminiClient';

describe('GeminiClient', () => {
  const serverUrl = 'https://example.com';
  const client = new GeminiClient({ serverUrl });
  const payload = { transactions: [], reservations: [] };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the payload to the configured endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const response = await client.requestAnalysis(payload, 1000);

    expect(fetchMock).toHaveBeenCalledWith(`${serverUrl}/api/analyze`, expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: expect.any(AbortSignal),
    }));
    expect(response).toEqual(expect.objectContaining({ ok: true, status: 200 }));
  });

  it('triggers onTimeout when the timer fires and rejects the pending fetch', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const fetchMock = vi.fn((_, options) => {
      const signal = options?.signal as AbortSignal | undefined;
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('AbortError')));
      });
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const promise = client.requestAnalysis(payload, 5, onTimeout);

    vi.advanceTimersByTime(5);
    await expect(promise).rejects.toThrow('AbortError');
    expect(onTimeout).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
