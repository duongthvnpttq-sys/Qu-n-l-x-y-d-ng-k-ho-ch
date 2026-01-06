import React, { useState } from 'react';
import { User, Plan } from '../types';
import * as XLSX from 'xlsx';
import { Filter, FileSpreadsheet, FileCheck, AlertCircle, RefreshCw, Search, MessageSquare, Award, Target, CheckCircle2 } from 'lucide-react';

interface SummaryExportProps {
  users: User[];
  plans: Plan[];
}

export const SummaryExport: React.FC<SummaryExportProps> = ({ users, plans }) => {
  const [filters, setFilters] = useState({
    week: '',
    date: '',
    employee_id: '',
    status: ''
  });

  const weeks = Array.from({length: 53}, (_, i) => `Tuần ${i + 1}`);

  const filteredPlans = plans.filter(p => {
    if (filters.week && p.week_number !== filters.week) return false;
    if (filters.date && p.date !== filters.date) return false;
    if (filters.employee_id && p.employee_id !== filters.employee_id) return false;
    if (filters.status && p.status !== filters.status) return false;
    return true;
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      case 'approved': return 'Đã duyệt';
      default: return status;
    }
  };

  const generateFileName = (prefix: string) => {
    let suffix = filters.date || filters.week.replace(' ', '') || new Date().toISOString().slice(0, 10);
    return `${prefix}_${suffix}`;
  };

  const exportExcel = () => {
    try {
      const title = [['BÁO CÁO TỔNG HỢP KẾT QUẢ KINH DOANH VNPT - CHI TIẾT ĐÁNH GIÁ']];
      const info = [[`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} | Số lượng: ${filteredPlans.length} bản ghi`]];
      const headers = [[
        'STT', 'Tuần', 'Ngày', 'Nhân viên', 'Địa bàn', 'Phối hợp', 'Nội dung',
        'CT SIM', 'KQ SIM', 'CT Fiber', 'KQ Fiber', 'CT MyTV', 'KQ MyTV',
        'CT M/C', 'KQ M/C', 'CT CNTT', 'KQ CNTT', 'CT DT CNTT', 'KQ DT CNTT',
        'KH Tiếp cận', 'HĐ Ký', 'Trạng thái', 'Điểm Cộng', 'Điểm Trừ', 'Nhận Xét Quản Lý'
      ]];

      const data = filteredPlans.map((p, idx) => [
        idx + 1, p.week_number, p.date, p.employee_name, p.area, p.collaborators || '', p.work_content,
        p.sim_target, p.sim_result, p.fiber_target, p.fiber_result, p.mytv_target, p.mytv_result,
        p.mesh_camera_target, p.mesh_camera_result, p.cntt_target, p.cntt_result, p.revenue_cntt_target, p.revenue_cntt_result,
        p.customers_contacted, p.contracts_signed, getStatusText(p.status), 
        p.bonus_score || 0, p.penalty_score || 0, p.manager_comment || ''
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([...title, ...info, [], ...headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, "TongHop");
      XLSX.writeFile(wb, `${generateFileName('Bao_Cao_Hieu_Qua_Chi_Tiet')}.xlsx`);
    } catch (error) {
      alert("Lỗi xuất file Excel");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Search size={22} className="text-blue-600" />
            Tra Cứu & Xuất Báo Cáo
          </h2>
          <button 
            onClick={() => setFilters({ week: '', date: '', employee_id: '', status: '' })}
            className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition"
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tuần</label>
              <select className="w-full border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none border transition" value={filters.week} onChange={e => setFilters({...filters, week: e.target.value})}>
                <option value="">Tất cả</option>
                {weeks.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
           </div>
           <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ngày</label>
              <input type="date" className="w-full border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none border transition" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
           </div>
           <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nhân viên</label>
              <select className="w-full border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none border transition" value={filters.employee_id} onChange={e => setFilters({...filters, employee_id: e.target.value})}>
                <option value="">Tất cả</option>
                {users.map(u => <option key={u.id} value={u.employee_id}>{u.employee_name}</option>)}
              </select>
           </div>
           <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Trạng thái</label>
              <select className="w-full border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none border transition" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="completed">Hoàn thành</option>
                <option value="rejected">Từ chối</option>
              </select>
           </div>
        </div>

        <div className="flex flex-wrap gap-3">
           <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition font-bold shadow-md">
             <FileSpreadsheet size={18} /> Xuất Excel Chi Tiết Đánh Giá
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Danh Sách Kết Quả ({filteredPlans.length})</h3>
          
          <div className="flex items-center gap-4 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
             <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
               <span className="text-gray-600">Kế hoạch (KH)</span>
             </div>
             <div className="w-[1px] h-3 bg-gray-300"></div>
             <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
               <span className="text-gray-600">Thực hiện (TH)</span>
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-100 border-b">
               <tr>
                 <th className="px-4 py-4 font-bold text-gray-600 w-[120px]">Thời gian</th>
                 <th className="px-4 py-4 font-bold text-gray-600 w-[180px]">Nhân Viên</th>
                 <th className="px-4 py-4 font-bold text-gray-600 min-w-[300px]">Chi Tiết Chỉ Tiêu (KH) vs Thực Hiện (TH)</th>
                 <th className="px-4 py-4 font-bold text-gray-600 text-center w-[140px]">Trạng Thái</th>
                 <th className="px-4 py-4 font-bold text-gray-600 w-[200px]">Nhận Xét / Ghi Chú</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filteredPlans.length === 0 ? (
                 <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-400">Không tìm thấy dữ liệu phù hợp.</td></tr>
               ) : (
                 filteredPlans.map(p => (
                   <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                     <td className="px-4 py-4 align-top">
                        <div className="font-bold text-gray-800">{p.week_number}</div>
                        <div className="text-xs text-gray-500 font-medium">{new Date(p.date).toLocaleDateString('vi-VN')}</div>
                     </td>
                     <td className="px-4 py-4 align-top">
                        <div className="font-bold text-gray-900">{p.employee_name}</div>
                        <div className="text-xs text-gray-500 mb-1">{p.position}</div>
                        <div className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded w-fit">{p.area}</div>
                     </td>
                     <td className="px-4 py-4">
                        {/* Comparison Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                           {[
                             { label: 'SIM', target: p.sim_target, result: p.sim_result },
                             { label: 'Fiber', target: p.fiber_target, result: p.fiber_result },
                             { label: 'MyTV', target: p.mytv_target, result: p.mytv_result },
                             { label: 'Mesh/Cam', target: p.mesh_camera_target, result: p.mesh_camera_result },
                             { label: 'CNTT', target: p.cntt_target, result: p.cntt_result },
                             { label: 'DT CNTT', target: p.revenue_cntt_target, result: p.revenue_cntt_result, isMoney: true },
                           ].map((item, i) => (
                             <div key={i} className="flex items-center justify-between border-b border-dashed border-gray-100 pb-1">
                                <span className="text-xs font-semibold text-gray-500">{item.label}</span>
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                   <span className="text-orange-600" title="Kế hoạch">
                                     {item.isMoney ? (item.target / 1000000).toFixed(1) : item.target}
                                     {item.isMoney && <span className="text-[8px] font-normal"> Tr</span>}
                                   </span>
                                   <span className="text-gray-300 font-light">/</span>
                                   <span className="text-blue-600" title="Thực hiện">
                                     {item.isMoney ? (item.result / 1000000).toFixed(1) : item.result}
                                     {item.isMoney && <span className="text-[8px] font-normal"> Tr</span>}
                                   </span>
                                </div>
                             </div>
                           ))}
                        </div>
                     </td>
                     <td className="px-4 py-4 align-top text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            p.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            p.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            p.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {getStatusText(p.status)}
                          </span>

                          {p.rating === 'rated' && (
                             <div className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold text-purple-700 border border-purple-100">
                               <Award size={12} /> Đã đánh giá
                             </div>
                          )}
                          
                          {(p.bonus_score !== 0 || p.penalty_score !== 0) && (
                            <div className="flex gap-1 text-[10px] font-black">
                               {p.bonus_score ? <span className="text-emerald-600">+{p.bonus_score}</span> : null}
                               {p.penalty_score ? <span className="text-rose-600">-{p.penalty_score}</span> : null}
                            </div>
                          )}
                        </div>
                     </td>
                     <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                           {p.manager_comment ? (
                             <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 italic border border-slate-100 relative">
                               <MessageSquare size={10} className="absolute top-2 left-2 text-slate-300" />
                               <span className="pl-4 block">{p.manager_comment}</span>
                             </div>
                           ) : (
                             <span className="text-xs text-gray-300 italic block mt-1">Chưa có nhận xét</span>
                           )}
                           
                           {p.challenges && (
                             <div className="text-[10px] text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                               <span className="font-bold">Khó khăn:</span> {p.challenges}
                             </div>
                           )}
                        </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};