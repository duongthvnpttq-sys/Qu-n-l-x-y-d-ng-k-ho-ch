import React, { useState, useMemo } from 'react';
import { User, Plan } from '../types';
import * as XLSX from 'xlsx';
import { Filter, FileSpreadsheet, RefreshCw, Search, MessageSquare, Award, ArrowDownWideNarrow, CalendarDays } from 'lucide-react';

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

  // 1. FILTER & SORT LOGIC
  // Sắp xếp theo: Ngày (Tăng dần) -> Tên nhân viên (A-Z)
  const processedPlans = useMemo(() => {
    const filtered = plans.filter(p => {
      if (filters.week && p.week_number !== filters.week) return false;
      if (filters.date && p.date !== filters.date) return false;
      if (filters.employee_id && p.employee_id !== filters.employee_id) return false;
      if (filters.status && p.status !== filters.status) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      // Sort by Date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // Then sort by Employee Name
      return a.employee_name.localeCompare(b.employee_name);
    });
  }, [plans, filters]);

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
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // 1. Header Report (Administrative style)
      const headerRows = [
        ['VNPT TUYÊN QUANG', '', '', '', '', '', '', '', '', '', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
        ['TRUNG TÂM VIỄN THÔNG HÀM YÊN', '', '', '', '', '', '', '', '', '', '', '', '', 'Độc lập - Tự do - Hạnh phúc'],
        ['Số: ...../BC-KHKD', '', '', '', '', '', '', '', '', '', '', '', '', '________________________'],
        [], 
        ['BÁO CÁO TỔNG HỢP KẾT QUẢ KINH DOANH CHI TIẾT'],
        [`Thời gian xuất: ${day}/${month}/${year} - Phạm vi: ${filters.week || 'Toàn bộ'} - ${filters.date || 'Tất cả các ngày'}`],
        [], 
      ];

      // 2. Table Headers - Rút gọn tên cột để vừa A4
      const tableHeaders = [[
        'STT', 'Ngày', 'Nhân viên', 'Địa bàn', 'Nội dung',
        'SIM', '', 'Fiber', '', 'MyTV', '', 'Mesh/Cam', '',
        'CNTT', '', 'Tiền CNTT', '', 'DV Khác', '',
        'Tiếp cận', 'HĐ', 'Trạng thái', 'Điểm', 'Nhận Xét'
      ]];

      // Sub-header for Target/Actual
      const subHeaders = [[
        '', '', '', '', '',
        'KH', 'TH', 'KH', 'TH', 'KH', 'TH', 'KH', 'TH',
        'KH', 'TH', 'KH', 'TH', 'KH', 'TH',
        '', '', '', '+/-', ''
      ]];

      // 3. Table Data
      const tableData = processedPlans.map((p, idx) => [
        idx + 1, 
        p.date, // Format YYYY-MM-DD is clearer for sorting in Excel
        p.employee_name,
        p.area, 
        p.work_content,
        p.sim_target, p.sim_result, 
        p.fiber_target, p.fiber_result, 
        p.mytv_target, p.mytv_result,
        p.mesh_camera_target, p.mesh_camera_result, 
        p.cntt_target, p.cntt_result, 
        p.revenue_cntt_target, p.revenue_cntt_result,
        p.other_services_target || 0, p.other_services_result || 0,
        p.customers_contacted, p.contracts_signed, 
        getStatusText(p.status), 
        (p.bonus_score || 0) - (p.penalty_score || 0), 
        p.manager_comment || ''
      ]);

      // 4. Footer Signatures
      const footerRows = [
        [],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `Ngày ${day} tháng ${month} năm ${year}`],
        ['NGƯỜI LẬP BIỂU', '', '', '', '', '', '', '', '', '', '', 'LÃNH ĐẠO ĐƠN VỊ'],
        ['(Ký, ghi rõ họ tên)', '', '', '', '', '', '', '', '', '', '', '(Ký, đóng dấu)'],
        [], [], [], []
      ];

      const wsData = [...headerRows, ...tableHeaders, ...subHeaders, ...tableData, ...footerRows];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // --- OPTIMIZATION FOR A4 LANDSCAPE ---
      // Thu nhỏ độ rộng các cột số liệu để tiết kiệm không gian
      ws['!cols'] = [
        { wch: 4 },  // STT
        { wch: 11 }, // Ngày
        { wch: 18 }, // Tên NV
        { wch: 12 }, // Địa bàn
        { wch: 25 }, // Nội dung (cho phép wrap text)
        { wch: 4 }, { wch: 4 }, // SIM
        { wch: 4 }, { wch: 4 }, // Fiber
        { wch: 4 }, { wch: 4 }, // MyTV
        { wch: 4 }, { wch: 4 }, // Mesh
        { wch: 4 }, { wch: 4 }, // CNTT
        { wch: 9 }, { wch: 9 }, // Tiền CNTT
        { wch: 4 }, { wch: 4 }, // Khác
        { wch: 5 }, // TC
        { wch: 4 }, // HĐ
        { wch: 10 }, // Trạng thái
        { wch: 5 }, // Điểm
        { wch: 15 }  // Nhận xét
      ];

      // Merge headers Title
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // VNPT Tuyên Quang
        { s: { r: 0, c: 13 }, e: { r: 0, c: 23 } }, // Quốc hiệu
        { s: { r: 1, c: 13 }, e: { r: 1, c: 23 } }, // Tiêu ngữ
        { s: { r: 4, c: 0 }, e: { r: 4, c: 23 } }, // Tên báo cáo (Center)
        { s: { r: 5, c: 0 }, e: { r: 5, c: 23 } }, // Thời gian
        // Merge header groups (KH/TH)
        { s: { r: 7, c: 5 }, e: { r: 7, c: 6 } }, // SIM header
        { s: { r: 7, c: 7 }, e: { r: 7, c: 8 } }, // Fiber header
        { s: { r: 7, c: 9 }, e: { r: 7, c: 10 } }, // MyTV header
        { s: { r: 7, c: 11 }, e: { r: 7, c: 12 } }, // Mesh header
        { s: { r: 7, c: 13 }, e: { r: 7, c: 14 } }, // CNTT header
        { s: { r: 7, c: 15 }, e: { r: 7, c: 16 } }, // Tiền CNTT header
        { s: { r: 7, c: 17 }, e: { r: 7, c: 18 } }, // Khác header
      ];

      XLSX.utils.book_append_sheet(wb, ws, "BaoCao");
      XLSX.writeFile(wb, `${generateFileName('Bao_Cao_A4')}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("Lỗi xuất file Excel");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* FILTER SECTION */}
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
           <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition font-bold shadow-md shadow-emerald-500/20">
             <FileSpreadsheet size={18} /> Xuất Báo Cáo (A4 Ngang)
           </button>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
             <h3 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Danh Sách Kết Quả ({processedPlans.length})</h3>
             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                <ArrowDownWideNarrow size={12} />
                Sắp xếp: Ngày &rarr; Tên NV
             </span>
          </div>
          
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
                 <th className="px-3 py-3 font-bold text-gray-600 w-[110px]">Ngày</th>
                 <th className="px-3 py-3 font-bold text-gray-600 w-[160px]">Nhân Viên</th>
                 <th className="px-3 py-3 font-bold text-gray-600 min-w-[350px]">Chi Tiết Kết Quả KD (KH vs TH)</th>
                 <th className="px-3 py-3 font-bold text-gray-600 text-center w-[120px]">Trạng Thái</th>
                 <th className="px-3 py-3 font-bold text-gray-600 w-[180px]">Nhận Xét / Ghi Chú</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {processedPlans.length === 0 ? (
                 <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-400">Không tìm thấy dữ liệu phù hợp.</td></tr>
               ) : (
                 processedPlans.map((p, idx) => {
                   // Logic group by date visuals: Check if prev date is same
                   const isNewDate = idx === 0 || processedPlans[idx-1].date !== p.date;

                   return (
                   <React.Fragment key={p.id}>
                     {isNewDate && idx > 0 && <tr className="bg-slate-50 border-t border-b border-slate-200 h-2"></tr>}
                     <tr className={`hover:bg-blue-50/30 transition-colors ${isNewDate ? 'bg-white' : ''}`}>
                       <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-2 mb-1">
                             <CalendarDays size={14} className="text-blue-500" />
                             <span className="font-bold text-gray-800 text-xs">{new Date(p.date).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium pl-6">{p.week_number}</div>
                       </td>
                       <td className="px-3 py-3 align-top">
                          <div className="font-bold text-gray-900 text-sm">{p.employee_name}</div>
                          <div className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1 border border-gray-200 inline-block">{p.area}</div>
                          {p.collaborators && <div className="text-[10px] text-blue-600 italic mt-1">Phối hợp: {p.collaborators}</div>}
                       </td>
                       <td className="px-3 py-3">
                          {/* Improved Comparison Grid - More Distinct */}
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                             {[
                               { label: 'SIM', target: p.sim_target, result: p.sim_result },
                               { label: 'Fiber', target: p.fiber_target, result: p.fiber_result },
                               { label: 'MyTV', target: p.mytv_target, result: p.mytv_result },
                               { label: 'Mesh/Cam', target: p.mesh_camera_target, result: p.mesh_camera_result },
                               { label: 'CNTT', target: p.cntt_target, result: p.cntt_result },
                               { label: 'DT CNTT', target: p.revenue_cntt_target, result: p.revenue_cntt_result, isMoney: true },
                             ].map((item, i) => (
                               <div key={i} className="bg-gray-50/80 rounded border border-gray-100 p-1.5 flex flex-col items-center">
                                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{item.label}</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                     <span className="text-xs font-black text-orange-600">
                                       {item.isMoney ? (item.target/1000000).toFixed(1) : item.target}
                                     </span>
                                     <span className="text-[10px] text-gray-300">/</span>
                                     <span className="text-xs font-black text-blue-600">
                                       {item.isMoney ? (item.result/1000000).toFixed(1) : item.result}
                                     </span>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </td>
                       <td className="px-3 py-3 align-top text-center">
                          <div className="flex flex-col items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border w-full ${
                              p.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                              p.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              p.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {getStatusText(p.status)}
                            </span>

                            {p.rating === 'rated' && (
                               <span className="flex items-center gap-1 text-[9px] font-bold text-purple-600">
                                 <Award size={10} /> Đã chấm điểm
                               </span>
                            )}
                            
                            {(p.bonus_score !== 0 || p.penalty_score !== 0) && (
                              <div className="flex gap-1 text-[10px] font-black border-t border-dashed border-gray-200 pt-1 mt-1 w-full justify-center">
                                 {p.bonus_score ? <span className="text-emerald-600">+{p.bonus_score}</span> : null}
                                 {p.penalty_score ? <span className="text-rose-600">-{p.penalty_score}</span> : null}
                              </div>
                            )}
                          </div>
                       </td>
                       <td className="px-3 py-3 align-top">
                          <div className="space-y-1.5 text-xs">
                             {p.work_content && (
                                <div className="text-gray-600 line-clamp-2" title={p.work_content}>
                                   <span className="font-bold text-gray-400 text-[10px] uppercase mr-1">Nội dung:</span>
                                   {p.work_content}
                                </div>
                             )}
                             {p.manager_comment && (
                               <div className="text-purple-700 bg-purple-50 p-1.5 rounded border border-purple-100 italic">
                                 <MessageSquare size={10} className="inline mr-1" />
                                 {p.manager_comment}
                               </div>
                             )}
                             {p.challenges && (
                               <div className="text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100 text-[10px]">
                                 <span className="font-bold">Khó khăn:</span> {p.challenges}
                               </div>
                             )}
                          </div>
                       </td>
                     </tr>
                   </React.Fragment>
                   );
                 })
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};