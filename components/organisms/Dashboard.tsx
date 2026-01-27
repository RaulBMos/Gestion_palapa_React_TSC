import React, { lazy } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, CalendarDays, BedDouble, Activity } from 'lucide-react';
import { Transaction, Reservation } from '../../src/types';
import { useDataState } from '../../hooks/useData';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import { SuspenseWrapper } from '../templates/SuspenseWrapper';
import { BarChartSkeleton, PieChartSkeleton } from '../molecules/ChartSkeletons';
import { AIPanelSkeleton } from '../molecules/AIPanelSkeleton';

// Lazy load components to reduce initial bundle
const AIAnalysisPanel = lazy(() => import('./AIAnalysisPanel').then(m => ({ default: m.AIAnalysisPanel })));
const MonthlyFlowChart = lazy(() => import('../molecules/DashboardCharts').then(m => ({ default: m.MonthlyFlowChart })));
const ExpenseCategoryChart = lazy(() => import('../molecules/DashboardCharts').then(m => ({ default: m.ExpenseCategoryChart })));

interface DashboardProps {
  transactions?: Transaction[];
  reservations?: Reservation[];
  totalAvailableCabins?: number;
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
  // ✅ Obtener datos del contexto (o usar props si se proporcionan para retrocompatibilidad)
  const dataState = useDataState();
  
  const transactions = props.transactions ?? dataState.transactions;
  const reservations = props.reservations ?? dataState.reservations;
  const totalAvailableCabins = props.totalAvailableCabins ?? dataState.totalCabins;

  // ✅ Usar hook personalizado para toda la lógica de negocio
  const {
    aiAnalysis,
    loadingAi,
    aiError,
    retryAttempt,
    isAnalysisDisabled,
    countdownSeconds,
    financialBalance,
    kpiData,
    dataByMonth,
    expenseCategories,
    handleAiAnalysis,
    handleCancelAiAnalysis,
    clearAiError
  } = useDashboardLogic(transactions, reservations, totalAvailableCabins);

  const totalIncome = financialBalance.totalIncome;
  const totalExpenses = financialBalance.totalExpenses;
  const netProfit = financialBalance.netProfit;
  const profitMargin = financialBalance.profitMargin.toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* LAZY-LOADED AI PANEL */}
      <SuspenseWrapper fallback={<AIPanelSkeleton />}>
        <AIAnalysisPanel 
          aiAnalysis={aiAnalysis}
          aiError={aiError}
          loadingAi={loadingAi}
          retryAttempt={retryAttempt}
          isAnalysisDisabled={isAnalysisDisabled}
          countdownSeconds={countdownSeconds}
          onAnalyze={handleAiAnalysis}
          onCancel={handleCancelAiAnalysis}
          onClearError={clearAiError}
        />
      </SuspenseWrapper>

      {/* SECTION 1: Strategic KPIs (Business Success) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
           <Activity className="w-6 h-6 text-slate-400" />
           <h3 className="text-lg font-bold text-slate-700">Indicadores Clave (KPIs)</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Occupancy */}
            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BedDouble className="w-16 h-16 text-indigo-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ocupación (Mes)</p>
                <div className="flex items-baseline mt-2 gap-1">
                    <h3 className="text-3xl font-extrabold text-slate-800">{kpiData.occupancyRate}%</h3>
                </div>
                <p className="text-xs text-slate-400 mt-2">Capacidad utilizada</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${kpiData.occupancyRate}%` }}></div>
                </div>
            </div>

            {/* ADR */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-16 h-16 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tarifa Promedio (ADR)</p>
                <div className="flex items-baseline mt-2 gap-1">
                    <h3 className="text-3xl font-extrabold text-slate-800">${kpiData.adr}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-2">Promedio por noche</p>
            </div>

            {/* Avg Stay */}
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CalendarDays className="w-16 h-16 text-sky-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estancia Promedio</p>
                <div className="flex items-baseline mt-2 gap-1">
                    <h3 className="text-3xl font-extrabold text-slate-800">{kpiData.avgStayDuration}</h3>
                    <span className="text-sm font-medium text-slate-500">días</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Duración reserva</p>
            </div>

            {/* RevPAR */}
            <div className="bg-white p-5 rounded-2xl border border-violet-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-16 h-16 text-violet-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">RevPAR</p>
                <div className="flex items-baseline mt-2 gap-1">
                    <h3 className="text-3xl font-extrabold text-slate-800">${kpiData.revPar}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-2">Ingreso por cabaña disp.</p>
            </div>
        </div>
      </section>

      {/* SECTION 2: Financial Overview */}
      <section>
         <div className="flex items-center gap-2 mb-4">
           <ArrowUpRight className="w-6 h-6 text-emerald-600" />
           <h3 className="text-lg font-bold text-slate-700">Resumen Financiero</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-200 text-white">
                <p className="text-black text-sm font-medium mb-1">Ingresos Totales</p>
                <h3 className="text-2xl font-bold mb-4 text-black">${totalIncome.toLocaleString()}</h3>
                <div className="flex items-center text-xs text-black bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Flujo de entrada
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Gastos Totales</p>
                        <h3 className="text-2xl font-bold text-slate-800">${totalExpenses.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                        <ArrowDownRight className="w-5 h-5 text-red-500" />
                    </div>
                </div>
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: totalIncome > 0 ? `${(totalExpenses/totalIncome)*100}%` : '0%' }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    {totalIncome > 0 ? ((totalExpenses/totalIncome)*100).toFixed(1) : 0}% de los ingresos
                </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Beneficio Neto</p>
                        <h3 className="text-2xl font-bold text-slate-800">${netProfit.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-sky-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-sky-500" />
                    </div>
                </div>
                <p className="text-sm text-slate-500 mt-4">Margen neto: <span className="font-bold text-emerald-600">{profitMargin}%</span></p>
            </div>
        </div>
      </section>

      {/* SECTION 3: LAZY-LOADED CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SuspenseWrapper fallback={<BarChartSkeleton />}>
          <MonthlyFlowChart data={dataByMonth} />
        </SuspenseWrapper>

        <SuspenseWrapper fallback={<PieChartSkeleton />}>
          <ExpenseCategoryChart data={expenseCategories} />
        </SuspenseWrapper>
      </div>
    </div>
  );
};