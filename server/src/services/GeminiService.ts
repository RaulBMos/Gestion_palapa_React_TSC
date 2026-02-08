import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type { Transaction, Reservation } from '../types.js';
import { TransactionType, ReservationStatus } from '../types.js';

const AnalysisResponseSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().optional(),
  type: z.enum(['financial', 'reservation', 'combined']),
  summary: z.string(),
  insights: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1).optional(),
});

const MetricsSchema = z.object({
  total: z.number(),
  average: z.number().optional(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
  change: z.number().optional(),
});

const RecommendationSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  action: z.string(),
  expectedOutcome: z.string(),
  timeline: z.string().optional(),
});

const ComplexAnalysisSchema = z.object({
  executiveSummary: z.string(),
  analysis: AnalysisResponseSchema,
  metrics: MetricsSchema.optional(),
  recommendations: z.array(RecommendationSchema).optional(),
});

type ComplexAnalysis = z.infer<typeof ComplexAnalysisSchema>;

const extractJsonPayload = (text: string): string => {
  const jsonFenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonFenceMatch) {
    return jsonFenceMatch[1].trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }
  return text.trim();
};

/**
 * Servicio de análisis de negocio usando Google Gemini AI
 * API Key se mantiene segura en el servidor
 */
class GeminiAnalysisService {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Analiza datos de negocio usando Gemini AI
   * @param transactions - Array de transacciones
   * @param reservations - Array de reservaciones
   * @returns Análisis estructurado según ComplexAnalysisSchema
   */
  async analyzeBusinessData(
    transactions: Transaction[],
    reservations: Reservation[]
  ): Promise<ComplexAnalysis> {
    // 1. Calcular métricas
    const income = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const confirmedReservations = reservations.filter(
      r => r.status === ReservationStatus.CONFIRMED
    );

    const totalAdults = confirmedReservations.reduce((acc, r) => acc + r.adults, 0);
    const totalChildren = confirmedReservations.reduce(
      (acc, r) => acc + r.children,
      0
    );
    const totalCabinsOccupied = confirmedReservations.reduce(
      (acc, r) => acc + r.cabinCount,
      0
    );

    const netProfit = income - expenses;
    const margin = income > 0 ? (netProfit / income) * 100 : 0;
    const analysisType = transactions.length > 0 && reservations.length > 0
      ? 'combined'
      : transactions.length > 0
        ? 'financial'
        : 'reservation';

    // 2. Construir prompt
    const prompt = `
Eres un analista financiero especializado en hospitalidad.
Analiza el negocio usando exclusivamente la información numérica proporcionada.

Datos cuantitativos:
{
  "income": ${income.toFixed(2)},
  "expenses": ${expenses.toFixed(2)},
  "netProfit": ${netProfit.toFixed(2)},
  "profitMargin": ${margin.toFixed(2)},
  "confirmedReservations": ${confirmedReservations.length},
  "totalCabinsOccupied": ${totalCabinsOccupied},
  "upcomingAdults": ${totalAdults},
  "upcomingChildren": ${totalChildren},
  "transactionCount": ${transactions.length}
}

Responde ÚNICAMENTE con JSON válido (sin texto adicional, comentarios ni bloques de código) que cumpla exactamente con la siguiente forma:
{
  "executiveSummary": string,
  "analysis": {
    "id": string opcional,
    "timestamp": string ISO opcional,
    "type": "financial" | "reservation" | "combined",
    "summary": string,
    "insights": string[],
    "confidence": number entre 0 y 1 opcional
  },
  "metrics": {
    "total": number,
    "average": number opcional,
    "trend": "up" | "down" | "stable" opcional,
    "change": number opcional
  } opcional,
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": string,
      "expectedOutcome": string,
      "timeline": string opcional
    }
  ] opcional
}

Requisitos adicionales:
- Usa "type" = "${analysisType}".
- Proporciona al menos dos elementos en "insights".
- Si no hay recomendaciones, devuelve un arreglo vacío en "recommendations".
- Asegúrate de que todos los números estén en formato numérico (no cadenas).
    `;

    // 3. Llamar Gemini con timeout
    try {
      const response = await Promise.race([
        this.client.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout excedido (30s)')),
            30000
          )
        ),
      ]);

      const result = response as { text?: string };

      if (!result?.text) {
        throw new Error('Respuesta vacía de Gemini');
      }

      const rawJson = extractJsonPayload(result.text);
      let parsed: unknown;

      try {
        parsed = JSON.parse(rawJson);
      } catch (parseError) {
        throw new Error(`No se pudo parsear la respuesta de Gemini a JSON válido: ${(parseError as Error).message}`);
      }

      const validated = ComplexAnalysisSchema.parse(parsed);

      const ensured: ComplexAnalysis = complexAnalysisPostProcess(validated, analysisType);

      return ComplexAnalysisSchema.parse(ensured);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Gemini API Error:', {
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });
      throw error;
    }
  }
}

export default GeminiAnalysisService;

const complexAnalysisPostProcess = (analysis: ComplexAnalysis, analysisType: 'financial' | 'reservation' | 'combined'): ComplexAnalysis => {
  const timestamp = analysis.analysis.timestamp ?? new Date().toISOString();
  return {
    ...analysis,
    analysis: {
      ...analysis.analysis,
      timestamp,
      type: analysisType,
    },
    recommendations: analysis.recommendations ?? [],
  };
};
