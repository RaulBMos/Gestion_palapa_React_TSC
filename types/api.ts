import { Transaction, Reservation } from '../types';

// Interfaces tipadas para respuestas de API de Gemini
export interface GeminiAnalysisRequest {
  transactions: Transaction[];
  reservations: Reservation[];
  totalCabins: number;
}

export interface GeminiAnalysisResponse {
  analysis: string;
  confidence: number;
  suggestions: string[];
}

export interface GeminiErrorResponse {
  error: string;
  code: string;
  retryAfter?: number;
}