import React, { useState, useRef } from 'react';
import { User, Plan } from '../types';
import * as XLSX from 'xlsx';
import { PlusCircle, Clock, CheckCircle, XCircle, CalendarOff, AlertCircle, Download, Upload, FileSpreadsheet } from 'lucide-react';

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
    sim_target: 0,
    vas_target: 0,
    fiber_target: 0,
    mytv_target: 0,
    mesh_camera_target: 0,
    cntt_target: 0,
    time_schedule: '',
    implementation_method: 'Cá nhân'
  });

  const myPlans = plans
    .filter(p => p.employee_id === currentUser.employee_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Danh sách các ngày đã có kế hoạch của user này
  const existingDates = myPlans.map(p => p.date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra kỹ lại lần cuối trước khi submit
    if (existingDates.includes(formData.date)) {
      alert(`Ngày ${new Date(formData.date).toLocaleDateString('vi-VN')} đã có kế hoạch. Vui lòng kiểm tra lại.`);
      return;
    }

    onAddPlan({
      ...formData,
      employee_id: currentUser.employee_id,
      employee_name: currentUser.employee_name,
      position: currentUser.position,
      management_area: currentUser.management_area,
      // Initialize results with 0
      revenue_cntt_target: 0,
      sim_result: 0,
      vas_result: 0,
      fiber_result: 0,
      mytv_result: 0,
      mesh_camera_result: 0,
      cntt_result: 0,
      revenue_cntt_result: 0,
      customers_contacted: 0,
      contracts_signed: 0,
      challenges: '',
      notes: '',
      status: 'pending',
      submitted_at: new Date().toISOString()
    });
    alert('Đã gửi kế hoạch thành công!');
    setFormData({
      ...formData,
      date: '', // Reset date
      work_content: '',
      area: '',
      sim_target: 0,
      vas_target: 0,
      fiber_target: 0,
      mytv_target: 0,
      mesh_camera_target: 0,
      cntt_target: 0
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (existingDates.includes(selectedDate)) {
      alert(`Bạn đã lập kế hoạch cho ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} rồi. Vui lòng chọn ngày khác.`);
      setFormData({ ...formData, date: '' }); // Xóa ngày vừa chọn
      return;
    }
    setFormData({ ...formData, date: selectedDate });
  };

  // --- EXCEL HANDLERS ---

  const handleDownloadTemplate = () => {
    const headers = [
      ['Tuần', 'Ngày (YYYY-MM-DD)', 'Địa bàn', 'Nội dung công việc', 'SIM', 'VAS', 'Fiber', 'MyTV', 'Mesh/Cam', 'CNTT', 'Thời gian', 'Phương thức']
    ];
    // Dữ liệu mẫu
    const sample = [
      ['Tuần 1', '2024-01-01', 'Xã Yên Thuận', 'Đi bán hàng lưu động tại chợ', 5, 2, 1, 1, 0, 0, '8h-17h', 'Cá nhân'],
      ['Tuần 1', '2024-01-02', 'Thôn 2', 'Chăm sóc khách hàng cũ', 2, 0, 0, 0, 0, 0, '8h-12h', 'Cá nhân']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
    
    // Set column widths
    ws['!cols'] = [{wch:10}, {wch:15}, {wch:20}, {wch:30}, {wch:5}, {wch:5}, {wch:5}, {wch:5}, {wch:10}, {wch:5}, {wch:10}, {wch:10}];

    XLSX.utils.book_append_sheet(wb, ws, "Mau_Ke_Hoach");
    XLSX.writeFile(wb, "Mau_Ke_Hoach_Ban_Hang.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Remove header row
        const rows = data.slice(1) as any[];
        
        let successCount = 0;
        let failCount = 0;

        rows.forEach((row: any) => {
          // Mapping based on index (Must match Template)
          const week = row[0];
          const date = row[1]; // Should be YYYY-MM-DD
          const area = row[2];
          const content = row[3];
          
          if (!week || !date || !content) {
            return; // Skip empty rows
          }

          // Check format date roughly
          if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.warn(`Ngày không đúng định dạng YYYY-MM-DD: ${date}`);
            failCount++;
            return;
          }

          // Check duplicates inside the file upload vs existing
          if (existingDates.includes(date)) {
            console.warn(`Ngày ${date} đã tồn tại kế hoạch.`);
            failCount++;
            return;
          }

          // Add Plan
          onAddPlan({
            week_number: week.toString(),
            date: date,
            area: area || '',
            work_content: content || '',
            sim_target: parseInt(row[4]) || 0,
            vas_target: parseInt(row[5]) || 0,
            fiber_target: parseInt(row[6]) || 0,
            mytv_target: parseInt(row[7]) || 0,
            mesh_camera_target: parseInt(row[8]) || 0,
            cntt_target: parseInt(row[9]) || 0,
            time_schedule: row[10] || '',
            implementation_method: row[11] || 'Cá nhân',
            
            employee_id: currentUser.employee_id,
            employee_name: currentUser.employee_name,
            position: currentUser.position,
            management_area: currentUser.management_area,
            revenue_cntt_target: 0,
            sim_result: 0, vas_result: 0, fiber_result: 0, mytv_result: 0, mesh_camera_result: 0, cntt_result: 0, revenue_cntt_result: 0,
            customers_contacted: 0, contracts_signed: 0,
            challenges: '', notes: '', status: 'pending',
            submitted_at: new Date().toISOString()
          });
          successCount++;
          // Add to temporary local tracking to prevent duplicates within same file import
          existingDates.push(date); 
        });

        alert(`Đã nhập dữ liệu thành công!\n- Thêm mới: ${successCount} bản ghi\n- Lỗi/Trùng lặp: ${failCount} bản ghi`);
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error("Lỗi đọc file:", error);
        alert("Có lỗi xảy ra khi đọc file. Vui lòng đảm bảo đúng định dạng mẫu.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const statusConfig = {
    pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={16} /> },
    approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={16} /> },
    rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: <XCircle size={16} /> },
    completed: { label: 'Hoàn thành', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle size={16} /> }
  };

  const weeks = Array.from({length: 53}, (_, i) => `Tuần ${i + 1}`);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PlusCircle size={24} className="text-blue-600" />
            Lập Kế Hoạch Mới
          </h2>

          {/* Import/Export Tools */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 flex flex-col gap-2">
            <p className="text-xs font-semibold text-blue-800 mb-1">Công cụ hỗ trợ nhanh:</p>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleDownloadTemplate}
                className="flex-1 flex items-center justify-center gap-1 bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-50 transition"
              >
                <Download size={14} /> Tải file mẫu
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition"
              >
                <Upload size={14} /> Tải lên Excel
              </button>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-[10px] text-blue-600 italic text-center mt-1">
              *Tải file mẫu -> Điền dữ liệu -> Tải lên để nhập nhanh
            </p>
          </div>
          
          {existingDates.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
              <div className="flex items-center gap-2 font-bold mb-2 text-gray-500">
                <CalendarOff size={14} />
                Các ngày đã lập (Không thể chọn lại):
              </div>
              <div className="flex flex-wrap gap-1">
                {existingDates.slice(0, 10).map(d => (
                  <span key={d} className="bg-gray-200 px-2 py-0.5 rounded text-gray-500 line-through">
                    {new Date(d).toLocaleDateString('vi-VN').slice(0, 5)}
                  </span>
                ))}
                {existingDates.length > 10 && <span>...</span>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tuần</label>
              <select
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.week_number}
                onChange={e => setFormData({...formData, week_number: e.target.value})}
              >
                <option value="">-- Chọn tuần --</option>
                {weeks.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Thực Hiện</label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.date}
                onChange={handleDateChange}
              />
              <p className="text-[10px] text-gray-400 mt-1 italic">* Hệ thống sẽ chặn nếu chọn trùng ngày đã có kế hoạch.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa Bàn</label>
              <input
                required
                type="text"
                placeholder="Thôn/Xóm..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.area}
                onChange={e => setFormData({...formData, area: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội Dung Công Việc</label>
              <textarea
                required
                rows={3}
                placeholder="Mô tả công việc..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.work_content}
                onChange={e => setFormData({...formData, work_content: e.target.value})}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-bold text-blue-800 mb-2">Chỉ Tiêu</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: 'sim_target', l: 'SIM' }, { k: 'vas_target', l: 'VAS' },
                  { k: 'fiber_target', l: 'Fiber' }, { k: 'mytv_target', l: 'MyTV' },
                  { k: 'mesh_camera_target', l: 'Mesh/Cam' }, { k: 'cntt_target', l: 'CNTT' }
                ].map(field => (
                  <div key={field.k}>
                    <label className="block text-xs font-medium text-gray-600">{field.l}</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                      value={(formData as any)[field.k]}
                      onChange={e => setFormData({...formData, [field.k]: parseInt(e.target.value) || 0})}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời Gian</label>
                  <input
                    type="text"
                    placeholder="8h - 17h"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.time_schedule}
                    onChange={e => setFormData({...formData, time_schedule: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phương Thức</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.implementation_method}
                    onChange={e => setFormData({...formData, implementation_method: e.target.value})}
                  >
                    <option value="Cá nhân">Cá nhân</option>
                    <option value="Nhóm">Nhóm</option>
                    <option value="Hội nghị">Hội nghị</option>
                  </select>
               </div>
            </div>

            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow-md">
              Gửi Kế Hoạch
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Danh Sách Kế Hoạch Của Tôi</h2>
        {myPlans.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl text-gray-500 border border-dashed flex flex-col items-center">
            <AlertCircle className="mb-2 opacity-50" size={32} />
            <p>Chưa có kế hoạch nào được tạo.</p>
          </div>
        ) : (
          myPlans.map(plan => {
            const isCompletedOrApproved = plan.status === 'completed' || plan.status === 'approved';
            
            return (
              <div 
                key={plan.id} 
                className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition 
                  ${isCompletedOrApproved ? 'opacity-70 hover:opacity-100 bg-gray-50/50 grayscale-[30%]' : 'border-l-4 border-l-blue-500'}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isCompletedOrApproved ? 'text-gray-600' : 'text-gray-800'}`}>{plan.week_number}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">{new Date(plan.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="font-medium text-blue-700 mt-1">{plan.area}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[plan.status].color}`}>
                    {statusConfig[plan.status].icon}
                    {statusConfig[plan.status].label}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-3 bg-gray-50 p-2 rounded">{plan.work_content}</p>
                
                <div className="grid grid-cols-6 gap-2 text-center text-xs text-gray-600 bg-gray-50 p-2 rounded mb-2">
                  <div><span className="block font-bold">SIM</span>{plan.sim_target}</div>
                  <div><span className="block font-bold">VAS</span>{plan.vas_target}</div>
                  <div><span className="block font-bold">Fiber</span>{plan.fiber_target}</div>
                  <div><span className="block font-bold">MyTV</span>{plan.mytv_target}</div>
                  <div><span className="block font-bold">Cam</span>{plan.mesh_camera_target}</div>
                  <div><span className="block font-bold">CNTT</span>{plan.cntt_target}</div>
                </div>

                {plan.status === 'rejected' && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                    <strong>Lý do từ chối:</strong> {plan.returned_reason}
                  </div>
                )}
                {plan.status === 'approved' && plan.approved_by && (
                  <div className="text-xs text-green-700 mt-2 flex justify-end">
                     Duyệt bởi {plan.approved_by} lúc {new Date(plan.approved_at || '').toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};