import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '@/components/templates/ErrorBoundary';

// Mock del logger antes de importar el componente
vi.mock('@/utils/logger', () => ({
  logError: vi.fn(),
}));

// Importar después del mock
import { logError } from '@/utils/logger';

// Componente que lanza un error para testing
const ThrowErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary con Logger Integrado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe usar el logger cuando ocurre un error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verificar que el logger fue llamado
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'ErrorBoundary',
        action: 'componentDidCatch',
        phase: 'render',
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    // Verificar que el error tiene las propiedades correctas
    const mockCall = vi.mocked(logError).mock.calls[0];
    expect(mockCall).toBeDefined();
    const [error, context, errorInfo] = mockCall!;
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toBe('Test error for ErrorBoundary');
    }
    expect(context).toBeDefined();
    expect(context?.component).toBe('ErrorBoundary');
    expect(context?.action).toBe('componentDidCatch');
    expect(errorInfo).toBeDefined();
    expect(errorInfo?.componentStack).toBeDefined();
  });

  it('debe renderizar children cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Verificar que no se llamó al logger
    expect(logError).not.toHaveBeenCalled();

    // Verificar que se renderiza el contenido normal
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('debe renderizar UI de error cuando hay un error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verificar que se muestra la UI de error
    expect(screen.getByRole('heading', { name: 'Error' })).toBeInTheDocument();
    expect(screen.getByText('Ha ocurrido un error inesperado. Por favor, recarga la página.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument();
  });
});