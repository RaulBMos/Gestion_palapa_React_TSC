# Reporte de Auditoría Técnica: CasaGestión PWA
---
## 1. Análisis de Arquitectura y Estructura
[ESTADO] **Crítico/Mejorable**

**Explicación:**
La estructura actual es híbrida e inconsistente. Existen carpetas raíz (`hooks`, `contexts`, `components`) que duplican o compiten con las carpetas dentro de `src`.
- `hooks/useDashboardLogic.ts` vs `src/hooks`
- `components/molecules/DashboardCharts.tsx` vs `src/components`
- `contexts/DataContext.tsx` está en la raíz, pero el punto de entrada `index.tsx` referencia a archivos en `src` que a su vez referencian hacia afuera.

Esto rompe el principio de encapsulamiento: `src` debería contener TODO el código fuente de la aplicación. Mantener código fuera de `src` complica la configuración de herramientas de build (como vimos con el error de Vite) y hace difícil para nuevos desarrolladores entender dónde vive la "verdad".

**Acción Sugerida:**
Refactorización de "Unificación en Source":
1. Mover `contexts/`, `hooks/`, `components/`, `utils/`, y `types/` DENTRO de `src/`.
2. Actualizar todas las importaciones relativas.
3. Eliminar las carpetas raíz obsoletas una vez migradas.
4. Estandarizar Atomic Design: Asegurar que `src/components` siga estrictamente `atoms`, `molecules`, `organisms`, `templates`, `pages`.

## 2. Robustez y Manejo de Errores
[ESTADO] **Bien (en Backend/Servicios) / Mejorable (en UI)**

**Explicación:**
- **Backend/Servicios:** `geminiService.ts` tiene un manejo de errores ejemplar. Usa `Zod` para validación de esquemas (evitando errores de runtime por datos malformados), implementa lógica de reintentos (exponential backoff) y tiene tipos estrictos.
- **UI:** Existe un `ErrorBoundary.tsx` implementado y usado en `App.tsx` envolviendo la aplicación. Esto previene la "Pantalla Blanca de la Muerte".
- **Logging:** Se usa un `logger` utility, lo cual es buena práctica.
- **Riesgo:** El uso de `AppContent` con `useState` para el enrutamiento manual (`renderView` switch) es frágil. Si un componente falla dentro de una "vista", podría no haber un Error Boundary lo suficientemente granular para recuperar solo esa sección del dashboard.

**Acción Sugerida:**
1. Mantener el `ErrorBoundary` global.
2. Considerar ErrorBoundaries más granulares alrededor de widgets críticos (ej: el panel de IA o los gráficos), para que si falla un gráfico, no colapse toda la app.
3. Migrar el enrutamiento manual a `react-router-dom` para mejor manejo de historial y lazy loading real por ruta, no solo por componente.

## 3. Calidad de Código y Tipado (TS)
[ESTADO] **Bien**

**Explicación:**
- Se ha realizado un esfuerzo consciente para eliminar `any`. La refactorización reciente en `geminiService` y `DashboardCharts` demuestra compromiso con la seguridad de tipos.
- `tsconfig.json` tien `strict: true`.
- Los tipos están centralizados en `src/types/index.ts` (y `ai.schema.ts`), lo que facilita la reutilización y consistencia.
- El uso de JSDoc en hooks complejos como `useDashboardLogic` es excelente.

**Acción Sugerida:**
- Continuar con la disciplina de "Cero Any".
- Ejecutar `tsc --noEmit` en el CI/CD pipeline para bloquear commits que introduzcan errores de tipo.

## 4. Cobertura de Pruebas y QA
[ESTADO] **Crítico**

**Explicación:**
- **Cobertura Baja:** El reporte de `vitest` indica que fallan tests básicos (`tests/e2e/basic.spec.ts` falló). Muchos archivos tienen 0% de cobertura.
- **Infraestructura:** La infraestructura está ahí (`vitest`, `playwright`, `jest-dom`), pero los tests no están pasando o están vacíos.
- **Riesgo:** Sin tests confiables, cualquier refactorización (como la sugerida en el punto 1) es de alto riesgo.

**Acción Sugerida:**
1. **Prioridad 1:** Arreglar `tests/e2e/basic.spec.ts`. Un test "Smoke" que verifique que la app carga es esencial.
2. Crear tests unitarios para `useDashboardLogic` y `calculations.ts` (lógica de negocio pura de alto valor).
3. Ignorar cobertura de UI por ahora y enfocarse en lógica crítica (Cálculos financieros, Integración IA).

## 5. Checklist de Producción (PWA & Performance)
[ESTADO] **Bien**

**Explicación:**
- **PWA:** `vite-plugin-pwa` está configurado con estrategias de caché complejas (`CacheFirst` para assets, `NetworkFirst` para API, `StaleWhileRevalidate` para HTML). Esto es nivel "Big Tech".
- **Performance:** Se usa `React.lazy` y `Suspense` para cargar gráficos pesados (`recharts`) y el panel de IA. Esto mejora drásticamente el TTI (Time to Interactive).
- **Bundle Analysis:** Los logs de build mostraron chunks separados correctamente (`DashboardCharts`, `index`, `AIAnalysisPanel`), indicando que el code-splitting funciona.

**Acción Sugerida:**
- Verificar que el Service Worker se registre correctamente en producción (https).
- Auditar con Lighthouse una vez desplegado.

## 6. Integración de IA
[ESTADO] **Mejorable (Seguridad)**

**Explicación:**
- **Funcionalidad:** La integración es robusta (validación Zod, fallbacks).
- **Seguridad:** La API Key está en `.env.local` (`VITE_GEMINI_API_KEY`). Al usar `VITE_`, esta variable se inyecta en el bundle del cliente. **Esto expone la API Key a cualquier usuario que inspeccione el código.**
- Google Gemini permite restricciones por origen (HTTP Referrer), lo cual mitiga el riesgo, pero la mejor práctica FAANG es nunca exponer la key en el frontend.

**Acción Sugerida:**
- **Inmediato:** Asegurar que la API Key en Google Cloud Console tenga restricciones estrictas de dominio (solo permitir solicitudes desde tu dominio de producción).
- **Ideal:** Crear un pequeño proxy backend (Serverless Function / Edge Function) que tenga la key segura y que el frontend llame a este proxy, no a Google directamente.

## 7. Conclusión: ¿Está listo para el despliegue?
**NO INMEDIATAMENTE.**

Aunque la aplicación compila y tiene buena base técnica, la **estructura de carpetas incoherente** y la **falta de tests básicos que pasen** son bloqueantes para un estándar de "Big Tech". Un despliegue ahora sería frágil y difícil de mantener.

**Roadmap de 24 horas:**
1. ✅ [HECHO] Fix de Tipos y Build (Vite config).
2. 🔄 [PENDIENTE] Mover carpetas raíz a `src/`.
3. 🔄 [PENDIENTE] Arreglar el test E2E de humo.
4. 🚀 Desplegar.
