import React, { useState, useRef, useMemo } from 'react';
import { User, Plan } from '../types';
import * as XLSX from 'xlsx';
import { 
  PlusCircle, Clock, CheckCircle, XCircle, 
  Download, Upload, Users as UsersIcon,
  Smartphone, Globe, Tv, Camera, Cpu, DollarSign, Plus,
  CalendarOff, History, ChevronDown, ChevronUp, Edit3, AlertCircle, Save
} from 'lucide-react';

interface WeeklyPlanProps {
  currentUser: User;
  plans: Plan[];
  onAddPlan: (plan: Omit<Plan, 'id' | 'created_at'>) => void;
  onUpdatePlan?: (plan: Plan) => void; // Added for updating adjustment request
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Clock size={12} /> },
  approved: { label: 'Đã duyệt', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle size={12} /> },
  rejected: { label: 'Từ chối', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: <XCircle size={12} /> },
  completed: { label: 'Hoàn thành', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <CheckCircle size={12} /> }
};

const PlanCard: React.FC<{ plan: Plan; onAdjustRequest: (plan: Plan) => void }> = ({ plan, onAdjustRequest }) => (
  <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100 group hover:shadow-md transition-all relative overflow-hidden">
    <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase border-b border-l flex items-center gap-1.5 ${statusConfig[plan.status]?.color || 'bg-gray-100 text-gray-600'}`}>
        {statusConfig[plan.status]?.icon}
        {statusConfig[plan.status]?.label || plan.status}
    </div>
    
    <div className="mb-4 pt-2">
        <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{plan.week_number}</div>
        <div className="text-xl font-black text-slate-800">{new Date(plan.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        <div className="text-sm font-bold text-slate-500 mt-1 uppercase flex items-center gap-1">{plan.area}</div>
    </div>

    <div className="bg-slate-50 p-4 rounded-2xl text-sm font-medium text-slate-700 italic leading-relaxed mb-4 border border-slate-100">
      "{plan.work_content}"
    </div>

    <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
          <span className="text-[9px] font-black text-blue-500 block uppercase">SIM</span>
          <span className="text-sm font-black text-blue-700">{plan.sim_target}</span>
        </div>
        <div className="text-center bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
          <span className="text-[9px] font-black text-emerald-500 block uppercase">Fib</span>
          <span className="text-sm font-black text-emerald-700">{plan.fiber_target}</span>
        </div>
        <div className="text-center bg-purple-50/50 p-2 rounded-xl border border-purple-100/50">
          <span className="text-[9px] font-black text-purple-500 block uppercase">MyTV</span>
          <span className="text-sm font-black text-purple-700">{plan.mytv_target}</span>
        </div>
        <div className="text-center bg-amber-50/50 p-2 rounded-xl border border-amber-100/50">
          <span className="text-[9px] font-black text-amber-500 block uppercase">M/C</span>
          <span className="text-sm font-black text-amber-700">{plan.mesh_camera_target}</span>
        </div>
    </div>

    {/* Adjustment UI Logic */}
    {plan.status === 'approved' && (
      <div className="border-t border-slate-100 pt-3">
        {plan.adjustment_status === 'pending' ? (
          <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
             <Clock size={14} /> Đang chờ duyệt điều chỉnh
          </div>
        ) : (
          <button 
            onClick={() => onAdjustRequest(plan)}
            className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors border border-slate-200 hover:border-slate-300"
          >
             <Edit3 size={14} /> Xin điều chỉnh chỉ tiêu
          </button>
        )}
      </div>
    )}
  </div>
);

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ currentUser, plans, onAddPlan, onUpdatePlan }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Adjustment Modal State
  const [adjustingPlan, setAdjustingPlan] = useState<Plan | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    sim_target: 0, vas_target: 0, fiber_target: 0, mytv_target: 0,
    mesh_camera_target: 0, cntt_target: 0, revenue_cntt_target: 0, other_services_target: 0,
    adjustment_reason: ''
  });

  const [formData, setFormData] = useState({
    week_number: '', date: '', area: '', work_content: '', collaborators: '',
    sim_target: 0, vas_target: 0, fiber_target: 0, mytv_target: 0, mesh_camera_target: 0,
    cntt_target: 0, revenue_cntt_target: 0, other_services_target: 0,
    time_schedule: '8h - 17h', implementation_method: 'Cá nhân'
  });

  // --- HELPER FUNCTIONS FOR DATE/WEEK ---
  const getISOWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    if (date.getMonth() === 11 && weekNo === 1) return 53;
    return weekNo;
  };

  const getDatesOfWeek = (weekNumber: number, year: number) => {
    const d = new Date(year, 0, 4);
    const dayNum = d.getDay() || 7;
    const week1Start = new Date(d);
    week1Start.setDate(d.getDate() - dayNum + 1);
    const targetMonday = new Date(week1Start);
    targetMonday.setDate(week1Start.getDate() + (weekNumber - 1) * 7);
    const dates = [];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(targetMonday);
      currentDate.setDate(targetMonday.getDate() + i);
      const yearStr = currentDate.getFullYear();
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      dates.push({ value: dateStr, label: `${dateStr} (${dayNames[i]})` });
    }
    return dates;
  };

  const currentYear = new Date().getFullYear();
  const currentWeek = getISOWeek(new Date());

  const weekOptions = useMemo(() => {
    const options = [];
    const startWeek = currentWeek > 53 ? 1 : currentWeek;
    for (let i = startWeek; i <= 53; i++) options.push(`Tuần ${i}`);
    return options;
  }, [currentWeek]);

  const dateOptions = useMemo(() => {
    if (!formData.week_number) return [];
    const weekNum = parseInt(formData.week_number.replace('Tuần ', ''));
    if (isNaN(weekNum)) return [];
    return getDatesOfWeek(weekNum, currentYear);
  }, [formData.week_number, currentYear]);

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWeek = e.target.value;
    const weekNum = parseInt(newWeek.replace('Tuần ', ''));
    const dates = getDatesOfWeek(weekNum, currentYear);
    setFormData({ ...formData, week_number: newWeek, date: dates[0]?.value || '' });
  };

  // --- DATA FILTERING ---
  const myPlans = plans
    .filter(p => p.employee_id === currentUser.employee_id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const existingDates = myPlans.map(p => p.date);
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = (currentDay + 6) % 7;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - distanceToMonday);
  mondayDate.setHours(0, 0, 0, 0);

  const activePlans = myPlans.filter(p => new Date(p.date) >= mondayDate);
  const archivedPlans = myPlans.filter(p => new Date(p.date) < mondayDate);

  // --- ADJUSTMENT LOGIC ---
  const openAdjustmentModal = (plan: Plan) => {
    setAdjustingPlan(plan);
    setAdjustmentForm({
      sim_target: plan.sim_target,
      vas_target: plan.vas_target,
      fiber_target: plan.fiber_target,
      mytv_target: plan.mytv_target,
      mesh_camera_target: plan.mesh_camera_target,
      cntt_target: plan.cntt_target,
      revenue_cntt_target: plan.revenue_cntt_target,
      other_services_target: plan.other_services_target || 0,
      adjustment_reason: ''
    });
  };

  const submitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingPlan || !onUpdatePlan) return;
    if (!adjustmentForm.adjustment_reason.trim()) {
      alert("Vui lòng nhập lý do điều chỉnh");
      return;
    }

    // Extract only target data to save
    const { adjustment_reason, ...targets } = adjustmentForm;

    const updatedPlan: Plan = {
      ...adjustingPlan,
      adjustment_status: 'pending',
      adjustment_reason: adjustmentForm.adjustment_reason,
      adjustment_data: JSON.stringify(targets)
    };

    onUpdatePlan(updatedPlan);
    setAdjustingPlan(null);
    alert("Đã gửi yêu cầu điều chỉnh. Vui lòng chờ lãnh đạo phê duyệt.");
  };

  // --- EXCEL DOWNLOAD & UPLOAD (Existing Logic) ---
  const handleDownloadTemplate = () => {
    const headers = [['Tuần', 'Ngày (YYYY-MM-DD)', 'Địa bàn', 'Nội dung', 'Người phối hợp', 'SIM', 'VAS', 'Fiber', 'MyTV', 'Mesh/Cam', 'DV CNTT', 'DT CNTT', 'DV Khác', 'Thời gian', 'Phương thức']];
    const sample = [['Tuần 1', new Date().toISOString().split('T')[0], 'Xã Yên Thuận', 'Bán hàng lưu động', '', 5, 2, 1, 1, 1, 0, 0, 0, '8h-17h', 'Cá nhân']];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Ke_Hoach");
    XLSX.writeFile(wb, "VNPT_Mau_Ke_Hoach_Day_Du.xlsx");
  };

  const parseExcelDate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[\/-]/);
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(1) as any[];
        
        let added = 0;
        let errors = 0;
        const tempDates = [...existingDates];

        data.forEach(row => {
          const rawDate = row[1];
          const dateStr = parseExcelDate(rawDate);
          if (!dateStr || tempDates.includes(dateStr)) {
            errors++;
            return;
          }
          onAddPlan({
            week_number: row[0]?.toString() || 'Tuần 1',
            date: dateStr,
            area: row[2]?.toString() || '',
            work_content: row[3]?.toString() || '',
            collaborators: row[4]?.toString() || '',
            sim_target: parseInt(row[5]) || 0,
            vas_target: parseInt(row[6]) || 0,
            fiber_target: parseInt(row[7]) || 0,
            mytv_target: parseInt(row[8]) || 0,
            mesh_camera_target: parseInt(row[9]) || 0,
            cntt_target: parseInt(row[10]) || 0,
            revenue_cntt_target: parseInt(row[11]) || 0,
            other_services_target: parseInt(row[12]) || 0,
            time_schedule: row[13]?.toString() || '8h-17h',
            implementation_method: row[14]?.toString() || 'Cá nhân',
            employee_id: currentUser.employee_id,
            employee_name: currentUser.employee_name,
            position: currentUser.position,
            management_area: currentUser.management_area,
            sim_result: 0, vas_result: 0, fiber_result: 0, mytv_result: 0,
            mesh_camera_result: 0, cntt_result: 0, revenue_cntt_result: 0, other_services_result: 0,
            customers_contacted: 0, contracts_signed: 0, challenges: '', notes: '',
            status: 'pending', submitted_at: new Date().toISOString()
          });
          tempDates.push(dateStr);
          added++;
        });
        alert(`Hoàn tất nhập dữ liệu: Thêm mới ${added}, Bỏ qua ${errors} (trùng ngày hoặc lỗi ngày).`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Lỗi: Kiểm tra lại định dạng file Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingDates.includes(formData.date)) {
      alert(`Ngày ${formData.date} đã được lập kế hoạch. Vui lòng chọn ngày khác.`);
      return;
    }
    onAddPlan({
      ...formData,
      employee_id: currentUser.employee_id,
      employee_name: currentUser.employee_name,
      position: currentUser.position,
      management_area: currentUser.management_area,
      sim_result: 0, vas_result: 0, fiber_result: 0, mytv_result: 0,
      mesh_camera_result: 0, cntt_result: 0, revenue_cntt_result: 0, other_services_result: 0,
      customers_contacted: 0, contracts_signed: 0, challenges: '', notes: '',
      status: 'pending', submitted_at: new Date().toISOString()
    });
    setFormData({ 
      ...formData, date: '', work_content: '', area: '', collaborators: '',
      sim_target: 0, vas_target: 0, fiber_target: 0, mytv_target: 0, 
      mesh_camera_target: 0, cntt_target: 0, revenue_cntt_target: 0, other_services_target: 0
    });
    alert("Kế hoạch đã được gửi đi.");
  };

  const inputLightStyle = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-800 placeholder-slate-400 font-bold text-base";
  const labelStyle = "text-sm font-bold text-slate-600 uppercase tracking-wide ml-1 mb-1 block";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* FORM LẬP KẾ HOẠCH */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 sticky top-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <PlusCircle size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Lập Kế Hoạch Tuần</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Xác định mục tiêu kinh doanh</p>
            </div>
          </div>

          <div className="flex gap-2 mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-100">
             <button onClick={handleDownloadTemplate} className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 py-3 rounded-xl text-sm font-black hover:text-blue-700 transition border border-slate-200 shadow-sm uppercase tracking-tight">
               <Download size={16} /> Tải Mẫu
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-black hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 uppercase tracking-tight">
               <Upload size={16} /> Nhập Excel
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyle}>Tuần báo cáo (Hiện tại: Tuần {currentWeek})</label>
                <select required className={inputLightStyle} value={formData.week_number} onChange={handleWeekChange}>
                  <option value="">Chọn tuần</option>
                  {weekOptions.map(week => (
                    <option key={week} value={week}>{week}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Ngày triển khai</label>
                <select 
                  required 
                  className={inputLightStyle} 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  disabled={!formData.week_number}
                >
                  <option value="">{formData.week_number ? '-- Chọn ngày --' : '-- Chọn tuần trước --'}</option>
                  {dateOptions.map(opt => (
                    <option key={opt.value} value={opt.value} disabled={existingDates.includes(opt.value)}>
                      {opt.label} {existingDates.includes(opt.value) ? '(Đã lập)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className={labelStyle}>Địa bàn & Người phối hợp</label>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Địa bàn công tác" className={inputLightStyle} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                  <input type="text" placeholder="Phối hợp với ai?" className={inputLightStyle} value={formData.collaborators} onChange={e => setFormData({...formData, collaborators: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Nội dung công việc</label>
                <textarea required rows={3} placeholder="Mô tả chi tiết công việc dự kiến..." className={`${inputLightStyle} resize-none`} value={formData.work_content} onChange={e => setFormData({...formData, work_content: e.target.value})} />
              </div>
            </div>

            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
               <h4 className="text-base font-black text-blue-700 uppercase mb-5 flex items-center gap-2 tracking-tight">
                 <Plus size={18} /> Đăng ký chỉ tiêu kết quả
               </h4>
               <div className="space-y-6">
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-200 pb-1">Dịch vụ viễn thông</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">SIM</label><input type="number" className={inputLightStyle} value={formData.sim_target} onChange={e => setFormData({...formData, sim_target: parseInt(e.target.value)||0})} /></div>
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">FIBER</label><input type="number" className={inputLightStyle} value={formData.fiber_target} onChange={e => setFormData({...formData, fiber_target: parseInt(e.target.value)||0})} /></div>
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">MyTV</label><input type="number" className={inputLightStyle} value={formData.mytv_target} onChange={e => setFormData({...formData, mytv_target: parseInt(e.target.value)||0})} /></div>
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">VAS</label><input type="number" className={inputLightStyle} value={formData.vas_target} onChange={e => setFormData({...formData, vas_target: parseInt(e.target.value)||0})} /></div>
                   </div>
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-200 pb-1">Dịch vụ số & CNTT</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">MESH+CAM</label><input type="number" className={inputLightStyle} value={formData.mesh_camera_target} onChange={e => setFormData({...formData, mesh_camera_target: parseInt(e.target.value)||0})} /></div>
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">DV CNTT</label><input type="number" className={inputLightStyle} value={formData.cntt_target} onChange={e => setFormData({...formData, cntt_target: parseInt(e.target.value)||0})} /></div>
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">DT CNTT (đ)</label><input type="number" className={inputLightStyle} value={formData.revenue_cntt_target} onChange={e => setFormData({...formData, revenue_cntt_target: parseInt(e.target.value)||0})} /></div>
                      <div><label className="text-xs text-slate-600 font-bold mb-1.5 block">DV KHÁC</label><input type="number" className={inputLightStyle} value={formData.other_services_target} onChange={e => setFormData({...formData, other_services_target: parseInt(e.target.value)||0})} /></div>
                   </div>
                 </div>
               </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition transform active:scale-[0.98]">
              Gửi Kế Hoạch Tuần
            </button>
          </form>
        </div>
      </div>

      {/* DANH SÁCH KẾ HOẠCH ĐÃ LẬP */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Lịch Sử Kế Hoạch ({myPlans.length})</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePlans.length === 0 ? (
            <div className="col-span-2 py-10 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
               <CalendarOff size={40} className="mb-2 opacity-20" />
               <p className="font-bold text-sm">Chưa có kế hoạch tuần này.</p>
            </div>
          ) : (
            activePlans.map(plan => <PlanCard key={plan.id} plan={plan} onAdjustRequest={openAdjustmentModal} />)
          )}
        </div>

        {archivedPlans.length > 0 && (
          <div className="pt-6">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-sm transition-all"
            >
              {showHistory ? <ChevronUp size={16} /> : <History size={16} />}
              {showHistory ? 'Thu gọn lịch sử' : `Xem lại các tuần trước (${archivedPlans.length})`}
              {!showHistory && <ChevronDown size={16} />}
            </button>

            {showHistory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in fade-in slide-in-from-top-4">
                {archivedPlans.map(plan => <PlanCard key={plan.id} plan={plan} onAdjustRequest={openAdjustmentModal} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL ĐIỀU CHỈNH KẾ HOẠCH */}
      {adjustingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-amber-500 px-6 py-4 flex justify-between items-center text-white">
                 <h3 className="text-lg font-bold flex items-center gap-2">
                   <Edit3 size={20} /> Xin Điều Chỉnh Kế Hoạch
                 </h3>
                 <button onClick={() => setAdjustingPlan(null)} className="hover:bg-white/20 p-1 rounded-full transition"><XCircle size={24}/></button>
              </div>
              
              <form onSubmit={submitAdjustment} className="p-6 max-h-[80vh] overflow-y-auto">
                 <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 text-amber-800 text-sm">
                    <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                    <p>Bạn đang yêu cầu điều chỉnh chỉ tiêu cho kế hoạch ngày <strong>{new Date(adjustingPlan.date).toLocaleDateString('vi-VN')}</strong>. Yêu cầu này cần được lãnh đạo phê duyệt.</p>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">SIM</label><input type="number" className={inputLightStyle} value={adjustmentForm.sim_target} onChange={e => setAdjustmentForm({...adjustmentForm, sim_target: parseInt(e.target.value)||0})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Fiber</label><input type="number" className={inputLightStyle} value={adjustmentForm.fiber_target} onChange={e => setAdjustmentForm({...adjustmentForm, fiber_target: parseInt(e.target.value)||0})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">MyTV</label><input type="number" className={inputLightStyle} value={adjustmentForm.mytv_target} onChange={e => setAdjustmentForm({...adjustmentForm, mytv_target: parseInt(e.target.value)||0})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Mesh/Cam</label><input type="number" className={inputLightStyle} value={adjustmentForm.mesh_camera_target} onChange={e => setAdjustmentForm({...adjustmentForm, mesh_camera_target: parseInt(e.target.value)||0})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">CNTT</label><input type="number" className={inputLightStyle} value={adjustmentForm.cntt_target} onChange={e => setAdjustmentForm({...adjustmentForm, cntt_target: parseInt(e.target.value)||0})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Doanh thu</label><input type="number" className={inputLightStyle} value={adjustmentForm.revenue_cntt_target} onChange={e => setAdjustmentForm({...adjustmentForm, revenue_cntt_target: parseInt(e.target.value)||0})} /></div>
                 </div>

                 <div className="mb-6">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Lý do điều chỉnh <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      className={`${inputLightStyle} h-24 resize-none`}
                      placeholder="VD: Khách hàng hẹn lại sang tuần sau, phát sinh công việc đột xuất..."
                      value={adjustmentForm.adjustment_reason}
                      onChange={e => setAdjustmentForm({...adjustmentForm, adjustment_reason: e.target.value})}
                    />
                 </div>

                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setAdjustingPlan(null)} className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition">Hủy bỏ</button>
                    <button type="submit" className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 flex items-center gap-2">
                       <Save size={18} /> Gửi yêu cầu
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};