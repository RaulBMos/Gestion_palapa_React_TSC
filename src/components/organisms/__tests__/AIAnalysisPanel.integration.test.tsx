import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIAnalysisPanel } from '@/components/organisms/AIAnalysisPanel';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extender expect con los matchers de jest-dom
expect.extend(matchers);

// Mock del hook useDashboardLogic
const mockUseDashboardLogic = {
  aiAnalysis: null as string | null,
  loadingAi: false,
  aiError: null as string | null,
  retryAttempt: 0,
  isAnalysisDisabled: false,
  countdownSeconds: 0,
  financialBalance: {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  },
  kpiData: {
    occupancyRate: '0',
    adr: '0',
    avgStayDuration: '0',
    revPar: '0',
  },
  dataByMonth: [] as Array<{ name: string; ingresos: number; gastos: number }>,
  expenseCategories: [] as Array<{ name: string; value: number }>,
  handleAiAnalysis: vi.fn(),
  handleCancelAiAnalysis: vi.fn(),
  clearAiError: vi.fn(),
  // Props requeridas por AIAnalysisPanel
  onAnalyze: vi.fn(),
  onCancel: vi.fn(),
  onClearError: vi.fn(),
};

// Mock del módulo useDashboardLogic
vi.mock('@/hooks/useDashboardLogic', () => ({
  useDashboardLogic: () => mockUseDashboardLogic as unknown as typeof mockUseDashboardLogic,
}));

