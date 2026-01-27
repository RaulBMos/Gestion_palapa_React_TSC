import { z } from 'zod';


/**
 * Esquema para validación de transacciones
 */
export const TransactionSchema = z.object({
  id: z.string(),
  date: z.string().datetime().or(z.string().date()),
  amount: z.number().positive(),
  type: z.enum(['Ingreso', 'Gasto']),
  category: z.string().min(1),
  description: z.string().min(1),
  paymentMethod: z.enum(['Efectivo', 'Transferencia']),
  reservationId: z.string().optional(),
});

/**
 * Esquema para validación de reservaciones
 */
export const ReservationSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  cabinCount: z.number().int().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  adults: z.number().int().nonnegative(),
  children: z.number().int().nonnegative(),
  totalAmount: z.number().positive(),
  status: z.enum(['Información', 'Confirmada', 'Completada', 'Cancelada']),
  isArchived: z.boolean().optional(),
});

/**
 * Esquema para el body del request de análisis
 */
export const AnalyzeRequestSchema = z.object({
  transactions: z.array(TransactionSchema),
  reservations: z.array(ReservationSchema),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type ValidatedTransaction = z.infer<typeof TransactionSchema>;
export type ValidatedReservation = z.infer<typeof ReservationSchema>;

/**
 * Valida y parsea el body del request
 */
export const validateAnalyzeRequest = (data: unknown): AnalyzeRequest => {
  return AnalyzeRequestSchema.parse(data);
};
