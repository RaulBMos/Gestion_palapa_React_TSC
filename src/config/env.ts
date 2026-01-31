import { z } from 'zod';

/**
 * Esquema de validación para variables de entorno de la aplicación
 * Valida que todas las variables necesarias estén presentes y tengan el formato correcto
 */
const envSchema = z.object({
  // URL del servidor backend para comunicación API
  VITE_SERVER_URL: z.string().url('VITE_SERVER_URL debe ser una URL válida').default('http://localhost:3001'),

  // API Key para Gemini AI (opcional para desarrollo)
  VITE_GEMINI_API_KEY: z.string().min(1, 'VITE_GEMINI_API_KEY es requerida').optional(),

  // URL de la API principal (si es diferente del servidor)
  VITE_API_URL: z.string().url('VITE_API_URL debe ser una URL válida').optional(),

  // Clave de encriptación para datos sensibles
  VITE_ENCRYPTION_KEY: z.string().min(32, 'VITE_ENCRYPTION_KEY debe tener al menos 32 caracteres').optional(),

  // Modo de desarrollo/producción
  VITE_MODE: z.enum(['development', 'production', 'test']).default('development'),

  // Habilitar/deshabilitar debugging
  VITE_DEBUG: z.enum(['true', 'false']).transform(val => val === 'true').default(true),

  // URL base para despliegue
  VITE_BASE_URL: z.string().default('/'),
});

/**
 * Valida las variables de entorno y lanza error si alguna es inválida
 * @returns Variables de entorno validadas y tipadas
 */
function validateEnv() {
  try {
    const env = envSchema.parse({
      VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
      VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY,
      VITE_MODE: import.meta.env.MODE,
      VITE_DEBUG: import.meta.env.VITE_DEBUG,
      VITE_BASE_URL: import.meta.env.BASE_URL,
    });

    // Validaciones adicionales
    if (env.VITE_MODE === 'production' && !env.VITE_SERVER_URL.includes('https')) {
      console.warn('⚠️ Advertencia: En producción se recomienda usar HTTPS');
    }

    if (env.VITE_MODE === 'production' && !env.VITE_GEMINI_API_KEY) {
      console.warn('⚠️ Advertencia: VITE_GEMINI_API_KEY no configurada en producción');
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ Error en las variables de entorno:\n${errorMessage}\n\n` +
        'Por favor, revisa tu archivo .env y añade las variables necesarias.\n' +
        'Puedes copiar el archivo .env.example como referencia.'
      );
    }
    throw error;
  }
}

/**
 * Variables de entorno validadas y tipadas
 * Importar este archivo en lugar de usar import.meta.env directamente
 */
export const env = validateEnv();

// Exportar tipos para TypeScript
export type Env = z.infer<typeof envSchema>;

// Exportar variables individuales para conveniencia
export const {
  VITE_SERVER_URL,
  VITE_GEMINI_API_KEY,
  VITE_API_URL,
  VITE_ENCRYPTION_KEY,
  VITE_MODE,
  VITE_DEBUG,
  VITE_BASE_URL,
} = env;

// Helper para verificar si estamos en desarrollo
export const isDevelopment = env.VITE_MODE === 'development';

// Helper para verificar si estamos en producción
export const isProduction = env.VITE_MODE === 'production';

// Helper para verificar si estamos en testing
export const isTest = env.VITE_MODE === 'test';

// Exportar por defecto el objeto env completo
export default env;