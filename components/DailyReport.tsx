
import React, { useState } from 'react';
import { User, Plan } from '../types';

interface DailyReportProps {
  currentUser: User;
  plans: Plan[];
  onUpdatePlan: (plan: Plan) => void;
}

export const DailyReport: React.FC<DailyReportProps> = ({ currentUser, plans, onUpdatePlan }) => {
  const approvedPlans = plans.filter(p => 
    p.employee_id === currentUser.employee_id && 
    p.status === 'approved'
  );

  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  
  const [reportData, setReportData] = useState({
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
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    onUpdatePlan({
      ...selectedPlan,
      ...reportData,
      status: 'completed'
    });
    
    alert('Báo cáo đã được gửi!');
    setSelectedPlanId('');
    setReportData({
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
      notes: ''
    });
  };

  const inputLightStyle = "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-800 placeholder-slate-400 font-medium";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
          Báo Cáo Kết Quả Ngày
        </h2>
        
        <div className="mb-8">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Chọn Kế Hoạch Cần Báo Cáo</label>
          <select 
            className={inputLightStyle}
            value={selectedPlanId}
            onChange={e => setSelectedPlanId(e.target.value)}
          >
            <option value="">-- Chọn kế hoạch đã được duyệt --</option>
            {approvedPlans.map(p => (
              <option key={p.id} value={p.id}>{p.week_number} - {p.date} - {p.area}</option>
            ))}
          </select>
        </div>

        {selectedPlan && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <div className="w-20 h-20 border-8 border-blue-600 rounded-full"></div>
              </div>
              <h3 className="text-sm font-black text-blue-800 uppercase tracking-tighter mb-2">Nội dung đã đăng ký</h3>
              <p className="text-base text-slate-700 italic leading-relaxed">"{selectedPlan.work_content}"</p>
              {selectedPlan.collaborators && (
                <p className="text-xs text-blue-600 font-bold mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Phối hợp: {selectedPlan.collaborators}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
                  Kết Quả Sản Phẩm
                  <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Thực đạt</span>
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { k: 'sim_result', l: 'SIM' }, { k: 'vas_result', l: 'VAS' },
                    { k: 'fiber_result', l: 'Fiber' }, { k: 'mytv_result', l: 'MyTV' },
                    { k: 'mesh_camera_result', l: 'Mesh/Cam' }, { k: 'cntt_result', l: 'CNTT (Lượt)' },
                    { k: 'revenue_cntt_result', l: 'DT CNTT (VNĐ)' }, { k: 'other_services_result', l: 'DV Khác' }
                  ].map(field => (
                    <div key={field.k}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{field.l}</label>
                      <input
                        type="number"
                        min="0"
                        className={`${inputLightStyle} !py-2 !px-3 text-sm`}
                        value={(reportData as any)[field.k]}
                        onChange={e => setReportData({...reportData, [field.k]: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3">Kết Quả Tiếp Thị</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Số KH tiếp cận</label>
                    <input
                      type="number"
                      min="0"
                      className={inputLightStyle}
                      value={reportData.customers_contacted}
                      onChange={e => setReportData({...reportData, customers_contacted: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Số HĐ đã ký</label>
                    <input
                      type="number"
                      min="0"
                      className={inputLightStyle}
                      value={reportData.contracts_signed}
                      onChange={e => setReportData({...reportData, contracts_signed: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nội dung công việc khác, đề xuất triển khai nếu có</label>
                     <textarea
                       className={`${inputLightStyle} h-32 resize-none`}
                       value={reportData.challenges}
                       onChange={e => setReportData({...reportData, challenges: e.target.value})}
                       placeholder="Ghi lại nội dung công việc khác hoặc đề xuất..."
                     />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-8 border-t border-slate-100">
              <button type="submit" className="w-full md:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 transform active:scale-95">
                Hoàn Thành Báo Cáo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
