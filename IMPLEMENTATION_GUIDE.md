# Plan de Implementación: Quick Start

Este documento contiene código listo para copiar/pegar para las correcciones críticas.

---

## 1. Error Boundary (Copia directa)

```tsx
// src/components/ErrorBoundary.tsx
import React, { ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to external service in production
    console.error('ErrorBoundary caught:', error);
    console.error('Error Info:', errorInfo);
    
    // TODO: Send to Sentry or similar
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-50 to-red-100 p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Se encontró un error inesperado'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left max-h-48 overflow-auto">
                <p className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
                  {this.state.error?.stack}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Recargar
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Uso en App.tsx**:
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Layout currentView={currentView} setView={setCurrentView}>
        {renderView()}
      </Layout>
    </ErrorBoundary>
  );
}
```

---

## 2. Gemini Service Mejorado

```typescript
// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';
import { Transaction, Reservation, TransactionType, ReservationStatus } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

interface AnalysisResult {
  success: boolean;
  data?: string;
  error?: string;
}

// Validar precondiciones
const validateInput = (
  transactions: Transaction[],
  reservations: Reservation[]
): { valid: boolean; error?: string } => {
  if (!apiKey) {
    return { valid: false, error: 'API Key de Gemini no configurada' };
  }

  if (!Array.isArray(transactions) || !Array.isArray(reservations)) {
    return { valid: false, error: 'Datos inválidos' };
  }

  if (transactions.length === 0 && reservations.length === 0) {
    return { valid: false, error: 'Sin datos suficientes para análisis' };
  }

  return { valid: true };
};

// Implementar retry con backoff exponencial
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt) {
        throw error;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Intento ${attempt}/${maxRetries} fallido. Reintentando en ${delayMs}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Analiza datos de negocio usando Google Gemini AI
 * @param transactions - Historial de transacciones
 * @param reservations - Lista de reservas
 * @param signal - AbortSignal opcional para cancelación
 * @returns Resultado del análisis con éxito o error
 * 
 * @example
 * const result = await analyzeBusinessData(txns, reservations);
 * if (result.success) console.log(result.data);
 */
export const analyzeBusinessData = async (
  transactions: Transaction[],
  reservations: Reservation[],
  signal?: AbortSignal
): Promise<AnalysisResult> => {
  // 1. Validar input
  const validation = validateInput(transactions, reservations);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // 2. Preparar datos
    const income = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const confirmedReservations = reservations.filter(
      r => r.status === ReservationStatus.CONFIRMED
    );
    const totalAdults = confirmedReservations.reduce((acc, r) => acc + r.adults, 0);
    const totalChildren = confirmedReservations.reduce((acc, r) => acc + r.children, 0);
    const totalCabinsOccupied = confirmedReservations.reduce((acc, r) => acc + r.cabinCount, 0);

    const prompt = `
Actúa como un analista financiero experto en bienes raíces y alquiler vacacional.

