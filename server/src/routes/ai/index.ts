import { Router } from 'express';
import { aiAnalyzeHandler } from '../ai-analyze.js';

const router = Router();

/**
 * POST /api/ai/analyze
 * Endpoint para análisis de datos con Gemini AI (lógica integrada)
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
router.post('/analyze', aiAnalyzeHandler);

export default router;