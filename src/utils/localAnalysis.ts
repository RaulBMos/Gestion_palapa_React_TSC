import { calculateAllMetrics } from '@/utils/calculations';
import { Reservation, Transaction } from '@/types';

/**
 * Genera un análisis local basado en KPIs cuando la API de IA falla
 * @param reservations - Array de reservaciones
 * @param transactions - Array de transacciones  
 * @param totalCabins - Número total de cabañas
 * @returns Análisis de texto generado localmente
 */
export const generateLocalAnalysis = (
  reservations: Reservation[],
  transactions: Transaction[],
  totalCabins: number
): string => {
  const metrics = calculateAllMetrics(reservations, transactions, totalCabins);

  // Análisis de ocupación
  const occupancyAnalysis = metrics.occupancyRate >= 70
    ? 'Excelente ocupación actual, indicating strong demand and optimal utilization.'
    : metrics.occupancyRate >= 50
      ? 'Ocupación moderada con room para crecimiento en reservas.'
      : 'Ocupación por debajo del óptimo, considerando estrategias para aumentar reservas.';

  // Análisis financiero
  const profitAnalysis = metrics.profitMargin >= 20
    ? 'Margen de beneficio saludable y sostenible.'
    : metrics.profitMargin >= 10
      ? 'Margen de beneficio acceptable con room para optimización.'
      : 'Margen de beneficio tight, requiere atención a costos y pricing.';

  // Análisis de ADR
  const adrAnalysis = metrics.adr >= 100
    ? 'Tarifa promedio strong, reflejando valor percibido.'
    : metrics.adr >= 50
      ? 'Tarifa promedio competitive en el mercado.'
      : 'Tarifa promedio podría optimizarse para mejorar revenue.';

  // Análisis de duración de estancia
  const stayAnalysis = metrics.avgStayDuration >= 3
    ? 'Duración de estancia óptima, maximizando revenue por reserva.'
    : metrics.avgStayDuration >= 2
      ? 'Duración de estancia adequate, considerando promociones para estadías más largas.'
      : 'Estadías cortas, opportunity para incentivar longer stays.';

  // Análisis de RevPAR
  const revparAnalysis = metrics.revpar >= 70
    ? 'RevPAR excelente, indicating strong overall performance.'
    : metrics.revpar >= 40
      ? 'RevPAR moderate con potential de mejora.'
      : 'RevPAR necesita atención para optimizar revenue.';

  // Recomendaciones específicas
  const recommendations = [];

  if (metrics.occupancyRate < 60) {
    recommendations.push('📈 Implementar campañas de marketing digital para aumentar ocupación');
    recommendations.push('💰 Considerar descuentos para reservas de última hora');
  }

  if (metrics.profitMargin < 15) {
    recommendations.push('📊 Revisar estructura de costos y eliminar gastos no esenciales');
    recommendations.push('💎 Evaluar ajuste de precios basado en demanda');
  }

  if (metrics.avgStayDuration < 2.5) {
    recommendations.push('🏖️ Crear paquetes de estadías extendidas con descuentos');
    recommendations.push('🎯 Ofrecer amenities adicionales para longer stays');
  }

  if (metrics.adr < 75 && metrics.occupancyRate > 70) {
    recommendations.push('📈 Oportunidad para aumentar tarifa promedio debido a alta demanda');
  }

  return `📊 **Análisis Local Basado en KPIs**

## 🔍 **Resumen Ejecutivo**
${occupancyAnalysis} ${profitAnalysis} El RevPAR actual de $${metrics.revpar} indica el rendimiento general.

## 📈 **Métricas Clave**
- **Ocupación:** ${metrics.occupancyRate}% - ${occupancyAnalysis}
- **ADR:** $${metrics.adr} - ${adrAnalysis}  
- **Estancia Promedio:** ${metrics.avgStayDuration} días - ${stayAnalysis}
- **RevPAR:** $${metrics.revpar} - ${revparAnalysis}
- **Margen de Beneficio:** ${metrics.profitMargin.toFixed(1)}% - ${profitAnalysis}

## 💡 **Recomendaciones Estratégicas**
${recommendations.length > 0
      ? recommendations.map(rec => `- ${rec}`).join('\n')
      : '- 🎯 Los indicadores actuales son sólidos, enfocarse en mantener consistencia'
    }

## 📋 **Próximos Pasos**
1. 📊 Monitorear weekly trends en ocupación y revenue
2. 💰 Optimizar pricing basado en demanda seasonality  
3. 🎯 Implementar las recomendaciones prioritarias identificadas
4. 📈 Establecer metas mensuales basadas en current performance

---
*Este análisis fue generado localmente basado en tus datos de negocio actuales.*`;
};