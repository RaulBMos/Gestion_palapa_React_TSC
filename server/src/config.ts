import 'dotenv/config';

/**
 * Valida que todas las variables de entorno requeridas estén configuradas
 */
export const validateEnv = () => {
  const required = ['GEMINI_API_KEY', 'FRONTEND_URL'];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Falta configurar variables de entorno: ${missing.join(', ')}`);
    process.exit(1);
  }
};

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10),
  
  // Otros
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
