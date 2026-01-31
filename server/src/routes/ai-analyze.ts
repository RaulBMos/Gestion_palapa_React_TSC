import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { validateAnalyzeRequest, type ValidatedTransaction, type ValidatedReservation } from '../validators.js';

// Define interfaces that match the service layer
interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  reservationId?: string;
}

interface Reservation {
  id: string;
  clientId: string;
  cabinCount: number;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: ReservationStatus;
  isArchived?: boolean;
}

enum TransactionType { 
  INCOME = 'Ingreso', 
  EXPENSE = 'Gasto' 
}

enum PaymentMethod { 
  CASH = 'Efectivo', 
  TRANSFER = 'Transferencia' 
}

enum ReservationStatus { 
  INFORMATION = 'Información', 
  CONFIRMED = 'Confirmada', 
  COMPLETED = 'Completada', 
  CANCELLED = 'Cancelada' 
}

// Helper functions to convert validated data
const convertToTransaction = (validated: ValidatedTransaction): Transaction => {
  const result: Transaction = {
    id: validated.id,
    date: validated.date,
    amount: validated.amount,
    type: validated.type === 'Ingreso' ? TransactionType.INCOME : TransactionType.EXPENSE,
    category: validated.category,
    description: validated.description,
    paymentMethod: validated.paymentMethod === 'Efectivo' ? PaymentMethod.CASH : PaymentMethod.TRANSFER,
  };
  if (validated.reservationId) {
    result.reservationId = validated.reservationId;
  }
  return result;
};

const convertToReservation = (validated: ValidatedReservation): Reservation => {
  const result: Reservation = {
    id: validated.id,
    clientId: validated.clientId,
    cabinCount: validated.cabinCount,
    startDate: validated.startDate,
    endDate: validated.endDate,
    adults: validated.adults,
    children: validated.children,
    totalAmount: validated.totalAmount,
    status: validated.status === 'Información' ? ReservationStatus.INFORMATION :
             validated.status === 'Confirmada' ? ReservationStatus.CONFIRMED :
             validated.status === 'Completada' ? ReservationStatus.COMPLETED :
             ReservationStatus.CANCELLED,
  };
  if (validated.isArchived !== undefined) {
    result.isArchived = validated.isArchived;
  }
  return result;
};

/**
 * Handler para el endpoint POST /api/ai/analyze
 * Analiza datos de negocio usando Gemini AI directamente en el endpoint
 */
export const aiAnalyzeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validar request body con Zod
    const data = validateAnalyzeRequest(req.body);

    // 2. Validar que haya datos para analizar
    if (data.transactions.length === 0 && data.reservations.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Se requieren transacciones o reservaciones para el análisis',
      });
      return;
    }

    // 3. Convertir datos validados a tipos correctos
    const transactions = data.transactions.map(convertToTransaction);
    const reservations = data.reservations.map(convertToReservation);

    // 4. Calcular métricas de negocio
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

    // 5. Construir prompt para Gemini
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

    // 6. Inicializar cliente Gemini con API key del entorno
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      res.status(500).json({
        success: false,
        error: 'Error de configuración: GEMINI_API_KEY no disponible',
      });
      return;
    }

    const geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });

    // 7. Llamar a Gemini con timeout
    const response = await Promise.race([
      geminiClient.models.generateContent({
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

    // 8. Retornar respuesta exitosa
    res.status(200).json({
      success: true,
      data: response.text,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    console.error('AI Analysis Error:', {
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });

    // Manejo específico de errores
    if (errorMessage.includes('429')) {
      res.status(429).json({
        success: false,
        error: 'Límite de solicitudes alcanzado. Intenta en 1 minuto.',
      });
      return;
    }

    if (errorMessage.includes('401') || errorMessage.includes('API Key')) {
      res.status(401).json({
        success: false,
        error: 'Error de autenticación con Gemini',
      });
      return;
    }

    if (errorMessage.includes('Timeout')) {
      res.status(504).json({
        success: false,
        error: 'La solicitud tardó demasiado. Intenta de nuevo.',
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      success: false,
      error: `Error en análisis de IA: ${errorMessage}`,
    });
  }
};