DATOS DEL NEGOCIO:
- Ingresos Totales: $${income}
- Gastos Totales: $${expenses}
- Beneficio Neto: $${income - expenses}
- Margen Neto: ${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%
- Reservas Confirmadas Activas: ${confirmedReservations.length}
- Cabañas Ocupadas en Reservas Activas: ${totalCabinsOccupied}
- Huéspedes Próximos (Adultos/Mayores de 5): ${totalAdults}
- Huéspedes Próximos (Niños < 5 años): ${totalChildren}
- Total de Transacciones: ${transactions.length}

SOLICITUD:
Proporciona un análisis profesional en 3 párrafos máximo sobre:
1. Salud general del negocio
2. Ocupación y utilización de cabañas
3. Tendencias financieras

Incluye:
- 2 KPIs clave a vigilar
- 1-2 recomendaciones concretas para mejorar rentabilidad
- Formato: Markdown limpio, sin listas numeradas
    `;

    // 3. Crear cliente con timeout
    const ai = new GoogleGenAI({ apiKey });

    // 4. Llamar con retry y timeout
    const response = await retryWithBackoff(
      () =>
        Promise.race([
          ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout excedido (30s)')),
              30000
            )
          ),
        ] as any),
      3,
      1000
    );

    // 5. Validar respuesta
    if (!response?.text) {
      return {
        success: false,
        error: 'Respuesta vacía de Gemini',
      };
    }

    // 6. Sanitizar (opcional pero recomendado)
    const sanitized = response.text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .substring(0, 5000); // Limitar a 5000 caracteres

    return {
      success: true,
      data: sanitized,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    // Log estructurado
    console.error('Gemini API Error:', {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      context: 'analyzeBusinessData',
    });

    // Diferenciar tipos de error
    if (errorMessage.includes('401') || errorMessage.includes('API Key')) {
      return {
        success: false,
        error: 'API Key inválida o expirada',
      };
    }

    if (errorMessage.includes('429')) {
      return {
        success: false,
        error: 'Límite de solicitudes alcanzado. Intenta en 1 minuto.',
      };
    }

    if (errorMessage.includes('Timeout')) {
      return {
        success: false,
        error: 'La IA tardó demasiado. Intenta de nuevo.',
      };
    }

    return {
      success: false,
      error: `Error de IA: ${errorMessage}`,
    };
  }
};

export default analyzeBusinessData;
```

---

## 3. Dashboard Mejorado (Con Error Handling)

```tsx
// src/components/Dashboard.tsx - Actualizar handleAiAnalysis
import React, { useMemo, useState, useCallback } from 'react';
import { /* ... imports existentes ... */ } from 'lucide-react';
import { Transaction, Reservation, TransactionType, ReservationStatus } from '../types';
import { analyzeBusinessData } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
  reservations: Reservation[];
  totalAvailableCabins: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  reservations,
  totalAvailableCabins,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Memoizar cálculos costosos
  const totalIncome = useMemo(
    () =>
      transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [transactions]
  );

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0
    ? ((netProfit / totalIncome) * 100).toFixed(1)
    : '0';

  // ... resto de cálculos KPI existentes ...

  // Callback mejorado para análisis de IA
  const handleAiAnalysis = useCallback(async () => {
    setLoadingAi(true);
    setAiError(null);
    setAiAnalysis(null);

    // Cancelar request anterior
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const result = await analyzeBusinessData(
        transactions,
        reservations,
        abortControllerRef.current.signal
      );

      if (result.success && result.data) {
        setAiAnalysis(result.data);
      } else {
        setAiError(result.error || 'Error desconocido');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      setAiError(`Error: ${message}`);
    } finally {
      setLoadingAi(false);
    }
  }, [transactions, reservations]);

  const handleCancelAi = useCallback(() => {
    abortControllerRef.current?.abort();
    setLoadingAi(false);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER CON BOTÓN DE IA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Panel de Control</h2>
          <p className="text-slate-500">Resumen operativo y financiero</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadingAi ? handleCancelAi : handleAiAnalysis}
            disabled={loadingAi && !abortControllerRef.current}
            className={`${
              loadingAi
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg'
            } text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-semibold transition-all active:scale-95 disabled:opacity-70`}
          >
            {loadingAi ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cancelar
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analizar con IA
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {aiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-900 font-bold text-lg mb-1">Error en Análisis</h3>
            <p className="text-red-700">{aiError}</p>
          </div>
          <button
            onClick={() => setAiError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ANALYSIS RESULT */}
      {aiAnalysis && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-indigo-900 font-bold text-lg mb-2">
                Análisis de IA
              </h3>
              <div className="prose prose-indigo prose-sm max-w-none text-indigo-800 leading-relaxed">
                {/* Renderizar markdown seguro */}
                <div className="whitespace-pre-line">{aiAnalysis}</div>
              </div>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-indigo-400 hover:text-indigo-600 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* RESTO DEL DASHBOARD */}
      {/* ... código existente ... */}
    </div>
  );
};
```

---

## 4. Safe LocalStorage Hook

```typescript
// src/hooks/useSafeLocalStorage.ts
import { useState, useEffect } from 'react';

interface UseSafeLocalStorageOptions<T> {
  validator?: (data: unknown) => data is T;
  fallbackValue?: T;
  onError?: (error: Error) => void;
}

/**
 * Hook seguro para localStorage con validación y manejo de errores
 * @param key - Clave de localStorage
 * @param initialValue - Valor inicial si no existe
 * @param options - Opciones de validación y fallback
 * @returns [valor, setter, { loading, error }]
 */
export const useSafeLocalStorage = <T,>(
  key: string,
  initialValue: T,
  options: UseSafeLocalStorageOptions<T> = {}
): [T, (value: T) => void, { loading: boolean; error: Error | null }] => {
  const { validator, fallbackValue = initialValue, onError } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);

      if (!item) {
        return fallbackValue;
      }

      const parsed = JSON.parse(item) as unknown;

      // Validar si se proporciona validator
      if (validator && !validator(parsed)) {
        console.warn(
          `Invalid data in localStorage key "${key}". Using fallback.`
        );
        return fallbackValue;
      }

      return (parsed as T) || fallbackValue;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Unknown error');
      console.error(`Error reading localStorage key "${key}":`, err);
      onError?.(err);
      return fallbackValue;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setValue = (value: T) => {
    setLoading(true);
    setError(null);

    try {
      // Validar antes de guardar
      if (validator && !validator(value)) {
        throw new Error('Invalid data structure');
      }

      localStorage.setItem(key, JSON.stringify(value));
      setStoredValue(value);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Unknown error');
      console.error(`Error writing to localStorage key "${key}":`, error);
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return [storedValue, setValue, { loading, error }];
};

// Uso en App.tsx:
import { useSafeLocalStorage } from './hooks/useSafeLocalStorage';
import { Client, Reservation, Transaction } from './types';

// Validators
const isClientArray = (data: unknown): data is Client[] => {
  return (
    Array.isArray(data) &&
    data.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as any).id === 'string' &&
        typeof (item as any).name === 'string' &&
        typeof (item as any).email === 'string'
    )
  );
};

export default function App() {
  const [clients, setClients, { error: clientError }] = useSafeLocalStorage(
    'cg_clients',
    INITIAL_CLIENTS,
    { validator: isClientArray }
  );

  if (clientError) {
    console.error('Client storage error:', clientError);
  }

  // ... rest of component
}
```

---

## 5. Configuración de Testing (Vitest)

```bash
# Instalar dependencias
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/ui

# o con pnpm
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitest/ui
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```

```typescript
// src/test/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

```typescript
// src/services/__tests__/geminiService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeBusinessData } from '../geminiService';
import { Transaction, Reservation, TransactionType, ReservationStatus, PaymentMethod } from '../../types';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
  });

  describe('analyzeBusinessData', () => {
    it('should return error when API key is missing', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', '');

      const result = await analyzeBusinessData([], []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Key');
    });

    it('should return error with empty data', async () => {
      const result = await analyzeBusinessData([], []);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      const mockTxn: Transaction = {
        id: '1',
        date: '2024-01-01',
        amount: 1000,
        type: TransactionType.INCOME,
        category: 'Renta',
        description: 'Test',
        paymentMethod: PaymentMethod.TRANSFER,
      };

      const mockRes: Reservation = {
        id: '1',
        clientId: '1',
        cabinCount: 1,
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        adults: 2,
        children: 0,
        totalAmount: 5000,
        status: ReservationStatus.CONFIRMED,
      };

      // Mock para simular fallo
      vi.stubGlobal('fetch', vi.fn(() => 
        Promise.reject(new Error('Network error'))
      ));

      const result = await analyzeBusinessData([mockTxn], [mockRes]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

```json
// package.json - Agregar scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

**Ejecutar tests**:
```bash
npm run test              # Una sola ejecución
npm run test:watch       # Modo watch
npm run test:coverage    # Con coverage report
npm run test:ui          # UI interactiva
```

---

## 6. .env.example (Securidad)

```bash
# .env.example - Nunca commitar .env real

# Google Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Aplicación
VITE_APP_NAME=CasaGestión
VITE_APP_ENV=development

# Feature Flags
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_OFFLINE_MODE=true

# Encryption (opcional)
VITE_ENCRYPTION_KEY=your-encryption-key-here
```

```bash
# .gitignore - Actualizar
node_modules/
.env
.env.local
.env.*.local
dist/
build/
*.log
.DS_Store
coverage/
.vite/
```

---

## 📋 Checklist de Implementación

- [ ] Copiar ErrorBoundary y envolver App
- [ ] Actualizar geminiService con retry y timeout
- [ ] Actualizar Dashboard con manejo de errores
- [ ] Implementar useSafeLocalStorage hook
- [ ] Instalar y configurar Vitest
- [ ] Escribir primeros 10 tests
- [ ] Crear .env.example
- [ ] Agregar .env a .gitignore
- [ ] Probar todo localmente
- [ ] Hacer commit con mensaje descriptivo

---

**⏱️ Tiempo estimado**: 4-6 horas para un dev experimentado

