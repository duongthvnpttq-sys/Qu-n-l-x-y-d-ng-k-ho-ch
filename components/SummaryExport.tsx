
import React, { useState } from 'react';
import { User, Plan } from '../types';
import * as XLSX from 'xlsx';
import { Filter, FileSpreadsheet, FileCheck, AlertCircle, RefreshCw, Search, MessageSquare, Award } from 'lucide-react';

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
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Danh Sách Kết Quả ({filteredPlans.length})</h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-100 border-b">
               <tr>
                 <th className="px-4 py-4 font-bold text-gray-600">Thời gian</th>
                 <th className="px-4 py-4 font-bold text-gray-600">Nhân Viên</th>
                 <th className="px-4 py-4 font-bold text-gray-600 text-center">Đánh Giá</th>
                 <th className="px-4 py-4 font-bold text-gray-600 text-center">Trạng Thái</th>
                 <th className="px-4 py-4 font-bold text-gray-600 text-right">Sản Phẩm & Nhận Xét</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filteredPlans.length === 0 ? (
                 <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-400">Không tìm thấy dữ liệu phù hợp.</td></tr>
               ) : (
                 filteredPlans.map(p => (
                   <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                     <td className="px-4 py-4">
                        <div className="font-bold text-gray-800">{p.week_number}</div>
                        <div className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString('vi-VN')}</div>
                     </td>
                     <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{p.employee_name}</div>
                        <div className="text-xs text-gray-500">{p.position}</div>
                     </td>
                     <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                           <div className="flex items-center gap-1 text-[10px] font-black">
                              {p.bonus_score && p.bonus_score > 0 ? (
                                <span className="text-emerald-600">+{p.bonus_score}</span>
                              ) : null}
                              {p.penalty_score && p.penalty_score > 0 ? (
                                <span className="text-rose-600">-{p.penalty_score}</span>
                              ) : null}
                              {(!p.bonus_score && !p.penalty_score) && <span className="text-gray-300">-</span>}
                           </div>
                           {p.rating === 'rated' && <Award size={14} className="text-purple-500" />}
                        </div>
                     </td>
                     <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                          p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {getStatusText(p.status)}
                        </span>
                     </td>
                     <td className="px-4 py-4 text-right">
                        <div className="flex flex-col gap-1">
                          <div className="text-[11px] font-bold text-blue-600">
                             {p.sim_result} SIM | {p.fiber_result} Fib | {p.mesh_camera_result} M/C
                          </div>
                          {p.manager_comment && (
                            <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 italic">
                               <MessageSquare size={10} /> {p.manager_comment.length > 20 ? p.manager_comment.substring(0, 20) + '...' : p.manager_comment}
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
