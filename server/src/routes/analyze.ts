import type { Request, Response } from 'express';
import GeminiAnalysisService from '../services/GeminiService.js';
import { validateAnalyzeRequest, type ValidatedTransaction, type ValidatedReservation } from '../validators.js';
import { config } from '../config.js';

// Define proper interfaces that match the client types
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

enum TransactionType { INCOME = 'Ingreso', EXPENSE = 'Gasto' }
enum PaymentMethod { CASH = 'Efectivo', TRANSFER = 'Transferencia' }
enum ReservationStatus { 
  INFORMATION = 'Información', 
  CONFIRMED = 'Confirmada', 
  COMPLETED = 'Completada', 
  CANCELLED = 'Cancelada' 
}

// Helper function to convert validated types to proper Transaction/Reservation types
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
 * Handler para el endpoint POST /api/analyze
 * Recibe transacciones y reservaciones, retorna análisis de Gemini
 */
export const analyzeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validar request body
    const data = validateAnalyzeRequest(req.body);

    // 2. Validar que haya datos
    if (data.transactions.length === 0 && data.reservations.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Se requieren transacciones o reservaciones para el análisis',
      });
      return;
    }

    // 3. Crear servicio de Gemini
    const geminiService = new GeminiAnalysisService(config.geminiApiKey);

    // 4. Convert validated data to proper types
    const transactions = data.transactions.map(convertToTransaction);
    const reservations = data.reservations.map(convertToReservation);

    // 5. Llamar servicio
    const analysis = await geminiService.analyzeBusinessData(
      transactions,
      reservations
    );

    // 5. Retornar respuesta exitosa
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    console.error('Analysis Error:', {
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });

    // Errores específicos
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
      error: `Error en análisis: ${errorMessage}`,
    });
  }
};
