import React from 'react';
import { BarChartSkeleton, PieChartSkeleton } from '../../components/molecules/ChartSkeletons';

export const ChartFallback: React.FC<{ type?: 'bar' | 'pie' }> = ({ type = 'bar' }) => {
  return type === 'bar' ? <BarChartSkeleton /> : <PieChartSkeleton />;
};