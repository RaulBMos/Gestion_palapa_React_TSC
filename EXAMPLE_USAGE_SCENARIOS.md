# 🎬 Ejemplo Práctico: Flujo Completo de Análisis de IA

## Escenarios de Uso

### Escenario 1: ✅ Análisis Exitoso (Happy Path)

```
1. Usuario abre Dashboard
   └─ Ve botón: "🔮 Analizar con IA"

2. Usuario hace click
   └─ Estado cambia a: "🔄 Analizando..."
   └─ Aparece botón: "✖ Cancelar"

3. Dashboard llama a analyzeBusinessData()
   ├─ Crea AbortController
   ├─ Configura timeout de 20s
   └─ Envía POST a /api/analyze

4. Servidor responde en 3 segundos
   └─ Respuesta: "# Análisis IA: Ocupación 85%..."

5. geminiService.ts sanitiza respuesta
   ├─ DOMPurify elimina etiquetas peligrosas
   ├─ Preserva formato Markdown
   └─ Marca como sanitized: true

6. Dashboard renderiza resultado
   ├─ Muestra: "✨ Análisis de IA"
   ├─ Contenido limpio y seguro
   └─ Indicador: "✓ Contenido validado y seguro"

TIEMPO TOTAL: ~3s
```

**UI Resultante:**
```
┌─────────────────────────────────────────────────────┐
│ ✨ Análisis de Inteligencia Artificial             │
│                                                     │
│ # Análisis Detallado:                             │
│                                                     │
│ La ocupación de este mes es del 85%, lo que        │
│ sugiere una buena demanda. Se recomienda...       │
│                                                     │
│ ✓ Contenido validado y seguro                      │
└─────────────────────────────────────────────────────┘
```

---

### Escenario 2: ⚠️ Servidor Lento (Reintento Exitoso)

```
1. Usuario hace click en "Analizar con IA"
   └─ AbortController creado

2. Solicitud enviada, pero servidor está lento
   └─ Pasan 5 segundos sin respuesta

3. Servidor aún no responde
   └─ Pasan 10 segundos...

4. Servidor todavía procesando (red lenta)
   └─ Pasan 15 segundos...

5. TIMEOUT DE 20 SEGUNDOS ALCANZADO
   ├─ AbortController.abort()
   ├─ Conexión cerrada
   └─ Catch block captura AbortError

6. Entra en reintento 1/3
   ├─ Delay: 500ms + jitter
   ├─ Console: "Reintentando en 523ms..."
   └─ Dashboard: Muestra "⏳ Reintentando (1/3)..."

7. ESPERA 523ms

8. REINTENTO 1: Solicitud nuevamente
   └─ Servidor responde en 2s esta vez
   ├─ Respuesta válida recibida
   ├─ DOMPurify sanitiza
   └─ Dashboard muestra resultado

TIEMPO TOTAL: ~20s + 523ms + 2s = ~22.5s
RESULTADO: ✅ Éxito tras reintento
```

**Timeline:**
```
0s     ├─ Click
       │
5s     ├─ Sin respuesta
       │
10s    ├─ Aún esperando...
       │
15s    ├─ Red lenta detectada
       │
20s    ├─ TIMEOUT: Abortar
       │
20.5s  ├─ Error capturado
       │
21s    ├─ Delay de backoff...
       │
21.5s  ├─ REINTENTO 1/3
       │
23.5s  └─ ✅ Respuesta exitosa

Total: ~23.5 segundos (3 reintentos máximo)
```

---

### Escenario 3: 🚫 Usuario Cancela

```
1. Usuario hace click en "Analizar con IA"
   └─ AbortController creado
   └─ Botón cambia a "🔄 Analizando..."

2. Dashboard envía solicitud
   └─ Servidor comienza a procesar

3. Usuario ve que es muy lento
   └─ Hace click en "✖ Cancelar"

4. handleCancelAiAnalysis() ejecuta:
   ├─ abortControllerRef.current.abort()
   ├─ setLoadingAi(false)
   └─ setAiError("Análisis cancelado por el usuario")

5. Solicitud abortada inmediatamente
   └─ Conexión cerrada
   └─ No hay consumo innecesario de datos

6. Dashboard muestra error amigable:
   └─ "Análisis cancelado por el usuario"
   └─ Botón para reintentar

TIEMPO TOTAL: <1s (instant abort)
RESULTADO: ✅ Cancelado exitosamente
```

