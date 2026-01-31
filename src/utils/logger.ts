/**
 * Logger estructurado para la aplicación
 * Proporciona un sistema de logging consistente con contexto y metadata
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  errorName?: string;
  message: string;
  context: LogContext;
  timestamp: string;
  stack?: string;
}

interface ErrorInfo {
  componentStack?: string;
  [key: string]: unknown;
}

/**
 * Configuración del logger
 */
interface LoggerConfig {
  enableConsoleOutput: boolean;
  enableRemoteLogging: boolean;
  minLevel: LogLevel;
  apiEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsoleOutput: true,
      enableRemoteLogging: false,
      minLevel: LogLevel.INFO,
      ...config,
    };
  }

  /**
   * @param error - Error object o string de mensaje
   * @param context - Contexto adicional del error
   * @param extra - Información adicional (React componentStack) o el Error original
   */
  logError(error: Error | string, context: LogContext = {}, extra?: ErrorInfo | Error): void {
    const errorObj = error instanceof Error
      ? error
      : (extra instanceof Error ? extra : new Error(error));

    // Si el primer parámetro es un string, lo usamos como mensaje principal
    const mainMessage = typeof error === 'string' ? error : errorObj.message;

    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      errorName: errorObj.name,
      message: mainMessage,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : 'Server',
        ...context,
      },
      timestamp: new Date().toISOString(),
      stack: errorObj.stack,
    };

    // Agregar technical message si es diferente al mensaje principal
    if (typeof error === 'string' && extra instanceof Error && extra.message !== error) {
      logEntry.context.technicalMessage = extra.message;
    }

    // Agregar componentStack si está disponible (de ErrorBoundary)
    if (extra && !(extra instanceof Error) && extra.componentStack) {
      logEntry.context.componentStack = extra.componentStack;
    }

    this.writeLog(logEntry);
  }

  /**
   * Loguear advertencias
   */
  logWarning(message: string, context: LogContext = {}): void {
    const logEntry: LogEntry = {
      level: LogLevel.WARN,
      message,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : 'Server',
        ...context,
      },
      timestamp: new Date().toISOString(),
    };

    this.writeLog(logEntry);
  }

  /**
   * Loguear información
   */
  logInfo(message: string, context: LogContext = {}): void {
    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : 'Server',
        ...context,
      },
      timestamp: new Date().toISOString(),
    };

    this.writeLog(logEntry);
  }

  /**
   * Loguear información de debug
   */
  logDebug(message: string, context: LogContext = {}): void {
    const logEntry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : 'Server',
        ...context,
      },
      timestamp: new Date().toISOString(),
    };

    this.writeLog(logEntry);
  }

  // Aliases for compatibility
  error(error: Error | string, context: LogContext = {}, extra?: ErrorInfo | Error): void {
    this.logError(error, context, extra);
  }

  warn(message: string, context: LogContext = {}): void {
    this.logWarning(message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.logInfo(message, context);
  }

  debug(message: string, context: LogContext = {}): void {
    this.logDebug(message, context);
  }

  /**
   * Escribe el log según la configuración
   */
  private writeLog(logEntry: LogEntry): void {
    // Filtrar por nivel mínimo
    if (!this.shouldLog(logEntry.level)) {
      return;
    }

    // Output a consola
    if (this.config.enableConsoleOutput) {
      this.consoleOutput(logEntry);
    }

    // Envío a servicio remoto (futuro)
    if (this.config.enableRemoteLogging && this.config.apiEndpoint) {
      this.sendToRemote(logEntry);
    }
  }

  /**
   * Determina si el log debe ser procesado según el nivel mínimo
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.config.minLevel);

    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Output formateado a consola
   */
  private consoleOutput(logEntry: LogEntry): void {
    const { level, errorName, message, context, timestamp } = logEntry;

    const formattedMessage = `[${timestamp}] ${level}: ${errorName ? `${errorName}: ` : ''}${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, {
          context,
          stack: logEntry.stack,
        });
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, context);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context);
        break;
    }
  }

  /**
   * Envío a servicio remoto de logging
   */
  private async sendToRemote(logEntry: LogEntry): Promise<void> {
    if (!this.config.apiEndpoint) return;

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      // Evitar recursión infinita si el logger falla
      console.error('Failed to send log to remote service:', error);
    }
  }

  /**
   * Actualizar configuración del logger
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Instancia singleton del logger
export const logger = new Logger({
  enableConsoleOutput: true,
  enableRemoteLogging: false, // Deshabilitado por ahora
  minLevel: LogLevel.INFO,
});

// Exportar funciones de conveniencia
export const logError = (error: Error | string, context: LogContext = {}, extra?: ErrorInfo | Error): void => {
  logger.logError(error, context, extra);
};

export const logWarning = (message: string, context: LogContext = {}): void => {
  logger.logWarning(message, context);
};

export const logInfo = (message: string, context: LogContext = {}): void => {
  logger.logInfo(message, context);
};

export const logDebug = (message: string, context: LogContext = {}): void => {
  logger.logDebug(message, context);
};