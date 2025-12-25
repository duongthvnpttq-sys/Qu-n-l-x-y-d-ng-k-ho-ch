
import React, { useMemo, useState } from 'react';
import { User, Plan } from '../types';
import { 
  BarChart3, Activity, ArrowUpRight, ArrowDownRight, 
  Target, Zap, Award, AlertTriangle, Users as UsersIcon, 
  Filter, Calendar, TrendingUp, User as UserIcon, Clock,
  ChevronRight, CheckCircle2, AlertCircle, Smartphone, Globe, Tv, Camera, Cpu
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardProps {
  users: User[];
  plans: Plan[];
}

const ServiceProgressCard = ({ name, actual, target, ratio, color, icon: Icon }: { 
  name: string; 
  actual: number; 
  target: number; 
  ratio: number; 
  color: string;
  icon: any;
}) => {
  const data = [
    { value: ratio },
    { value: Math.max(0, 100 - ratio) }
  ];

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center group">
      <div className="flex items-center justify-between w-full mb-4">
        <div className={`p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all`} style={{ color: color }}>
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{name}</span>
      </div>

      <div className="relative w-full h-32 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={45}
              startAngle={90}
              endAngle={450}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#F1F5F9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-900 leading-none">{ratio}%</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Đạt</span>
        </div>
      </div>

      <div className="mt-4 w-full space-y-1">
        <div className="flex justify-between items-end">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Thực đạt</span>
          <span className="text-sm font-black text-slate-800">{actual.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Mục tiêu</span>
          <span className="text-xs font-bold text-slate-500">{target.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, planPercent, growth, isPositive, colorClass }: { 
  title: string; 
  value: string; 
  planPercent: number; 
  growth: number; 
  isPositive: boolean;
  colorClass: string;
}) => (
  <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 rounded-full ${colorClass}`}></div>
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{title}</h4>
    <div className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">{value}</div>
    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-400 uppercase">Kế hoạch</span>
        <span className={`text-sm font-black ${planPercent >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>{planPercent}%</span>
      </div>
      <div className="flex flex-col text-right">
        <span className="text-[9px] font-bold text-slate-400 uppercase">Tăng trưởng</span>
        <div className={`flex items-center gap-0.5 text-sm font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {growth}%
        </div>
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ users, plans }) => {
  const [selectedWeek, setSelectedWeek] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('All');

  const stats = useMemo(() => {
    const filteredPlans = plans.filter(p => {
      const pDate = new Date(p.date);
      const matchYear = selectedYear === 'All' || pDate.getFullYear().toString() === selectedYear;
      const matchMonth = selectedMonth === 'All' || (pDate.getMonth() + 1).toString() === selectedMonth;
      const matchWeek = selectedWeek === 'All' || p.week_number === selectedWeek;
      const matchEmp = selectedEmployee === 'All' || p.employee_id === selectedEmployee;
      return matchYear && matchMonth && matchWeek && matchEmp;
    });

    const completed = filteredPlans.filter(p => p.status === 'completed');

    const services = [
      { name: 'SIM', key: 'sim', color: '#3B82F6', icon: Smartphone },
      { name: 'Fiber', key: 'fiber', color: '#10B981', icon: Globe },
      { name: 'MyTV', key: 'mytv', color: '#8B5CF6', icon: Tv },
      { name: 'Mesh/Cam', key: 'mesh_camera', color: '#F59E0B', icon: Camera },
      { name: 'CNTT', key: 'cntt', color: '#6366F1', icon: Cpu }
    ];

    const serviceData = services.map(s => {
      const target = filteredPlans.reduce((sum, p) => sum + (Number((p as any)[`${s.key}_target`]) || 0), 0);
      const result = completed.reduce((sum, p) => sum + (Number((p as any)[`${s.key}_result`]) || 0), 0);
      return { 
        name: s.name, 
        Actual: result, 
        Target: target, 
        Ratio: target > 0 ? Math.round((result / target) * 100) : 0,
        color: s.color,
        icon: s.icon
      };
    });

    const targetEmployees = users.filter(u => u.role === 'employee');
    const employees = targetEmployees.map(u => {
      const uPlans = plans.filter(p => {
          const pDate = new Date(p.date);
          const matchYear = selectedYear === 'All' || pDate.getFullYear().toString() === selectedYear;
          const matchMonth = selectedMonth === 'All' || (pDate.getMonth() + 1).toString() === selectedMonth;
          const matchWeek = selectedWeek === 'All' || p.week_number === selectedWeek;
          return p.employee_id === u.employee_id && matchYear && matchMonth && matchWeek;
      });
      const uCompleted = uPlans.filter(p => p.status === 'completed');
      
      const targetTotal = uPlans.reduce((sum, p) => sum + p.sim_target + p.fiber_target + p.mytv_target + p.mesh_camera_target + p.cntt_target, 0);
      const resultTotal = uCompleted.reduce((sum, p) => sum + p.sim_result + p.fiber_result + p.mytv_result + p.mesh_camera_result + p.cntt_result, 0);
      const ratio = targetTotal > 0 ? Math.round((resultTotal / targetTotal) * 100) : 0;

      return {
        id: u.employee_id,
        name: u.employee_name,
        target: targetTotal,
        actual: resultTotal,
        ratio: ratio,
        status: ratio >= 100 ? 'excellent' : ratio >= 80 ? 'good' : ratio >= 50 ? 'average' : 'weak'
      };
    }).sort((a, b) => b.actual - a.actual);

    const weeks = Array.from(new Set(plans.map(p => p.week_number))).sort().slice(-8);
    const weeklyData = weeks.map(w => {
      const wPlans = plans.filter(p => p.week_number === w && (selectedEmployee === 'All' || p.employee_id === selectedEmployee));
      const wTarget = wPlans.reduce((sum, p) => sum + (p.sim_target + p.fiber_target + p.mytv_target + p.mesh_camera_target + p.cntt_target), 0);
      const wActual = wPlans.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.sim_result + p.fiber_result + p.mytv_result + p.mesh_camera_result + p.cntt_result), 0);
      return { name: w, Target: wTarget, Actual: wActual };
    });

    return { serviceData, employees, weeklyData };
  }, [plans, users, selectedWeek, selectedMonth, selectedYear, selectedEmployee]);

  const allWeeks = useMemo(() => Array.from(new Set(plans.map(p => p.week_number))).sort(), [plans]);
  const allYears = useMemo(() => Array.from(new Set(plans.map(p => new Date(p.date).getFullYear().toString()))).sort(), [plans]);
  const allEmployees = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

  const filterSelectStyle = "px-4 py-2 text-[11px] font-black outline-none bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-blue-400 transition-all shadow-sm focus:ring-4 focus:ring-blue-50";

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-6 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER & FILTERS */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-500/30">
              <TrendingUp size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Dashboard Kinh Doanh</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Số liệu theo kế hoạch thực tế
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhân viên</span>
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className={filterSelectStyle}>
                <option value="All">Tất cả nhân viên</option>
                {allEmployees.map(u => <option key={u.employee_id} value={u.employee_id}>{u.employee_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian</span>
              <div className="flex gap-2">
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={filterSelectStyle}>
                  <option value="All">Năm</option>
                  {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={filterSelectStyle}>
                  <option value="All">Tháng</option>
                  {Array.from({length: 12}, (_, i) => <option key={i+1} value={(i+1).toString()}>Tháng {i+1}</option>)}
                </select>
                <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className={`${filterSelectStyle} !text-blue-600`}>
                  <option value="All">Tuần</option>
                  {allWeeks.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TOP KPIs SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Tổng sản lượng" 
            value={(stats.serviceData.reduce((acc, curr) => acc + curr.Actual, 0)).toLocaleString()} 
            planPercent={stats.employees.length > 0 ? Math.round(stats.employees.reduce((s,e) => s+e.ratio, 0)/stats.employees.length) : 0} 
            growth={4.2} 
            isPositive={true} 
            colorClass="bg-blue-500" 
          />
          <KPICard title="Dịch vụ Sim" value={stats.serviceData[0].Actual.toLocaleString()} planPercent={stats.serviceData[0].Ratio} growth={8.1} isPositive={true} colorClass="bg-blue-400" />
          <KPICard title="Dịch vụ Fiber" value={stats.serviceData[1].Actual.toLocaleString()} planPercent={stats.serviceData[1].Ratio} growth={-2.4} isPositive={false} colorClass="bg-emerald-400" />
          <KPICard title="Khách hàng tiếp cận" value={(plans.reduce((acc, p) => acc + (p.customers_contacted || 0), 0)).toLocaleString()} planPercent={88} growth={12} isPositive={true} colorClass="bg-purple-400" />
        </div>

        {/* SERVICE PROGRESS CIRCLES - NEW SECTION */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Target size={14} className="text-blue-500" /> Tiến độ mục tiêu theo dịch vụ
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {stats.serviceData.map((service) => (
              <ServiceProgressCard 
                key={service.name}
                name={service.name}
                actual={service.Actual}
                target={service.Target}
                ratio={service.Ratio}
                color={service.color}
                icon={service.icon}
              />
            ))}
          </div>
        </div>

        {/* CHARTS & RANKING */}
        <div className="grid grid-cols-12 gap-8">
          
          <div className="col-span-12 xl:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Biểu đồ tăng trưởng tuần</h3>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Thực đạt</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-100"></span> Kế hoạch</div>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData} margin={{ top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#64748B'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    cursor={{fill: '#F8FAFC'}} 
                  />
                  <Bar name="Thực tế" dataKey="Actual" fill="#3B82F6" radius={[6, 6, 6, 6]} barSize={35} />
                  <Bar name="Kế hoạch" dataKey="Target" fill="#E2E8F0" radius={[6, 6, 6, 6]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Xếp hạng nhân viên</h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Tất cả <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {stats.employees.map((emp, i) => (
                <div key={emp.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      i === 0 ? 'bg-amber-100 text-amber-600' : 
                      i === 1 ? 'bg-slate-200 text-slate-600' : 
                      i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{emp.name}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Đạt: {emp.ratio}%</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    emp.status === 'excellent' ? 'bg-emerald-50 text-emerald-600' : 
                    emp.status === 'weak' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {emp.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ALERTS & INSIGHTS - FOOTER SECTION */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-rose-500"><AlertCircle size={24} /></div>
                <div>
                  <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest">Cần đôn đốc</h3>
                  <p className="text-xs font-medium text-rose-600/70 mt-1">Có {stats.employees.filter(e => e.status === 'weak').length} nhân sự chưa đạt ngưỡng 50% mục tiêu.</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                 {stats.employees.filter(e => e.status === 'weak').slice(0, 3).map(e => (
                   <div key={e.id} title={e.name} className="w-10 h-10 rounded-full border-2 border-rose-50 bg-white flex items-center justify-center text-rose-500 font-black text-xs shadow-sm">
                     {e.name.charAt(0)}
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-500"><Award size={24} /></div>
                <div>
                  <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Thành tích tốt</h3>
                  <p className="text-xs font-medium text-emerald-600/70 mt-1">Ghi nhận {stats.employees.filter(e => e.status === 'excellent').length} nhân sự xuất sắc vượt chỉ tiêu.</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                 {stats.employees.filter(e => e.status === 'excellent').slice(0, 3).map(e => (
                   <div key={e.id} title={e.name} className="w-10 h-10 rounded-full border-2 border-emerald-50 bg-white flex items-center justify-center text-emerald-500 font-black text-xs shadow-sm">
                     {e.name.charAt(0)}
                   </div>
                 ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