**UI Resultante:**
```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Error en el análisis                           │
│ "Análisis cancelado por el usuario"                │
│                                                     │
│ [Reintentar análisis]                             │
└─────────────────────────────────────────────────────┘
```

---

### Escenario 4: 🔄 Reintento Falla Múltiples Veces

```
1. Usuario hace click
   └─ AbortController creado

2. INTENTO 1:
   ├─ Timeout 20s → AbortError
   ├─ Entra en catch
   ├─ Delay: 500ms
   └─ Console: "Analysis Attempt 1/3: Error"

3. INTENTO 2:
   ├─ Timeout 20s → AbortError
   ├─ Delay: 1050ms (2^1 * 500 + jitter)
   └─ Console: "Analysis Attempt 2/3: Error"

4. INTENTO 3:
   ├─ Timeout 20s → AbortError
   ├─ Es el último intento (no hay más delays)
   └─ Console: "Analysis Attempt 3/3: Error"

5. Loop terminado
   ├─ lastError = AbortError
   ├─ Return error message
   └─ Dashboard recibe: { success: false, error: "..." }

6. Dashboard renderiza UI de error:
   ├─ Icono: ⚠️
   ├─ Título: "Error en el análisis"
   ├─ Mensaje: "Solicitud cancelada o timeout (20s)..."
   ├─ Badge: "🔄 Se realizó intento 1/3"
   └─ Botón: "Reintentar análisis"

TIEMPO TOTAL: ~(20+20+20 + 0.5+1 + overhead) = ~61.5s
RESULTADO: ❌ Error tras 3 intentos
ACCIÓN: Usuario puede hacer click en "Reintentar"
```

**Console Output:**
```
Analysis Attempt 1/3: {
  timestamp: "2026-01-25T10:30:00.000Z",
  error: "AbortError: The operation was aborted",
  attempt: 1
}
Reintentando en 523ms...

Analysis Attempt 2/3: {
  timestamp: "2026-01-25T10:30:20.500Z",
  error: "AbortError: The operation was aborted",
  attempt: 2
}
Reintentando en 1102ms...

Analysis Attempt 3/3: {
  timestamp: "2026-01-25T10:30:41.600Z",
  error: "AbortError: The operation was aborted",
  attempt: 3
}

Error después de 3 intentos: AbortError
```

---

### Escenario 5: 🔐 XSS Bloqueado (Sanitización)

```
ANTES (Vulnerable):
Gemini AI responde con:
  "<h2>Análisis</h2><script>alert('Hacked!');</script>"

Sin sanitización, esto se renderiza como:
  - Título funciona
  - Script se ejecuta (¡PELIGROSO!)

DESPUÉS (Seguro):
Mismo input recibe sanitización:
  
1. DOMPurify.sanitize() es llamado
2. Config permite: h2, p, strong, etc.
3. Config bloquea: script, iframe, onclick, etc.

Resultado sanitizado:
  "<h2>Análisis</h2>"
  (Script eliminado completamente)

Usuario ve:
  ✅ Título normal
  ❌ No hay script
  ✓ Contenido validado y seguro

BENEFICIO: ✅ XSS completamente prevenido
```

**Comparación:**
```
┌────────────────────────────────────────────┐
│ ENTRADA (Potencialmente maliciosa):       │
├────────────────────────────────────────────┤
│ <h2>Análisis</h2>                         │
│ <img src=x onerror="alert('xss')">        │
│ <a href="javascript:void(0)">Link</a>    │
│ <script>console.log('hacked')</script>    │
└────────────────────────────────────────────┘
                    ↓
           DOMPurify.sanitize()
                    ↓
┌────────────────────────────────────────────┐
│ SALIDA (Completamente segura):            │
├────────────────────────────────────────────┤
│ <h2>Análisis</h2>                         │
│ (img eliminado)                           │
│ <a href="">Link</a>                      │
│ (script eliminado)                        │
└────────────────────────────────────────────┘

✓ Contenido validado y seguro
```

---

## 🎯 Flujo de Código Detallado

### Cuando Usuario Hace Click:

