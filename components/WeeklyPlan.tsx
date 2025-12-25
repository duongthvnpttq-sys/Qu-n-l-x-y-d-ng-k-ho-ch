
import React, { useState, useRef } from 'react';
import { User, Plan } from '../types';
import * as XLSX from 'xlsx';
import { 
  PlusCircle, Clock, CheckCircle, XCircle, 
  Download, Upload, Users as UsersIcon,
  Smartphone, Globe, Tv, Camera, Cpu, DollarSign, Plus,
  CalendarOff
} from 'lucide-react';

interface WeeklyPlanProps {
  currentUser: User;
  plans: Plan[];
  onAddPlan: (plan: Omit<Plan, 'id' | 'created_at'>) => void;
}

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ currentUser, plans, onAddPlan }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    week_number: '',
    date: '',
    area: '',
    work_content: '',
    collaborators: '',
    sim_target: 0,
    vas_target: 0,
    fiber_target: 0,
    mytv_target: 0,
    mesh_camera_target: 0,
    cntt_target: 0,
    revenue_cntt_target: 0,
    other_services_target: 0,
    time_schedule: '8h - 17h',
    implementation_method: 'Cá nhân'
  });

  const myPlans = plans
    .filter(p => p.employee_id === currentUser.employee_id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const existingDates = myPlans.map(p => p.date);

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

    // Handle Excel Serial Date (Number)
    if (typeof val === 'number') {
      // Excel serial date 1 is 1900-01-01, but JS date uses 1970.
      // 25569 is the offset days.
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // Handle String Date
    if (typeof val === 'string') {
      const trimmed = val.trim();
      // Matches YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      // Matches DD/MM/YYYY or DD-MM-YYYY
      if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[\/-]/);
        // Assuming DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      
      // Try standard parse
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
            sim_result: 0,
            vas_result: 0,
            fiber_result: 0,
            mytv_result: 0,
            mesh_camera_result: 0,
            cntt_result: 0,
            revenue_cntt_result: 0,
            other_services_result: 0,
            customers_contacted: 0,
            contracts_signed: 0,
            challenges: '',
            notes: '',
            status: 'pending',
            submitted_at: new Date().toISOString()
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
      alert("Ngày này đã được lập kế hoạch.");
      return;
    }

    onAddPlan({
      ...formData,
      employee_id: currentUser.employee_id,
      employee_name: currentUser.employee_name,
      position: currentUser.position,
      management_area: currentUser.management_area,
      sim_result: 0,
      vas_result: 0,
      fiber_result: 0,
      mytv_result: 0,
      mesh_camera_result: 0,
      cntt_result: 0,
      revenue_cntt_result: 0,
      other_services_result: 0,
      customers_contacted: 0,
      contracts_signed: 0,
      challenges: '',
      notes: '',
      status: 'pending',
      submitted_at: new Date().toISOString()
    });
    
    setFormData({ 
      ...formData, 
      date: '', 
      work_content: '', 
      area: '', 
      collaborators: '',
      sim_target: 0, 
      vas_target: 0,
      fiber_target: 0, 
      mytv_target: 0, 
      mesh_camera_target: 0, 
      cntt_target: 0, 
      revenue_cntt_target: 0,
      other_services_target: 0
    });
    alert("Kế hoạch đã được gửi đi.");
  };

  const statusConfig = {
    pending: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Clock size={12} /> },
    approved: { label: 'Đã duyệt', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle size={12} /> },
    rejected: { label: 'Từ chối', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: <XCircle size={12} /> },
    completed: { label: 'Hoàn thành', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <CheckCircle size={12} /> }
  };

  const inputLightStyle = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-800 placeholder-slate-400 font-medium text-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* FORM LẬP KẾ HOẠCH */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 sticky top-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <PlusCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Lập Kế Hoạch Tuần</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Xác định mục tiêu kinh doanh</p>
            </div>
          </div>

          <div className="flex gap-2 mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-100">
             <button onClick={handleDownloadTemplate} className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-600 py-2.5 rounded-xl text-xs font-black hover:text-blue-600 transition border border-slate-200 shadow-sm uppercase tracking-tighter">
               <Download size={14} /> Tải Mẫu
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 uppercase tracking-tighter">
               <Upload size={14} /> Nhập Excel
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tuần báo cáo</label>
                <select required className={inputLightStyle} value={formData.week_number} onChange={e => setFormData({...formData, week_number: e.target.value})}>
                  <option value="">Chọn tuần</option>
                  {Array.from({length: 52}, (_, i) => <option key={i} value={`Tuần ${i+1}`}>Tuần {i+1}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày triển khai</label>
                <input required type="date" className={inputLightStyle} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa bàn & Người phối hợp</label>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Địa bàn công tác" className={inputLightStyle} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                  <input type="text" placeholder="Phối hợp với ai?" className={inputLightStyle} value={formData.collaborators} onChange={e => setFormData({...formData, collaborators: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung công việc</label>
                <textarea required rows={3} placeholder="Mô tả chi tiết công việc dự kiến..." className={`${inputLightStyle} resize-none`} value={formData.work_content} onChange={e => setFormData({...formData, work_content: e.target.value})} />
              </div>
            </div>

            {/* PHẦN CHỈ TIÊU CHI TIẾT */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
               <h4 className="text-[10px] font-black text-blue-600 uppercase mb-5 flex items-center gap-2 tracking-widest">
                 <Plus size={14} /> Đăng ký chỉ tiêu kết quả
               </h4>
               
               <div className="space-y-6">
                 {/* Nhóm Dịch vụ lõi */}
                 <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase mb-3 border-b border-slate-200 pb-1">Dịch vụ viễn thông</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><Smartphone size={10}/> SIM</label>
                        <input type="number" className={inputLightStyle} value={formData.sim_target} onChange={e => setFormData({...formData, sim_target: parseInt(e.target.value)||0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><Globe size={10}/> FIBER</label>
                        <input type="number" className={inputLightStyle} value={formData.fiber_target} onChange={e => setFormData({...formData, fiber_target: parseInt(e.target.value)||0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><Tv size={10}/> MyTV</label>
                        <input type="number" className={inputLightStyle} value={formData.mytv_target} onChange={e => setFormData({...formData, mytv_target: parseInt(e.target.value)||0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><Smartphone size={10}/> VAS</label>
                        <input type="number" className={inputLightStyle} value={formData.vas_target} onChange={e => setFormData({...formData, vas_target: parseInt(e.target.value)||0})} />
                      </div>
                   </div>
                 </div>

                 {/* Nhóm Dịch vụ số & CNTT */}
                 <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase mb-3 border-b border-slate-200 pb-1">Dịch vụ số & CNTT</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><Camera size={10}/> MESH+CAM</label>
                        <input type="number" className={inputLightStyle} value={formData.mesh_camera_target} onChange={e => setFormData({...formData, mesh_camera_target: parseInt(e.target.value)||0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><Cpu size={10}/> DV CNTT</label>
                        <input type="number" className={inputLightStyle} value={formData.cntt_target} onChange={e => setFormData({...formData, cntt_target: parseInt(e.target.value)||0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><DollarSign size={10}/> DT CNTT (đ)</label>
                        <input type="number" className={inputLightStyle} value={formData.revenue_cntt_target} onChange={e => setFormData({...formData, revenue_cntt_target: parseInt(e.target.value)||0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mb-1"><Plus size={10}/> DV KHÁC</label>
                        <input type="number" className={inputLightStyle} value={formData.other_services_target} onChange={e => setFormData({...formData, other_services_target: parseInt(e.target.value)||0})} />
                      </div>
                   </div>
                 </div>
               </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition transform active:scale-[0.98]">
              Gửi Kế Hoạch Tuần
            </button>
          </form>
        </div>
      </div>

      {/* DANH SÁCH KẾ HOẠCH ĐÃ LẬP */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Lịch Sử Kế Hoạch ({myPlans.length})</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myPlans.length === 0 ? (
            <div className="col-span-2 py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
               <CalendarOff size={48} className="mb-4 opacity-20" />
               <p className="font-bold text-sm">Chưa có kế hoạch nào được lập.</p>
            </div>
          ) : (
            myPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100 group hover:shadow-md transition-all relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[9px] font-black uppercase border-b border-l flex items-center gap-1.5 ${statusConfig[plan.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                   {statusConfig[plan.status]?.icon}
                   {statusConfig[plan.status]?.label || plan.status}
                </div>
                
                <div className="mb-4">
                   <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{plan.week_number}</div>
                   <div className="text-lg font-black text-slate-800">{new Date(plan.date).toLocaleDateString('vi-VN')}</div>
                   <div className="text-xs font-bold text-slate-400 mt-1 uppercase">{plan.area}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 italic leading-relaxed mb-4 border border-slate-100">
                  "{plan.work_content}"
                </div>

                <div className="grid grid-cols-4 gap-2">
                   <div className="text-center bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                      <span className="text-[8px] font-black text-blue-400 block uppercase">SIM</span>
                      <span className="text-xs font-black text-blue-700">{plan.sim_target}</span>
                   </div>
                   <div className="text-center bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                      <span className="text-[8px] font-black text-emerald-400 block uppercase">Fib</span>
                      <span className="text-xs font-black text-emerald-700">{plan.fiber_target}</span>
                   </div>
                   <div className="text-center bg-purple-50/50 p-2 rounded-xl border border-purple-100/50">
                      <span className="text-[8px] font-black text-purple-400 block uppercase">MyTV</span>
                      <span className="text-xs font-black text-purple-700">{plan.mytv_target}</span>
                   </div>
                   <div className="text-center bg-amber-50/50 p-2 rounded-xl border border-amber-100/50">
                      <span className="text-[8px] font-black text-amber-400 block uppercase">M/C</span>
                      <span className="text-xs font-black text-amber-700">{plan.mesh_camera_target}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
