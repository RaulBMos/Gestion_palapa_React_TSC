import type { Request, Response } from 'express';
import GeminiAnalysisService from '../services/GeminiService.js';
import { validateAnalyzeRequest } from '../validators.js';
import { config } from '../config.js';

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

    // 4. Llamar servicio
    const analysis = await geminiService.analyzeBusinessData(
      data.transactions,
      data.reservations
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