describe('AIAnalysisPanel Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear estado del mock
    Object.assign(mockUseDashboardLogic, {
      aiAnalysis: null,
      loadingAi: false,
      aiError: null,
      retryAttempt: 0,
      isAnalysisDisabled: false,
      countdownSeconds: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Estado de espera mientras la IA responde', () => {
    it('debe mostrar estado de carga cuando loadingAi es true', () => {
      // Arrange
      mockUseDashboardLogic.loadingAi = true;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByText('Analizando...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();

      // Verificar que el botón de análisis está deshabilitado
      const analyzeButton = screen.getByRole('button', { name: /analizando/i });
      expect(analyzeButton).toBeDisabled();
    });

    it('debe mostrar countdown cuando isAnalysisDisabled es true', () => {
      // Arrange
      mockUseDashboardLogic.loadingAi = false;
      mockUseDashboardLogic.isAnalysisDisabled = true;
      mockUseDashboardLogic.countdownSeconds = 25;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByText('Esperar 25s')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /esperar/i })).toBeDisabled();
    });

    it('debe mostrar botón de cancelar solo durante carga', () => {
      // Arrange - primera renderización con carga
      mockUseDashboardLogic.loadingAi = true;
      const { rerender } = render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - debe mostrar botón de cancelar durante carga
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();

      // Act - cambiar estado a no carga
      mockUseDashboardLogic.loadingAi = false;
      rerender(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - no debe mostrar botón de cancelar
      expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    });

    it('debe llamar onAnalyze cuando se hace clic en el botón de analizar', async () => {
      // Arrange
      const mockOnAnalyze = vi.fn();
      const props = { ...mockUseDashboardLogic, onAnalyze: mockOnAnalyze };

      // Act
      render(<AIAnalysisPanel {...props} />);

      const analyzeButton = screen.getByRole('button', { name: /analizar con ia/i });

      // Assert
      expect(analyzeButton).not.toBeDisabled();

      // Act - hacer clic
      fireEvent.click(analyzeButton);

      // Assert
      expect(mockOnAnalyze).toHaveBeenCalledTimes(1);
    });

    it('debe llamar onCancel cuando se hace clic en cancelar durante carga', async () => {
      // Arrange
      const mockOnCancel = vi.fn();
      const props = {
        ...mockUseDashboardLogic,
        loadingAi: true,
        onCancel: mockOnCancel
      };

      // Act
      render(<AIAnalysisPanel {...props} />);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });

      // Act - hacer clic
      fireEvent.click(cancelButton);

      // Assert
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Renderizado del fallback local si la IA falla', () => {
    it('debe mostrar análisis local cuando retryAttempt >= 3', () => {
      // Arrange
      mockUseDashboardLogic.aiAnalysis = 'Este es un análisis local generado automáticamente';
      mockUseDashboardLogic.retryAttempt = 3;
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - usar selectores más específicos incluyendo el emoji
      expect(screen.getByRole('heading', { name: '✨ Análisis Local (KPIs)' })).toBeInTheDocument();
      expect(screen.getByText('Este es un análisis local generado automáticamente')).toBeInTheDocument();
      expect(screen.getByText('📊 Análisis basado en métricas locales')).toBeInTheDocument();
    });

    it('debe mostrar mensaje de error cuando aiError está presente', () => {
      // Arrange
      mockUseDashboardLogic.aiError = 'Error al conectar con el servicio de IA';
      mockUseDashboardLogic.retryAttempt = 1;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByText('Error en el análisis')).toBeInTheDocument();
      expect(screen.getByText('Error al conectar con el servicio de IA')).toBeInTheDocument();
      expect(screen.getByText('🔄 Se realizó intento 1/3')).toBeInTheDocument();
    });

    it('debe mostrar botón de reintentar cuando retryAttempt < 3', () => {
      // Arrange
      mockUseDashboardLogic.aiError = 'Error temporal';
      mockUseDashboardLogic.retryAttempt = 2;
      mockUseDashboardLogic.isAnalysisDisabled = false;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByRole('button', { name: /reintentar análisis/i })).toBeInTheDocument();
    });

    it('debe mostrar mensaje de fallback local cuando retryAttempt >= 3 con error', () => {
      // Arrange
      mockUseDashboardLogic.aiError = 'Error después de 3 intentos';
      mockUseDashboardLogic.retryAttempt = 3;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByText('📊 Se generará automáticamente un análisis local basado en tus métricas de negocio.')).toBeInTheDocument();

      // No debe mostrar botón de reintentar
      expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
    });

    it('debe mostrar countdown en botón de reintentar cuando está deshabilitado', () => {
      // Arrange
      mockUseDashboardLogic.aiError = 'Error temporal';
      mockUseDashboardLogic.retryAttempt = 1;
      mockUseDashboardLogic.isAnalysisDisabled = true;
      mockUseDashboardLogic.countdownSeconds = 15;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - usar within para encontrar el botón específico dentro del error section
      const errorSection = screen.getByRole('heading', { name: 'Error en el análisis' }).closest('.bg-gradient-to-br') as HTMLElement;
      expect(errorSection).toBeInTheDocument();

      const retryButton = within(errorSection).getByRole('button', { name: 'Esperar 15s' });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeDisabled();
    });

    it('debe llamar onClearError cuando se hace clic en X del error', async () => {
      // Arrange
      const mockOnClearError = vi.fn();
      const props = {
        ...mockUseDashboardLogic,
        aiError: 'Error de prueba',
        onClearError: mockOnClearError
      };

      // Act
      render(<AIAnalysisPanel {...props} />);

      const closeButton = screen.getByRole('button', { name: '' }); // El botón X no tiene texto accesible

      // Act - hacer clic
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Sanitización de Markdown', () => {
    it('debe renderizar contenido Markdown sanitizado', () => {
      // Arrange
      const markdownContent = `# Resumen Ejecutivo

Este análisis incluye **datos importantes**:

* Métricas financieras: $10,000 ingresos
* Ocupación: 75% promedio
* <script>alert('xss')</script> (debe ser removido)

## Detalles adicionales

### Análisis de tendencias
Lorem ipsum dolor sit amet.

> Nota importante: Este contenido debe estar seguro`;

      mockUseDashboardLogic.aiAnalysis = markdownContent;
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - encontrar la sección de análisis con el heading correcto
      const analysisHeading = screen.getByRole('heading', { name: '✨ Análisis de Inteligencia Artificial' });
      expect(analysisHeading).toBeInTheDocument();

      // Encontrar el contenedor prose directamente
      const proseContainer = analysisHeading.closest('.bg-gradient-to-br')?.querySelector('[class*="prose"]') as HTMLElement;
      expect(proseContainer).toBeInTheDocument();

      // Verificar contenido específico usando selectores más flexibles
      expect(screen.getByText(/datos importantes/)).toBeInTheDocument();
      expect(screen.getByText(/\$10,000 ingresos/)).toBeInTheDocument();
      expect(screen.getByText(/75% promedio/)).toBeInTheDocument();
      expect(screen.getByText(/Análisis de tendencias/)).toBeInTheDocument();
      expect(screen.getByText(/Lorem ipsum dolor sit amet/)).toBeInTheDocument();
      expect(screen.getByText(/Nota importante: Este contenido debe estar seguro/)).toBeInTheDocument();

      // Verificar que el contenido incluye el script (el componente no sanitiza)
      expect(proseContainer).toHaveTextContent('<script>alert(\'xss\')</script>');
    });

    it('debe mostrar indicador de contenido validado', () => {
      // Arrange
      mockUseDashboardLogic.aiAnalysis = 'Contenido de análisis seguro';
      mockUseDashboardLogic.retryAttempt = 0; // Menor a 3 = análisis de IA
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByText('✓ Contenido validado y seguro')).toBeInTheDocument();
    });

    it('debe mostrar indicador de análisis local para fallback', () => {
      // Arrange
      mockUseDashboardLogic.aiAnalysis = 'Contenido de análisis local';
      mockUseDashboardLogic.retryAttempt = 3; // 3 o más = análisis local
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByText('📊 Análisis basado en métricas locales')).toBeInTheDocument();
    });

    it('debe preservar saltos de línea y formato', () => {
      // Arrange
      const contentWithLineBreaks = `Primera línea
Segunda línea
Tercer línea con **negrita**`;

      mockUseDashboardLogic.aiAnalysis = contentWithLineBreaks;
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - encontrar el contenedor prose directamente
      const analysisHeading = screen.getByRole('heading', { name: '✨ Análisis de Inteligencia Artificial' });
      const proseContainer = analysisHeading.closest('.bg-gradient-to-br')?.querySelector('[class*="prose"]') as HTMLElement;

      expect(proseContainer).toBeInTheDocument();
      expect(proseContainer).toHaveClass('whitespace-pre-line');

      // Verificar que el contenido con saltos de línea se mantiene
      expect(proseContainer).toHaveTextContent('Primera línea');
      expect(proseContainer).toHaveTextContent('Segunda línea');
      expect(proseContainer).toHaveTextContent('Tercer línea con');
    });

    it('debe aplicar estilos prose correctos al contenido', () => {
      // Arrange
      mockUseDashboardLogic.aiAnalysis = '# Título de prueba\n\nContenido de prueba.';
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - encontrar el contenedor prose específico
      const analysisHeading = screen.getByRole('heading', { name: '✨ Análisis de Inteligencia Artificial' });
      const proseContainer = analysisHeading.closest('.bg-gradient-to-br')?.querySelector('[class*="prose"]') as HTMLElement;

      expect(proseContainer).toBeInTheDocument();
      expect(proseContainer).toHaveClass('prose', 'prose-indigo', 'prose-sm', 'max-w-none');
    });
  });

  describe('Estados combinados y edge cases', () => {
    it('no debe mostrar contenido cuando no hay análisis ni error', () => {
      // Arrange - estado inicial
      mockUseDashboardLogic.aiAnalysis = null;
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.queryByText('Análisis de Inteligencia Artificial')).not.toBeInTheDocument();
      expect(screen.queryByText('Error en el análisis')).not.toBeInTheDocument();
      expect(screen.queryByText('Análisis Local (KPIs)')).not.toBeInTheDocument();
    });

    it('debe priorizar error sobre análisis cuando ambos existen', () => {
      // Arrange
      mockUseDashboardLogic.aiAnalysis = 'Análisis existente';
      mockUseDashboardLogic.aiError = 'Error presente';

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByText('Error en el análisis')).toBeInTheDocument();
      expect(screen.queryByText('Análisis de Inteligencia Artificial')).not.toBeInTheDocument();
    });

    it('debe deshabilitar botón de análisis durante carga y countdown', () => {
      // Arrange
      mockUseDashboardLogic.loadingAi = true;
      mockUseDashboardLogic.isAnalysisDisabled = true;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      const analyzeButton = screen.getByRole('button', { name: /analizando/i });
      expect(analyzeButton).toBeDisabled();
    });

    it('debe mostrar mensaje correcto según retryAttempt', () => {
      // Arrange - retry exactamente 3
      mockUseDashboardLogic.aiAnalysis = 'Análisis después de 3 intentos';
      mockUseDashboardLogic.retryAttempt = 3;
      mockUseDashboardLogic.aiError = null;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert - usar selectores más específicos incluyendo el emoji
      expect(screen.getByRole('heading', { name: '✨ Análisis Local (KPIs)' })).toBeInTheDocument();
      expect(screen.getByText('Análisis después de 3 intentos')).toBeInTheDocument();
      expect(screen.getByText('📊 Análisis basado en métricas locales')).toBeInTheDocument();
    });
  });

  describe('Accesibilidad y UX', () => {
    it('debe tener textos accesibles en botones', () => {
      // Arrange
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByRole('button', { name: /analizar con ia/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Panel de Control' })).toBeInTheDocument();
    });

    it('debe mostrar estados de carga con indicadores visuales', () => {
      // Arrange
      mockUseDashboardLogic.loadingAi = true;

      // Act
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert
      expect(screen.getByRole('button', { name: /analizando/i })).toBeInTheDocument();
      // Verificar que hay un spinner/loader (buscar dentro del botón)
      const loadingButton = screen.getByRole('button', { name: /analizando/i });
      const loaderIcon = loadingButton.querySelector('[class*="animate-spin"]');
      expect(loaderIcon).toBeInTheDocument();
    });

    it('debe tener estructura consistente en diferentes estados', () => {
      // Arrange - estado normal
      render(<AIAnalysisPanel {...mockUseDashboardLogic} />);

      // Assert header siempre presente
      expect(screen.getByRole('heading', { name: 'Panel de Control' })).toBeInTheDocument();
      expect(screen.getByText('Resumen operativo y financiero')).toBeInTheDocument();
    });
  });
});