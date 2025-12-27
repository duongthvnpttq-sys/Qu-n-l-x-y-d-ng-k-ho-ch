
import React, { useMemo, useState } from 'react';
import { User, Plan } from '../types';
import { 
  TrendingUp, Calendar, Users, Target, BarChart2, PieChart as PieIcon, Activity, 
  ArrowUp, ArrowDown, Trophy, AlertTriangle, ChevronDown, Filter, Sigma, Layers, 
  MoreHorizontal, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, ComposedChart, Area, AreaChart
} from 'recharts';

interface DashboardProps {
  users: User[];
  plans: Plan[];
}

// Cấu hình màu sắc hiện đại
const COLORS = {
  plan: '#cbd5e1',        // Slate 300 - Neutral for targets
  actual: '#3b82f6',      // Blue 500 - Primary for actuals
  exceeded: '#10b981',    // Emerald 500
  met: '#f59e0b',         // Amber 500
  notMet: '#ef4444',      // Red 500
  line: '#6366f1',        // Indigo 500
};

// Màu sắc cho từng line dịch vụ (Palette dịu mắt hơn)
const SERVICE_COLORS = {
  sim: '#3b82f6',         // Blue
  fiber: '#10b981',       // Emerald
  mytv: '#8b5cf6',        // Purple
  mesh: '#f59e0b',        // Amber
  cntt: '#06b6d4',        // Cyan
  revenue: '#f43f5e',     // Rose
  other: '#64748b'        // Slate
};

