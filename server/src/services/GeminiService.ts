import { GoogleGenAI } from '@google/genai';
import type { Transaction, Reservation } from '../types.js';
import { TransactionType, ReservationStatus } from '../types.js';

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
   * @returns Análisis en formato Markdown
   */
  async analyzeBusinessData(
    transactions: Transaction[],
    reservations: Reservation[]
  ): Promise<string> {
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

    // 2. Construir prompt
    const prompt = `
Actúa como un analista financiero experto en bienes raíces y alquiler vacacional.

DATOS DEL NEGOCIO:
- Ingresos Totales: $${income}
- Gastos Totales: $${expenses}
- Beneficio Neto: $${income - expenses}
- Margen Neto: ${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%
- Reservas Confirmadas Activas: ${confirmedReservations.length}
- Cabañas Ocupadas en Reservas Activas: ${totalCabinsOccupied}
- Huéspedes Próximos (Adultos/Mayores de 5): ${totalAdults}
- Huéspedes Próximos (Niños < 5 años): ${totalChildren}
- Total de Transacciones: ${transactions.length}

SOLICITUD:
Proporciona un análisis profesional en 3 párrafos máximo sobre:
1. Salud general del negocio
2. Ocupación y utilización de cabañas
3. Tendencias financieras

Incluye:
- 2 KPIs clave a vigilar
- 1-2 recomendaciones concretas para mejorar rentabilidad
- Formato: Markdown limpio, sin listas numeradas
    `;

    // 3. Llamar Gemini con timeout
    try {
      const response = await Promise.race([
        this.client.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout excedido (30s)')),
            30000
          )
        ),
      ] as any);

      if (!response?.text) {
        throw new Error('Respuesta vacía de Gemini');
      }

      return response.text;
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
