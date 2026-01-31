import React from 'react';

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
    <div className="animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
      <div className="h-64 w-full bg-slate-100 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-shimmer"></div>
      </div>
    </div>
  </div>
);

export const BarChartSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
    <div className="animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
      <div className="h-64 w-full space-y-4">
        <div className="flex items-end space-x-2 h-48">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-1">
              <div className="space-y-2">
                <div className="h-20 bg-slate-200 rounded-t"></div>
                <div className="h-16 bg-slate-300 rounded-t"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-1 h-3 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const PieChartSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
    <div className="animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
      <div className="h-64 w-full flex items-center justify-center">
        <div className="relative">
          <div className="w-40 h-40 bg-slate-200 rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
            <div className="h-3 bg-slate-200 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);