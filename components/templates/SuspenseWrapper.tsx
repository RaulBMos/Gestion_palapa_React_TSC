import React, { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Cargando...' }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      <p className="text-slate-500 text-sm font-medium">{message}</p>
    </div>
  </div>
);

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ 
  children, 
  fallback = <LoadingFallback /> 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);