// Định nghĩa dịch vụ
const SERVICES = [
  { id: 'fiber', label: 'Fiber (Thuê bao)', targetKey: 'fiber_target', resultKey: 'fiber_result' },
  { id: 'mytv', label: 'MyTV (Thuê bao)', targetKey: 'mytv_target', resultKey: 'mytv_result' },
  { id: 'mesh', label: 'Mesh + Camera', targetKey: 'mesh_camera_target', resultKey: 'mesh_camera_result' },
  { id: 'cntt_qty', label: 'Dịch vụ CNTT (Số lượng)', targetKey: 'cntt_target', resultKey: 'cntt_result' },
  { id: 'cntt_rev', label: 'Doanh thu CNTT (VNĐ)', targetKey: 'revenue_cntt_target', resultKey: 'revenue_cntt_result' },
  { id: 'other', label: 'Dịch vụ khác', targetKey: 'other_services_target', resultKey: 'other_services_result' },
  { id: 'sim', label: 'Di động (SIM)', targetKey: 'sim_target', resultKey: 'sim_result' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-100 shadow-xl rounded-xl z-50">
        <p className="text-xs font-black text-slate-400 uppercase mb-3 tracking-wider">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const isRevenue = entry.dataKey === 'revenue_cntt_result' || entry.dataKey === 'revenue_cntt_target' || entry.dataKey === 'rev' || entry.name.includes('Doanh thu');
            const val = isRevenue && entry.value < 1000 ? entry.value * 1000000 : entry.value; // Unscale for revenue if needed visually, but here we keep chart scale
            
            return (
              <div key={index} className="flex items-center justify-between gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                  <span className="font-medium text-slate-600">{entry.name}</span>
                </div>
                <span className="font-black text-slate-800 tabular-nums">
                  {entry.value.toLocaleString('vi-VN')} {isRevenue ? '(Tr)' : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ users, plans }) => {
  // --- STATE ---
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [filterType, setFilterType] = useState<'week' | 'month' | 'year'>('month');
  const [chartViewMode, setChartViewMode] = useState<'by_service' | 'by_employee'>('by_service');
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState<string>("Tuần 1");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);
  const months = Array.from({length: 12}, (_, i) => i + 1);
  const weeks = Array.from({length: 53}, (_, i) => `Tuần ${i + 1}`);

  // --- PROCESSING DATA ---
  const processedData = useMemo(() => {
    // 1. FILTER PLANS
    const filteredPlans = plans.filter(p => {
      const planDate = new Date(p.date);
      const planYear = planDate.getFullYear();
      const planMonth = planDate.getMonth() + 1;

      let timeMatch = false;
      if (filterType === 'year') {
        timeMatch = planYear === selectedYear;
      } else if (filterType === 'month') {
        timeMatch = planYear === selectedYear && planMonth === selectedMonth;
      } else {
        timeMatch = planYear === selectedYear && p.week_number === selectedWeek;
      }

      let empMatch = true;
      if (selectedEmployeeId !== 'all') {
        empMatch = p.employee_id === selectedEmployeeId;
      }

      return timeMatch && empMatch;
    });

    // 2. AGGREGATE BY EMPLOYEE
    const employeeStats: Record<string, { 
      name: string, plan: number, actual: number, id: string, avatar?: string, position: string 
    }> = {};
    
    users.forEach(u => {
      if (u.role !== 'admin') {
         employeeStats[u.employee_id] = { 
           name: u.employee_name, plan: 0, actual: 0, id: u.employee_id, avatar: u.avatar, position: u.position
        };
      }
    });

    filteredPlans.forEach(p => {
      if (employeeStats[p.employee_id]) {
        employeeStats[p.employee_id].plan += (p as any)[selectedService.targetKey] || 0;
        employeeStats[p.employee_id].actual += (p as any)[selectedService.resultKey] || 0;
      }
    });

    const employeeArray = Object.values(employeeStats);
    const barChartByEmployee = employeeArray
      .filter(e => e.position === 'Nhân viên kinh doanh')
      .sort((a, b) => b.actual - a.actual);

    // Rankings
    const rankedEmployees = employeeArray
      .filter(e => e.plan > 0) 
      .map(e => ({ ...e, percent: (e.actual / e.plan) * 100 }))
      .sort((a, b) => b.percent - a.percent); 

    const top2 = rankedEmployees.slice(0, 2);
    const bottom2 = rankedEmployees.length >= 2 ? rankedEmployees.slice(-2).reverse() : []; 

    // 3. AGGREGATE BY SERVICE
    const serviceAggregation: Record<string, { name: string, plan: number, actual: number, isRevenue: boolean }> = {
      sim: { name: 'SIM', plan: 0, actual: 0, isRevenue: false },
      fiber: { name: 'Fiber', plan: 0, actual: 0, isRevenue: false },
      mytv: { name: 'MyTV', plan: 0, actual: 0, isRevenue: false },
      mesh_camera: { name: 'Mesh/Cam', plan: 0, actual: 0, isRevenue: false },
      cntt: { name: 'DV CNTT', plan: 0, actual: 0, isRevenue: false },
      revenue_cntt: { name: 'DT CNTT', plan: 0, actual: 0, isRevenue: true },
      other_services: { name: 'DV Khác', plan: 0, actual: 0, isRevenue: false },
    };

    filteredPlans.forEach(p => {
      serviceAggregation.sim.plan += p.sim_target || 0;
      serviceAggregation.sim.actual += p.sim_result || 0;
      serviceAggregation.fiber.plan += p.fiber_target || 0;
      serviceAggregation.fiber.actual += p.fiber_result || 0;
      serviceAggregation.mytv.plan += p.mytv_target || 0;
      serviceAggregation.mytv.actual += p.mytv_result || 0;
      serviceAggregation.mesh_camera.plan += p.mesh_camera_target || 0;
      serviceAggregation.mesh_camera.actual += p.mesh_camera_result || 0;
      serviceAggregation.cntt.plan += p.cntt_target || 0;
      serviceAggregation.cntt.actual += p.cntt_result || 0;
      serviceAggregation.revenue_cntt.plan += p.revenue_cntt_target || 0;
      serviceAggregation.revenue_cntt.actual += p.revenue_cntt_result || 0;
      serviceAggregation.other_services.plan += p.other_services_target || 0;
      serviceAggregation.other_services.actual += p.other_services_result || 0;
    });

    const barChartByService = Object.values(serviceAggregation)
      .filter(s => s.plan > 0)
      .map(s => {
        if (s.isRevenue) {
          return { ...s, plan: s.plan / 1000000, actual: s.actual / 1000000 };
        }
        return s;
      });

    // 4. TOTALS
    const totalPlan = employeeArray.reduce((acc, curr) => acc + curr.plan, 0);
    const totalActual = employeeArray.reduce((acc, curr) => acc + curr.actual, 0);
    const completionRate = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;
    const totalChartData = [{ name: 'Tổng hợp', plan: totalPlan, actual: totalActual }];

    // 5. KPI STATUS
    let exceeded = 0, met = 0, notMet = 0;
    employeeArray.forEach(stat => {
      if (stat.plan === 0) return;
      const percent = (stat.actual / stat.plan) * 100;
      if (percent >= 100) exceeded++;
      else if (percent >= 80) met++;
      else notMet++;
    });

    const pieChartData = [
      { name: 'Vượt KH (>100%)', value: exceeded, color: COLORS.exceeded },
      { name: 'Đạt KH (80-100%)', value: met, color: COLORS.met },
      { name: 'Chưa đạt (<80%)', value: notMet, color: COLORS.notMet },
    ].filter(d => d.value > 0);

    // 6. DAILY TREND (MULTI-SERVICE)
    const dailyTrendMap: Record<string, any> = {};
    filteredPlans.forEach(p => {
      let timeKey;
      if (filterType === 'year') {
         timeKey = `T${new Date(p.date).getMonth() + 1}`;
      } else {
         timeKey = p.date.split('-')[2]; // DD
      }
      
      if (!dailyTrendMap[timeKey]) {
        dailyTrendMap[timeKey] = { sim: 0, fiber: 0, mytv: 0, mesh: 0, cntt: 0, rev: 0, other: 0 };
      }
      dailyTrendMap[timeKey].sim += p.sim_result || 0;
      dailyTrendMap[timeKey].fiber += p.fiber_result || 0;
      dailyTrendMap[timeKey].mytv += p.mytv_result || 0;
      dailyTrendMap[timeKey].mesh += p.mesh_camera_result || 0;
      dailyTrendMap[timeKey].cntt += p.cntt_result || 0;
      dailyTrendMap[timeKey].rev += p.revenue_cntt_result || 0;
      dailyTrendMap[timeKey].other += p.other_services_result || 0;
    });

    const lineChartData = [];
    if (filterType === 'year') {
      for (let i = 1; i <= 12; i++) {
        const key = `T${i}`;
        const data = dailyTrendMap[key] || { sim: 0, fiber: 0, mytv: 0, mesh: 0, cntt: 0, rev: 0, other: 0 };
        lineChartData.push({ date: key, ...data, rev: data.rev / 1000000 });
      }
    } else {
      const daysCount = filterType === 'month' ? new Date(selectedYear, selectedMonth, 0).getDate() : 31; 
      for (let i = 1; i <= daysCount; i++) {
        const dayStr = i.toString().padStart(2, '0');
        const data = dailyTrendMap[dayStr] || { sim: 0, fiber: 0, mytv: 0, mesh: 0, cntt: 0, rev: 0, other: 0 };
        if (filterType === 'week') {
           if (dailyTrendMap[dayStr]) lineChartData.push({ date: dayStr, ...data, rev: data.rev / 1000000 });
        } else {
           lineChartData.push({ date: dayStr, ...data, rev: data.rev / 1000000 });
        }
      }
      if (filterType === 'week') lineChartData.sort((a: any,b: any) => parseInt(a.date) - parseInt(b.date));
    }

    return { 
      barChartByEmployee, barChartByService, totalChartData, pieChartData, 
      lineChartData, totalPlan, totalActual, completionRate, top2, bottom2
    };
  }, [plans, users, selectedService, filterType, selectedYear, selectedMonth, selectedWeek, selectedEmployeeId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 sticky top-0 z-20 backdrop-blur-xl bg-white/90">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <Activity size={20} />
            </div>
            DASHBOARD KINH DOANH
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1 ml-1">Tổng hợp và phân tích hiệu quả hoạt động</p>
        </div>
        
        {/* GLOBAL FILTERS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
           {/* Time Type Toggle */}
           <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1">
             {(['week', 'month', 'year'] as const).map((type) => (
               <button 
                 key={type}
                 onClick={() => setFilterType(type)}
                 className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all ${filterType === type ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
               >
                 {type === 'week' ? 'Tuần' : type === 'month' ? 'Tháng' : 'Năm'}
               </button>
             ))}
           </div>

           {/* Dropdowns */}
           <div className="flex items-center gap-2 pl-2">
             {filterType === 'week' && (
               <select className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                 {weeks.map(w => <option key={w} value={w}>{w}</option>)}
               </select>
             )}
             {filterType !== 'year' && (
               <select className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                 {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
               </select>
             )}
             <select className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
               {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
             </select>
           </div>
           
           <div className="w-[1px] h-6 bg-slate-300 mx-1"></div>

           {/* Employee Filter */}
           <div className="flex items-center gap-2 pr-2">
              <Users size={14} className="text-slate-400" />
              <select className="bg-transparent text-sm font-bold text-slate-700 outline-none max-w-[120px] cursor-pointer" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                <option value="all">Toàn đội</option>
                {users.filter(u => u.role !== 'admin').map(u => (
                  <option key={u.id} value={u.employee_id}>{u.employee_name}</option>
                ))}
              </select>
           </div>
        </div>
      </div>

      {/* --- ROW 1: KEY METRICS CARDS (SUMMARY) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Selector for Summary Cards */}
        <div className="md:col-span-3 flex justify-end">
           <div className="relative inline-block group">
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-500">
               <Target size={16} />
             </div>
             <select 
               className="appearance-none bg-white border border-blue-100 text-blue-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-8 py-2 font-bold shadow-sm cursor-pointer hover:border-blue-300 transition"
               value={SERVICES.indexOf(selectedService)}
               onChange={(e) => setSelectedService(SERVICES[parseInt(e.target.value)])}
             >
               {SERVICES.map((s, idx) => <option key={s.id} value={idx}>{s.label}</option>)}
             </select>
             <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-blue-400">
               <ChevronDown size={14} />
             </div>
           </div>
        </div>

        {/* Metric Cards */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={80} /></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest z-10">Kế Hoạch</p>
           <div className="flex items-baseline gap-1 z-10">
             <span className="text-3xl font-black text-slate-800">{processedData.totalPlan.toLocaleString()}</span>
             <span className="text-xs font-bold text-slate-400">đơn vị</span>
           </div>
           <div className="w-full bg-slate-100 h-1.5 rounded-full mt-auto z-10 overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full w-full"></div>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 flex flex-col justify-between h-32 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-blue-600"><Zap size={80} /></div>
           <p className="text-xs font-bold text-blue-400 uppercase tracking-widest z-10">Thực Hiện</p>
           <div className="flex items-baseline gap-1 z-10">
             <span className="text-3xl font-black text-blue-600">{processedData.totalActual.toLocaleString()}</span>
             <span className="text-xs font-bold text-blue-300">đơn vị</span>
           </div>
           <div className="w-full bg-blue-50 h-1.5 rounded-full mt-auto z-10 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(processedData.completionRate, 100)}%` }}
              ></div>
           </div>
        </div>

        <div className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-between h-32 relative overflow-hidden group
          ${processedData.completionRate >= 100 ? 'bg-emerald-50 border-emerald-100' : processedData.completionRate >= 80 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}
        `}>
           <p className="text-xs font-bold opacity-60 uppercase tracking-widest z-10 text-slate-600">Tỷ Lệ Hoàn Thành</p>
           <div className="flex items-center gap-3 z-10">
             <span className={`text-4xl font-black tracking-tighter
               ${processedData.completionRate >= 100 ? 'text-emerald-600' : processedData.completionRate >= 80 ? 'text-amber-600' : 'text-rose-600'}
             `}>
               {processedData.completionRate.toFixed(1)}%
             </span>
             <div className={`p-1.5 rounded-full ${processedData.completionRate >= 100 ? 'bg-emerald-200 text-emerald-700' : 'bg-white/50 text-slate-500'}`}>
                {processedData.completionRate >= 100 ? <ArrowUp size={20} /> : <TrendingUp size={20} />}
             </div>
           </div>
           <p className="text-[10px] font-bold opacity-50 z-10 mt-auto">So với kế hoạch đề ra</p>
        </div>
      </div>

      {/* --- ROW 2: TREND ANALYSIS (FULL WIDTH - PRIORITY) --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex justify-between items-start mb-6 z-10 relative">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <TrendingUp className="text-indigo-600" size={24} />
              Biến Động Sản Lượng
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1">Theo dõi xu hướng thực hiện của tất cả dịch vụ theo thời gian</p>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Đa Dịch Vụ</span>
          </div>
        </div>

        <div className="h-[320px] w-full z-10 relative">
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={processedData.lineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
               <defs>
                 {Object.entries(SERVICE_COLORS).map(([key, color]) => (
                    <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                 ))}
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} interval="preserveStartEnd" />
               
               {/* Left Axis: Counts */}
               <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
               
               {/* Right Axis: Revenue */}
               <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: SERVICE_COLORS.revenue}} unit=" Tr" width={40} />

               <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
               <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}/>
               
               <Line yAxisId="left" type="monotone" name="SIM" dataKey="sim" stroke={SERVICE_COLORS.sim} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
               <Line yAxisId="left" type="monotone" name="Fiber" dataKey="fiber" stroke={SERVICE_COLORS.fiber} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
               <Line yAxisId="left" type="monotone" name="MyTV" dataKey="mytv" stroke={SERVICE_COLORS.mytv} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
               <Line yAxisId="left" type="monotone" name="Mesh/Cam" dataKey="mesh" stroke={SERVICE_COLORS.mesh} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
               <Line yAxisId="left" type="monotone" name="DV CNTT" dataKey="cntt" stroke={SERVICE_COLORS.cntt} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
               <Line yAxisId="left" type="monotone" name="DV Khác" dataKey="other" stroke={SERVICE_COLORS.other} strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
               
               {/* Revenue Line */}
               <Line yAxisId="right" type="monotone" name="DT CNTT" dataKey="rev" stroke={SERVICE_COLORS.revenue} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
             </ComposedChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* --- ROW 3: COMPARISON & COMPOSITION (SPLIT VIEW) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN COMPARISON CHART (2/3 Width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <BarChart2 className="text-blue-600" size={24} />
                So Sánh Hiệu Quả
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-1">So sánh Thực hiện vs Kế hoạch (NVKD)</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setChartViewMode('by_service')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartViewMode === 'by_service' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Layers size={12} /> Theo Dịch Vụ
              </button>
              <button onClick={() => setChartViewMode('by_employee')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartViewMode === 'by_employee' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Users size={12} /> Theo Nhân Viên
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === 'by_service' ? (
                <ComposedChart data={processedData.barChartByService} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 700}} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8b5cf6'}} tickFormatter={(val) => `${val}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar yAxisId="left" name="Kế hoạch" dataKey="plan" fill={COLORS.plan} radius={[4, 4, 4, 4]} barSize={16} />
                  <Bar yAxisId="left" name="Thực hiện" dataKey="actual" fill={COLORS.actual} radius={[4, 4, 4, 4]} barSize={16} />
                </ComposedChart>
              ) : (
                <BarChart data={processedData.barChartByEmployee} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={2} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar name="Kế hoạch" dataKey="plan" fill={COLORS.plan} radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar name="Thực hiện" dataKey="actual" fill={COLORS.actual} radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {chartViewMode === 'by_service' ? '* DT CNTT quy đổi: Triệu VNĐ' : `* Dữ liệu: ${selectedService.label}`}
          </div>
        </div>

        {/* SIDE COLUMN: TOTAL SUMMARY + KPI PIE (1/3 Width) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           
           {/* Total Summary Mini-Chart */}
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Sigma size={16} /></div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Tổng Hợp Chung</h3>
              </div>
              <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.totalChartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" hide />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                     <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                     <Bar name="Tổng KH" dataKey="plan" fill={COLORS.plan} radius={[6, 6, 6, 6]} barSize={32} />
                     <Bar name="Tổng TH" dataKey="actual" fill={COLORS.actual} radius={[6, 6, 6, 6]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* KPI Pie Chart */}
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><PieIcon size={16} /></div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Tỷ Lệ Đạt KPI</h3>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-full h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={processedData.pieChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                          {processedData.pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="w-full space-y-2">
                    {processedData.pieChartData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></div>
                           <span className="font-bold text-slate-500">{entry.name.split('(')[0]}</span>
                        </div>
                        <span className="font-black text-slate-800">{entry.value} NV</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* --- ROW 4: LEADERBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* TOP 2 */}
         <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-1 shadow-lg shadow-emerald-200">
            <div className="bg-white rounded-[22px] p-6 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Trophy size={100} className="text-emerald-600"/></div>
                <h3 className="text-emerald-700 font-black flex items-center gap-2 mb-6 uppercase tracking-tight">
                   <Trophy size={20} className="text-emerald-500" /> Top Xuất Sắc
                </h3>
                <div className="space-y-4">
                  {processedData.top2.length > 0 ? processedData.top2.map((emp, idx) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md ${idx === 0 ? 'bg-yellow-400' : 'bg-slate-300'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{emp.name}</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                               <span>TH: {emp.actual}</span>
                               <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                               <span>KH: {emp.plan}</span>
                            </div>
                          </div>
                       </div>
                       <span className="text-lg font-black text-emerald-600">{emp.percent.toFixed(0)}%</span>
                    </div>
                  )) : <p className="text-slate-400 text-sm italic">Chưa có dữ liệu</p>}
                </div>
            </div>
         </div>

         {/* BOTTOM 2 */}
         <div className="bg-gradient-to-r from-rose-500 to-orange-500 rounded-3xl p-1 shadow-lg shadow-rose-200">
            <div className="bg-white rounded-[22px] p-6 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><AlertTriangle size={100} className="text-rose-600"/></div>
                <h3 className="text-rose-700 font-black flex items-center gap-2 mb-6 uppercase tracking-tight">
                   <AlertTriangle size={20} className="text-rose-500" /> Cần Cải Thiện
                </h3>
                <div className="space-y-4">
                  {processedData.bottom2.length > 0 ? processedData.bottom2.map((emp, idx) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-100">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white bg-rose-300 shadow-md">!</div>
                          <div>
                            <p className="font-bold text-slate-800">{emp.name}</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                               <span>TH: {emp.actual}</span>
                               <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                               <span>KH: {emp.plan}</span>
                            </div>
                          </div>
                       </div>
                       <span className="text-lg font-black text-rose-600">{emp.percent.toFixed(0)}%</span>
                    </div>
                  )) : <p className="text-slate-400 text-sm italic">Không có dữ liệu</p>}
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};
