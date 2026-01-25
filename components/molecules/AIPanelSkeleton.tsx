import React from 'react';
import { Brain } from 'lucide-react';

export const AIPanelSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
      </div>

      {/* Analysis Content */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div className="h-6 bg-slate-200 rounded w-40"></div>
        </div>
        
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-4/5"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="h-5 bg-slate-200 rounded w-36 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full mt-0.5"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);