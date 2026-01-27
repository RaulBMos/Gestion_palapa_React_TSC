import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface MonthlyChartProps {
  data: Array<{
    name: string;
    ingresos: number;
    gastos: number;
  }>;
}

interface ExpenseCategoryChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const MonthlyFlowChart: React.FC<MonthlyChartProps> = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
    <h3 className="text-lg font-bold text-slate-800 mb-6">Flujo de Caja Mensual</h3>
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
          <Tooltip 
            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
            cursor={{fill: '#f8fafc'}}
          />
          <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
    <h3 className="text-lg font-bold text-slate-800 mb-6">Desglose de Gastos</h3>
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} {...(COLORS[index % COLORS.length] && { fill: COLORS[index % COLORS.length] })} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);
