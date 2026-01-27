import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

/**
 * Middleware de rate limiting para proteger endpoints
 */
export const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    standardHeaders: true, // Return rate limit info in the RateLimit-* headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
    skip: (_req: Request) => {
      // No aplicar rate limiting en desarrollo
      return config.isDevelopment;
    },
  });
};

/**
 * Middleware para validar que la API Key esté configurada
 */
export const validateApiKey = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!config.geminiApiKey) {
    res.status(500).json({
      success: false,
      error: 'API Key de Gemini no configurada en el servidor',
    });
    return;
  }
  next();
};

/**
 * Middleware para logging de requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });
  
  next();
};

/**
 * Middleware para manejo de errores global
 */
export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    path: _req.path,
    method: _req.method,
    error: error.message,
    stack: config.isDevelopment ? error.stack : undefined,
  });

  if (error.message.includes('API Key')) {
    res.status(401).json({
      success: false,
      error: 'Error de autenticación con Gemini API',
    });
    return;
  }

  if (error.message.includes('Timeout')) {
    res.status(504).json({
      success: false,
      error: 'La solicitud tardó demasiado. Intenta de nuevo.',
    });
    return;
  }

  if (error.message.includes('validation')) {
    res.status(400).json({
      success: false,
      error: 'Datos inválidos en la solicitud',
      details: error.message,
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
  });
};
