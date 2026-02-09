import { logWarning } from '@/utils/logger';

export const SecurityLogger = {
  alert(message: string, context?: Record<string, unknown>) {
    logWarning(`Security event: ${message}`, {
      component: 'security-logger',
      ...context,
    });
  },
};
