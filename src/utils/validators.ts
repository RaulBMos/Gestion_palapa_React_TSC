import { z } from 'zod';
import { ReservationStatus, TransactionType, PaymentMethod } from '@/types';

/**
 * Esquema Zod para Cliente
 * Valida: id, name, email, phone, notes (opcional)
 */
export const ClientSchema = z.object({
  id: z
    .string()
    .min(1, 'El ID del cliente es requerido')
    .describe('ID único del cliente'),

  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .describe('Nombre del cliente'),

  email: z
    .string()
    .email('El email debe ser válido')
    .describe('Correo electrónico del cliente'),

  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .describe('Número de teléfono del cliente'),

  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .describe('Notas adicionales sobre el cliente'),
});

/**
 * Esquema Zod para Reservación
 * Incluye validación de que endDate sea posterior a startDate
 */
export const ReservationSchema = z
  .object({
    id: z
      .string()
      .min(1, 'El ID de la reservación es requerido')
      .describe('ID único de la reservación'),

    clientId: z
      .string()
      .min(1, 'El ID del cliente es requerido')
      .describe('ID del cliente asociado'),

    cabinCount: z
      .number()
      .min(1, 'Se requiere al menos 1 cabaña')
      .max(10, 'No se pueden reservar más de 10 cabañas')
      .int('El número de cabañas debe ser un entero')
      .describe('Cantidad de cabañas reservadas'),

    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato ISO (YYYY-MM-DD)')
      .describe('Fecha de inicio de la reservación'),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato ISO (YYYY-MM-DD)')
      .describe('Fecha de fin de la reservación'),

    adults: z
      .number()
      .min(1, 'Se requiere al menos 1 adulto')
      .max(50, 'No pueden haber más de 50 adultos')
      .int('El número de adultos debe ser un entero')
      .describe('Número de adultos (mayores de 5 años)'),

    children: z
      .number()
      .min(0, 'No puede haber números negativos de niños')
      .max(50, 'No pueden haber más de 50 niños')
      .int('El número de niños debe ser un entero')
      .describe('Número de niños (menores de 5 años)'),

    totalAmount: z
      .number()
      .positive('El monto total debe ser positivo')
      .describe('Monto total de la reservación'),

    status: z
      .enum([
        ReservationStatus.INFORMATION,
        ReservationStatus.CONFIRMED,
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELLED,
      ])
      .describe('Estado de la reservación'),

    isArchived: z
      .boolean()
      .optional()
      .describe('Indica si la reservación está archivada'),
  })
  // ✅ Validación personalizada: endDate debe ser posterior a startDate
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'], // El error se asocia al campo endDate
    }
  )
  // ✅ Validación adicional: la reservación no puede durar más de 365 días
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const daysReserved = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysReserved <= 365;
    },
    {
      message: 'La reservación no puede ser mayor a 365 días',
      path: ['endDate'],
    }
  );

/**
 * Esquema Zod para Transacción
 */
export const TransactionSchema = z.object({
  id: z
    .string()
    .min(1, 'El ID de la transacción es requerido')
    .describe('ID único de la transacción'),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'La fecha debe estar en formato ISO (YYYY-MM-DD)')
    .describe('Fecha de la transacción'),

  amount: z
    .number()
    .positive('El monto debe ser positivo')
    .describe('Monto de la transacción'),

  type: z
    .enum([TransactionType.INCOME, TransactionType.EXPENSE])
    .describe('Tipo de transacción (Ingreso o Gasto)'),

  category: z
    .string()
    .min(1, 'La categoría es requerida')
    .max(50, 'La categoría no puede exceder 50 caracteres')
    .describe('Categoría de la transacción'),

  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(300, 'La descripción no puede exceder 300 caracteres')
    .describe('Descripción de la transacción'),

  paymentMethod: z
    .enum([PaymentMethod.CASH, PaymentMethod.TRANSFER])
    .describe('Método de pago'),

  reservationId: z
    .string()
    .optional()
    .describe('ID de la reservación asociada (opcional)'),
});

/**
 * Función genérica para validar datos con Zod
 * Lanza errores descriptivos si los datos no cumplen el esquema
 *
 * @param schema - Esquema de Zod
 * @param data - Datos a validar
 * @returns Datos validados con type T
 * @throws Error con mensaje descriptivo si la validación falla
 *
 * @example
 * const client = validateData(ClientSchema, userData);
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Formatear errores de Zod de forma legible
      const errorMessages = error.issues
        .map((err) => {
          const path = err.path.length > 0 ? err.path.join('.') : 'root';
          return `${path}: ${err.message}`;
        })
        .join('\n');

      throw new Error(`Validación fallida:\n${errorMessages}`);
    }

    // Si no es un error de Zod, re-lanzar el error original
    throw error;
  }
}

/**
 * Función para validar de forma segura sin lanzar error
 * Retorna un objeto con { success, data, errors }
 *
 * @param schema - Esquema de Zod
 * @param data - Datos a validar
 * @returns Objeto con resultado de validación
 *
 * @example
 * const result = safeValidateData(ClientSchema, userData);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.log(result.errors);
 * }
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const validatedData = schema.parse(data) as T;
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root';
        return `${path}: ${err.message}`;
      });

      return { success: false, errors };
    }

    return {
      success: false,
      errors: ['Error desconocido durante la validación'],
    };
  }
}

/**
 * Función para validar parcialmente (solo propiedades proporcionadas)
 * Útil para actualizaciones parciales
 *
 * @param schema - Esquema de Zod
 * @param data - Datos a validar
 * @returns Datos validados
 *
 * @example
 * const partialClient = partialValidateData(ClientSchema, { name: 'Juan' });
 */
export function partialValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Partial<T> {
  try {
    // Hacer todas las propiedades opcionales
    const partialSchema = schema instanceof z.ZodObject ? schema.partial() : schema;
    return partialSchema.parse(data) as Partial<T>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err) => {
          const path = err.path.length > 0 ? err.path.join('.') : 'root';
          return `${path}: ${err.message}`;
        })
        .join('\n');

      throw new Error(`Validación parcial fallida:\n${errorMessages}`);
    }

    throw error;
  }
}

/**
 * Tipos exportados para uso en componentes
 * Permiten type safety al trabajar con datos validados
 */
export type ValidatedClient = z.infer<typeof ClientSchema>;
export type ValidatedReservation = z.infer<typeof ReservationSchema>;
export type ValidatedTransaction = z.infer<typeof TransactionSchema>;

export default {
  ClientSchema,
  ReservationSchema,
  TransactionSchema,
  validateData,
  safeValidateData,
  partialValidateData,
};
