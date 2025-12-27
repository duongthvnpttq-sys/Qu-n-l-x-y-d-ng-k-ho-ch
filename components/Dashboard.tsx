
import React, { useMemo, useState } from 'react';
import { User, Plan } from '../types';
import { 
  TrendingUp, Calendar, Users, Target, BarChart2, PieChart as PieIcon, Activity, 
  ArrowUp, ArrowDown, Trophy, AlertTriangle, ChevronDown, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';

interface DashboardProps {
  users: User[];
  plans: Plan[];
}

// Cấu hình màu sắc
const COLORS = {
  plan: '#94a3b8',        
  actual: '#2563eb',      
  exceeded: '#10b981',    
  met: '#f59e0b',         
  notMet: '#ef4444',      
  line: '#8b5cf6'         
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
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg z-50">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="font-medium text-slate-600">{entry.name}:</span>
            <span className="font-bold text-slate-900">
              {entry.value.toLocaleString('vi-VN')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ users, plans }) => {
  // --- STATE QUẢN LÝ BỘ LỌC ---
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [filterType, setFilterType] = useState<'week' | 'month' | 'year'>('month');
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState<string>("Tuần 1");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  // Generate lists for dropdowns
  const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i); // 5 years range
  const months = Array.from({length: 12}, (_, i) => i + 1);
  const weeks = Array.from({length: 53}, (_, i) => `Tuần ${i + 1}`);

  // --- XỬ LÝ DỮ LIỆU ---
  const processedData = useMemo(() => {
    // 1. Lọc dữ liệu theo thời gian (Tuần / Tháng / Năm)
    const filteredPlans = plans.filter(p => {
      const planDate = new Date(p.date);
      const planYear = planDate.getFullYear();
      const planMonth = planDate.getMonth() + 1;

      if (filterType === 'year') {
        return planYear === selectedYear;
      } else if (filterType === 'month') {
        return planYear === selectedYear && planMonth === selectedMonth;
      } else {
        // Filter by Week: Check year and week_number string
        return planYear === selectedYear && p.week_number === selectedWeek;
      }
    });

    // 2. Tổng hợp dữ liệu theo nhân viên
    const employeeStats: Record<string, { 
      name: string, 
      plan: number, 
      actual: number, 
      id: string, 
      avatar?: string,
      position: string 
    }> = {};
    
    // Init employees
    users.forEach(u => {
      if (u.role !== 'admin') {
         employeeStats[u.employee_id] = { 
           name: u.employee_name, 
           plan: 0, 
           actual: 0, 
           id: u.employee_id,
           avatar: u.avatar,
           position: u.position
        };
      }
    });

    // Aggregate data
    filteredPlans.forEach(p => {
      if (employeeStats[p.employee_id]) {
        employeeStats[p.employee_id].plan += (p as any)[selectedService.targetKey] || 0;
        employeeStats[p.employee_id].actual += (p as any)[selectedService.resultKey] || 0;
      }
    });

    // Convert to array
    const employeeArray = Object.values(employeeStats);
    
    // 3. Logic Biểu đồ cột & Xếp hạng (Ranking)
    // Tính % hoàn thành để xếp hạng
    const rankedEmployees = employeeArray
      .filter(e => e.plan > 0) // Chỉ xếp hạng những người có chỉ tiêu > 0
      .map(e => ({
        ...e,
        percent: (e.actual / e.plan) * 100
      }))
      .sort((a, b) => b.percent - a.percent); // Sắp xếp giảm dần theo %

    const top2 = rankedEmployees.slice(0, 2);
    const bottom2 = rankedEmployees.length >= 2 ? rankedEmployees.slice(-2).reverse() : []; // Lấy 2 người cuối và đảo ngược để người thấp nhất đứng đầu cảnh báo

    // Dữ liệu cho biểu đồ cột (Sắp xếp theo sản lượng thực tế)
    // CẬP NHẬT: Chỉ hiển thị Nhân viên kinh doanh
    const barChartData = employeeArray
      .filter(e => e.position === 'Nhân viên kinh doanh')
      .sort((a, b) => b.actual - a.actual);

    // 4. Logic Biểu đồ tròn (KPI Status)
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

    // 5. Logic Biểu đồ đường (Xu hướng ngày)
    const dailyTrendMap: Record<string, number> = {};
    filteredPlans.forEach(p => {
      if (selectedEmployeeId !== 'all' && p.employee_id !== selectedEmployeeId) return;
      // Nếu xem theo tuần/tháng thì group theo ngày trong tháng
      // Nếu xem theo năm thì group theo tháng (1-12)
      let timeKey;
      if (filterType === 'year') {
         timeKey = `T${new Date(p.date).getMonth() + 1}`;
      } else {
         timeKey = p.date.split('-')[2]; // DD
      }
      
      const val = (p as any)[selectedService.resultKey] || 0;
      dailyTrendMap[timeKey] = (dailyTrendMap[timeKey] || 0) + val;
    });

    const lineChartData = [];
    if (filterType === 'year') {
      for (let i = 1; i <= 12; i++) {
        const key = `T${i}`;
        lineChartData.push({ date: key, value: dailyTrendMap[key] || 0 });
      }
    } else {
      // Days logic
      const daysCount = filterType === 'month' 
        ? new Date(selectedYear, selectedMonth, 0).getDate() 
        : 31; // Simplified for week view context
      
      for (let i = 1; i <= daysCount; i++) {
        const dayStr = i.toString().padStart(2, '0');
        // Chỉ hiện những ngày có dữ liệu nếu là view tuần để đỡ rối, hoặc hiện hết nếu là tháng
        if (filterType === 'week') {
           if (dailyTrendMap[dayStr]) lineChartData.push({ date: dayStr, value: dailyTrendMap[dayStr] });
        } else {
           lineChartData.push({ date: dayStr, value: dailyTrendMap[dayStr] || 0 });
        }
      }
      if (filterType === 'week') {
         // Sort lại theo ngày nếu view tuần bị nhảy cóc
         lineChartData.sort((a,b) => parseInt(a.date) - parseInt(b.date));
      }
    }

    // 6. Tổng hợp chung
    const totalPlan = employeeArray.reduce((acc, curr) => acc + curr.plan, 0);
    const totalActual = employeeArray.reduce((acc, curr) => acc + curr.actual, 0);
    const completionRate = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;

    return { 
      barChartData, 
      pieChartData, 
      lineChartData, 
      totalPlan, 
      totalActual, 
      completionRate,
      top2,
      bottom2
    };
  }, [plans, users, selectedService, filterType, selectedYear, selectedMonth, selectedWeek, selectedEmployeeId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* --- HEADER & FILTERS --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-blue-600" />
              DASHBOARD QUẢN TRỊ KINH DOANH
            </h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi, đánh giá và so sánh hiệu quả kinh doanh dịch vụ viễn thông</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto bg-slate-50 p-2 rounded-xl border border-slate-200">
             {/* Service Selector */}
             <div className="relative min-w-[180px] flex-1">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Target size={16} /></div>
               <select 
                 className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                 value={SERVICES.indexOf(selectedService)}
                 onChange={(e) => setSelectedService(SERVICES[parseInt(e.target.value)])}
               >
                 {SERVICES.map((s, idx) => (
                   <option key={s.id} value={idx}>{s.label}</option>
                 ))}
               </select>
               <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>

             <div className="h-8 w-[1px] bg-slate-300 mx-1 hidden sm:block"></div>

             {/* Filter Type */}
             <div className="flex bg-slate-200/50 rounded-lg p-1">
               <button 
                 onClick={() => setFilterType('week')}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === 'week' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Tuần
               </button>
               <button 
                 onClick={() => setFilterType('month')}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === 'month' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Tháng
               </button>
               <button 
                 onClick={() => setFilterType('year')}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === 'year' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Năm
               </button>
             </div>

             {/* Conditional Time Inputs */}
             <div className="flex items-center gap-2">
               {filterType === 'week' && (
                 <select 
                   className="py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                   value={selectedWeek}
                   onChange={(e) => setSelectedWeek(e.target.value)}
                 >
                   {weeks.map(w => <option key={w} value={w}>{w}</option>)}
                 </select>
               )}
               
               {filterType !== 'year' && (
                 <select 
                   className="py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                   value={selectedMonth}
                   onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                 >
                   {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                 </select>
               )}

               <select 
                 className="py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               >
                 {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
               </select>
             </div>
          </div>
        </div>

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-4">
             <div className="p-3 bg-white rounded-full shadow-sm text-slate-400"><Target size={24}/></div>
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase">Kế hoạch {selectedService.label}</p>
               <p className="text-2xl font-black text-slate-700">{processedData.totalPlan.toLocaleString()}</p>
             </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center gap-4">
             <div className="p-3 bg-white rounded-full shadow-sm text-blue-600"><BarChart2 size={24}/></div>
             <div>
               <p className="text-xs font-bold text-blue-400 uppercase">Thực hiện {selectedService.label}</p>
               <p className="text-2xl font-black text-blue-700">{processedData.totalActual.toLocaleString()}</p>
             </div>
          </div>

          <div className={`rounded-xl p-4 border flex items-center gap-4 ${
            processedData.completionRate >= 100 ? 'bg-emerald-50 border-emerald-100' : 
            processedData.completionRate >= 80 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'
          }`}>
             <div className="p-3 bg-white rounded-full shadow-sm">
                {processedData.completionRate >= 100 ? <ArrowUp size={24} className="text-emerald-500"/> : <ArrowDown size={24} className="text-rose-500"/>}
             </div>
             <div>
               <p className="text-xs font-bold uppercase opacity-60">Tỷ lệ hoàn thành</p>
               <p className={`text-2xl font-black ${
                 processedData.completionRate >= 100 ? 'text-emerald-600' : 
                 processedData.completionRate >= 80 ? 'text-amber-600' : 'text-rose-600'
               }`}>
                 {processedData.completionRate.toFixed(1)}%
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* --- TOP PERFORMERS SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* TOP 2 BEST */}
         <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80} className="text-emerald-600"/></div>
            <h3 className="text-emerald-800 font-bold flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-emerald-600" />
              TOP 2 NHÂN VIÊN XUẤT SẮC
            </h3>
            <div className="space-y-3 relative z-10">
              {processedData.top2.length > 0 ? processedData.top2.map((emp, idx) => (
                <div key={emp.id} className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${idx === 0 ? 'bg-yellow-400' : 'bg-slate-300'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{emp.actual.toLocaleString()} / {emp.plan.toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="block text-lg font-black text-emerald-600">{emp.percent.toFixed(1)}%</span>
                   </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic">Chưa có dữ liệu xếp hạng</p>
              )}
            </div>
         </div>

         {/* BOTTOM 2 */}
         <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-6 border border-rose-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={80} className="text-rose-600"/></div>
            <h3 className="text-rose-800 font-bold flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-rose-600" />
              NHÂN SỰ CẦN CẢI THIỆN (THẤP NHẤT)
            </h3>
            <div className="space-y-3 relative z-10">
              {processedData.bottom2.length > 0 ? processedData.bottom2.map((emp, idx) => (
                <div key={emp.id} className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-rose-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white bg-slate-300">
                        !
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{emp.actual.toLocaleString()} / {emp.plan.toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="block text-lg font-black text-rose-600">{emp.percent.toFixed(1)}%</span>
                   </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic">Không có nhân sự dưới chuẩn hoặc chưa đủ dữ liệu</p>
              )}
            </div>
         </div>
      </div>

      {/* --- CHART 1: COLUMN CHART (COMPARE EMPLOYEES) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={20} />
            So Sánh Hiệu Quả Kinh Doanh Theo Nhân Viên
          </h2>
          <span className="text-xs font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-500">Đơn vị: {selectedService.id === 'cntt_rev' ? 'VNĐ' : 'Số lượng'}</span>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData.barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} tickFormatter={(val) => val >= 1000000 ? `${val/1000000}M` : val} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
              <Bar name="Kế hoạch" dataKey="plan" fill={COLORS.plan} radius={[4, 4, 0, 0]} barSize={20} />
              <Bar name="Thực hiện" dataKey="actual" fill={COLORS.actual} radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- CHART 2: PIE CHART (KPI STATUS) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="text-purple-600" size={20} />
              Tỷ Lệ Đạt Chỉ Tiêu Của Nhân Sự
            </h2>
            <p className="text-xs text-slate-400 mt-1">Phân loại nhân viên theo mức độ hoàn thành KPI</p>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center">
             <div className="w-full h-[250px] md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={processedData.pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {processedData.pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="w-full md:w-1/2 space-y-3 pl-0 md:pl-6">
                {processedData.pieChartData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
                       <span className="text-xs font-bold text-slate-600">{entry.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">{entry.value} NV</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- CHART 3: LINE CHART (DAILY TREND) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={20} />
                Biến Động Sản Lượng
              </h2>
              <p className="text-xs text-slate-400 mt-1">Theo {filterType === 'year' ? 'tháng trong năm' : 'ngày trong kỳ'}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
               <Users size={14} className="text-slate-400" />
               <select 
                 className="bg-transparent text-xs font-bold text-slate-600 outline-none max-w-[100px]"
                 value={selectedEmployeeId}
                 onChange={(e) => setSelectedEmployeeId(e.target.value)}
               >
                 <option value="all">Toàn đội</option>
                 {users.filter(u => u.role !== 'admin').map(u => (
                   <option key={u.id} value={u.employee_id}>{u.employee_name}</option>
                 ))}
               </select>
            </div>
          </div>

          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={processedData.lineChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={filterType === 'week' ? 0 : 2} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                 <Tooltip content={<CustomTooltip />} />
                 <Line 
                    type="monotone" 
                    name="Thực hiện" 
                    dataKey="value" 
                    stroke={COLORS.line} 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: COLORS.line, strokeWidth: 0 }} 
                    activeDot={{ r: 6 }} 
                  />
               </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
