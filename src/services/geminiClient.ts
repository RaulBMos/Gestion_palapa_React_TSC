import type { Transaction, Reservation } from '@/types';

interface GeminiClientOptions {
  serverUrl: string;
}

export interface AnalysisPayload {
  transactions: Transaction[];
  reservations: Reservation[];
}

export class GeminiClient {
  private readonly serverUrl: string;

  constructor(options: GeminiClientOptions) {
    this.serverUrl = options.serverUrl;
  }

  public async requestAnalysis(
    payload: AnalysisPayload,
    timeoutMs: number,
    onTimeout?: () => void
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      onTimeout?.();
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(`${this.serverUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
