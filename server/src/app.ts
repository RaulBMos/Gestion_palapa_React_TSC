import express from 'express';
import cors from 'cors';
import { config, validateEnv } from './config.js';
import { createRateLimiter, validateApiKey, requestLogger, errorHandler } from './middleware/index.js';
import { authenticateSupabaseJwt } from './middleware/auth.js';
import apiRoutes from './routes/index.js';

/**
 * Inicializa y configura la aplicación Express
 */
export const createApp = () => {
  const app = express();

  // Middlewares globales
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request logging
  app.use(requestLogger);

  // CORS - Solo permitir el frontend especificado
  app.use(
    cors({
      origin: (origin, callback) => {
        // En desarrollo, permitir localhost
        if (config.isDevelopment) {
          callback(null, true);
          return;
        }

        // En producción, solo permitir el frontend URL configurado
        if (origin === config.frontendUrl || !origin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400, // 24 horas
    })
  );

  // Rate limiting
  const rateLimiter = createRateLimiter(
    config.rateLimitWindowMs,
    config.rateLimitMaxRequests
  );
  app.use('/api/', rateLimiter);

  // Validar autenticación y API Key
  app.use('/api/', authenticateSupabaseJwt);
  app.use('/api/', validateApiKey);

  // Rutas API
  app.use('/api', apiRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint no encontrado',
      path: req.path,
    });
  });

  // Error handler (debe ser el último middleware)
  app.use(errorHandler);

  return app;
};

/**
 * Inicia el servidor
 */
export const startServer = async () => {
  try {
    // Validar variables de entorno
    validateEnv();

    const app = createApp();

    app.listen(config.port, () => {
      console.log(`\n✅ Servidor iniciado en puerto ${config.port}`);
      console.log(`📍 Entorno: ${config.nodeEnv}`);
      console.log(`🌐 Frontend URL permitida: ${config.frontendUrl}`);
      console.log(`\n🔗 Health check: http://localhost:${config.port}/api/health`);
      console.log(`🤖 Análisis endpoint: POST http://localhost:${config.port}/api/analyze\n`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};