```typescript
// PASO 1: handleAiAnalysis() se ejecuta
const handleAiAnalysis = async () => {
  setLoadingAi(true);
  setAiError(null);
  
  // PASO 2: Crear AbortController
  abortControllerRef.current = new AbortController();
  
  try {
    // PASO 3: Llamar analyzeBusinessData con opciones
    const result = await analyzeBusinessData(
      transactions,
      reservations,
      {
        maxRetries: 3,
        timeoutMs: 20000,
        onRetry: (attempt) => {
          setAiAnalysis(`⏳ Reintentando (${attempt}/3)...`);
        },
      }
    );
    
    // PASO 4: Procesar resultado
    if (result.success && result.data) {
      // Ya sanitizado en geminiService.ts
      setAiAnalysis(result.data);
    } else {
      setAiError(result.error);
    }
  } finally {
    setLoadingAi(false);
  }
};
```

### En geminiService.ts:

```typescript
// PASO 1: Loop de reintentos
for (let attempt = 0; attempt < config.maxRetries; attempt++) {
  try {
    // PASO 2: Crear AbortController
    const controller = new AbortController();
    
    // PASO 3: Configurar timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs);
    
    // PASO 4: Fetch con signal
    const response = await fetch(`/api/analyze`, {
      signal: controller.signal,
    });
    
    // PASO 5: Parsear respuesta
    const result = await response.json();
    
    // PASO 6: SANITIZAR con DOMPurify
    if (result.success && result.data) {
      result.data = sanitizeContent(result.data);
      result.sanitized = true;
    }
    
    // PASO 7: Retornar resultado
    return result;
    
  } catch (error) {
    // PASO 8: Manejar error y reintentar
    if (attempt < config.maxRetries - 1) {
      const delay = getExponentialBackoffDelay(attempt);
      config.onRetry(attempt + 1, error.message);
      await sleep(delay);
    }
  }
}
```

---

## 📊 Diagrama de Estados

```
                    ┌─────────────────┐
                    │    INICIAL      │
                    │                 │
                    │ Botón visible   │
                    └────────┬────────┘
                             │
                    Usuario hace click
                             │
                             ▼
                    ┌─────────────────┐
                    │   CARGANDO      │
                    │                 │
                    │ Spinner girando │
                    │ Botón Cancelar  │
                    └──┬────────────┬─┘
                       │            │
         Usuario cancela│            │ Esperar...
                       │            │
                       ▼            ▼
              ┌──────────────┐  ┌──────────────────┐
              │  CANCELADO   │  │ ¿TIMEOUT ALCANZADO? ¿SÍ?
              │              │  └──┬──────────────┬─┘
              │ Error amable │     │              │
              └──────────────┘     │ No - Respuesta
                                   │
                        Reintento? └──┬─────────────┐
                                      │             │
                                      ▼             ▼
                        ┌─────────────────┐  ┌──────────────┐
                        │   REINTENTANDO  │  │    ERROR     │
                        │                 │  │              │
                        │ Intento X/3     │  │ Error UI     │
                        └────────┬────────┘  └──────────────┘
                                 │                   ▲
                                 │                   │
                    Delay exponencial        Botón Reintentar
                                 │                   │
                                 └───────────────────┘

               ┌───────────────────────────────────┐
               │       RESULTADO EXITOSO           │
               │                                   │
               │ ✨ Análisis de IA renderizado    │
               │ ✓ Contenido validado y seguro    │
               └───────────────────────────────────┘
```

---

## 💡 Características en Acción

| Característica | Cuándo Activa | Efecto |
|---|---|---|
| **AbortController** | Inmediato | Solicitud cancelable |
| **Timeout 20s** | Después 20s | Aborta automáticamente |
| **Reintento 1** | Si falla, +500ms | Segundo intento |
| **Reintento 2** | Si falla, +1s | Tercer intento |
| **UI Reintento** | Durante intento | Muestra "⏳ Reintentando" |
| **Botón Cancelar** | Durante carga | Usuario puede abortar |
| **DOMPurify** | Antes renderizar | Limpia respuesta |
| **Indicador Seguro** | Resultado éxito | Muestra "✓ Validado" |

---

## ✅ Resumen

Todos los 4 features funcionan juntos para crear una experiencia robusta:

1. **AbortController** → Timeout automático en 20s
2. **Reintento** → Recuperación en caso de falla
3. **UI Cancelable** → Usuario tiene control total
4. **DOMPurify** → Respuesta siempre segura

**Resultado:** Un análisis de IA que es:
- ✅ Rápido (máximo 20s esperando)
- ✅ Confiable (3 reintentos automáticos)
- ✅ Controlable (botón cancelar)
- ✅ Seguro (sin XSS)

