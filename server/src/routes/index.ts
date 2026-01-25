import express from 'express';
import type { Request, Response } from 'express';
import { analyzeHandler } from './analyze.js';

/**
 * Router para los endpoints de la API
 */
const router = express.Router();

/**
 * GET /api/health
 * Endpoint de health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/analyze
 * Endpoint para análisis de datos con Gemini AI
 * 
 * Body:
 * {
 *   transactions: Transaction[],
 *   reservations: Reservation[]
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   data?: string (markdown analysis),
 *   error?: string
 * }
 */
router.post('/analyze', analyzeHandler);

export default router;
