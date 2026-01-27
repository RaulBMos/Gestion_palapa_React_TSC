export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    let formattedLog = `[${timestamp}] ${level}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formattedLog += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      formattedLog += ` | Error: ${error.message}`;
      if (error.stack) {
        formattedLog += `\nStack: ${error.stack}`;
      }
    }
    
    return formattedLog;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && { error })
    };

    const formattedLog = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }

    if (level === LogLevel.ERROR) {
      this.sendErrorToMonitoring(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  private sendErrorToMonitoring(entry: LogEntry) {
    if (this.isDevelopment) return;

    try {
      const errorData = {
        event: 'error_log',
        level: entry.level,
        message: entry.message,
        context: entry.context,
        error: entry.error ? {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name
        } : null,
        timestamp: entry.timestamp,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      };

      console.log('📊 Error monitoring data:', errorData);
    } catch (err) {
      console.error('Failed to send error to monitoring:', err);
    }
  }

  public error(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  public info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  public debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  public setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  public networkError(url: string, error: Error, context?: Record<string, any>) {
    this.error(
      `Network request failed to ${url}`,
      {
        url,
        status: (error as any).status,
        statusText: (error as any).statusText,
        ...context
      },
      error
    );
  }

  public quotaExceeded(service: string, context?: Record<string, any>) {
    this.warn(
      `API quota exceeded for ${service}`,
      {
        service,
        timestamp: Date.now(),
        ...context
      }
    );
  }
}

export const logger = new Logger();

// Named exports for compatibility
export const logError = (error: Error, context?: Record<string, any>) => logger.error(error.message, context, error);
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const logWarning = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context);

export default logger;