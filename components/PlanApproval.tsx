import React, { useState } from 'react';
import { User, Plan } from '../types';
import { CheckCircle, XCircle, Clock, AlertCircle, Users as UsersIcon, GitPullRequest, ArrowRight } from 'lucide-react';

interface PlanApprovalProps {
  currentUser: User;
  plans: Plan[];
  onUpdatePlan: (plan: Plan) => void;
}

export const PlanApproval: React.FC<PlanApprovalProps> = ({ currentUser, plans, onUpdatePlan }) => {
  const [rejectingPlan, setRejectingPlan] = useState<Plan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectingAdjustment, setIsRejectingAdjustment] = useState(false);

  const getTimestamp = (dateStr?: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const pendingPlans = plans
    .filter(p => p.status === 'pending')
    .sort((a, b) => getTimestamp(b.submitted_at) - getTimestamp(a.submitted_at));

  const pendingAdjustments = plans
    .filter(p => p.adjustment_status === 'pending')
    .sort((a, b) => getTimestamp(b.submitted_at) - getTimestamp(a.submitted_at));

  // --- NEW PLAN APPROVAL HANDLERS ---
  const handleApprove = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    const updatedPlan: Plan = {
      ...plan,
      status: 'approved',
      approved_by: currentUser.employee_name,
      approved_at: new Date().toISOString()
    };
    onUpdatePlan(updatedPlan);
  };

  const handleOpenRejectModal = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    setRejectingPlan(plan);
    setRejectionReason('');
    setIsRejectingAdjustment(false);
  };

  // --- ADJUSTMENT APPROVAL HANDLERS ---
  const handleApproveAdjustment = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    if (!plan.adjustment_data) return;

    try {
      const newTargets = JSON.parse(plan.adjustment_data);
      const updatedPlan: Plan = {
        ...plan,
        ...newTargets, // Merge new targets into plan
        adjustment_status: 'approved',
        adjustment_data: undefined, // Clear temp data
        approved_by: currentUser.employee_name, // Update approver
        // We might want to keep approved_at for the original plan or update it. 
        // Let's not update approved_at to keep original approval date, or add adjustment_approved_at if needed.
      };
      onUpdatePlan(updatedPlan);
      alert("Đã phê duyệt điều chỉnh kế hoạch.");
    } catch (err) {
      console.error("Error parsing adjustment data", err);
      alert("Lỗi dữ liệu điều chỉnh.");
    }
  };

  const handleOpenRejectAdjustmentModal = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    setRejectingPlan(plan);
    setRejectionReason('');
    setIsRejectingAdjustment(true);
  };

  const handleConfirmReject = () => {
    if (!rejectingPlan) return;
    if (!rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }

    if (isRejectingAdjustment) {
      // Reject Adjustment
      const updatedPlan: Plan = {
        ...rejectingPlan,
        adjustment_status: 'rejected',
        returned_reason: rejectionReason.trim(), // Reuse field or add adjustment_reject_reason
        adjustment_data: undefined 
      };
      onUpdatePlan(updatedPlan);
    } else {
      // Reject New Plan
      const updatedPlan: Plan = {
        ...rejectingPlan,
        status: 'rejected',
        returned_reason: rejectionReason.trim(),
        approved_by: currentUser.employee_name,
        approved_at: new Date().toISOString()
      };
      onUpdatePlan(updatedPlan);
    }
    
    setRejectingPlan(null);
    setRejectionReason('');
    setIsRejectingAdjustment(false);
  };

  const renderComparison = (label: string, oldVal: number, newVal: number) => {
    if (oldVal === newVal) return null;
    return (
      <div className="flex flex-col items-center bg-slate-50 p-2 rounded border border-slate-200">
        <span className="text-[10px] text-slate-500 font-bold uppercase">{label}</span>
        <div className="flex items-center gap-2 mt-1">
           <span className="text-xs text-slate-400 line-through">{oldVal}</span>
           <ArrowRight size={12} className="text-slate-300" />
           <span className="text-sm font-black text-amber-600">{newVal}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 relative">
      
      {/* SECTION 1: DUYỆT ĐIỀU CHỈNH (Priority) */}
      {pendingAdjustments.length > 0 && (
        <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100">
          <div className="flex items-center gap-2 mb-6 border-b border-amber-200 pb-4">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
               <GitPullRequest size={24} />
            </div>
            <div>
               <h2 className="text-xl font-bold text-amber-900">Yêu Cầu Điều Chỉnh Kế Hoạch</h2>
               <p className="text-sm text-amber-700/80">Có {pendingAdjustments.length} kế hoạch xin thay đổi chỉ tiêu</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingAdjustments.map(plan => {
               let newData: any = {};
               try { newData = JSON.parse(plan.adjustment_data || '{}'); } catch(e) {}
               
               return (
                <div key={plan.id} className="bg-white rounded-xl shadow-sm p-6 border border-amber-200 relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Xin điều chỉnh</div>
                   
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        {plan.employee_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{plan.employee_name}</h3>
                        <p className="text-xs text-slate-500">{plan.date} ({plan.area})</p>
                      </div>
                   </div>

                   <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 italic border border-slate-200 mb-4">
                      <span className="text-xs font-bold text-slate-400 not-italic uppercase block mb-1">Lý do:</span>
                      "{plan.adjustment_reason}"
                   </div>

                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                      {renderComparison('SIM', plan.sim_target, newData.sim_target)}
                      {renderComparison('Fiber', plan.fiber_target, newData.fiber_target)}
                      {renderComparison('MyTV', plan.mytv_target, newData.mytv_target)}
                      {renderComparison('Mesh', plan.mesh_camera_target, newData.mesh_camera_target)}
                      {renderComparison('CNTT', plan.cntt_target, newData.cntt_target)}
                      {renderComparison('D.Thu', plan.revenue_cntt_target, newData.revenue_cntt_target)}
                   </div>

                   <div className="flex gap-3">
                      <button onClick={(e) => handleApproveAdjustment(e, plan)} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm shadow-md transition-colors">
                        Chấp nhận thay đổi
                      </button>
                      <button onClick={(e) => handleOpenRejectAdjustmentModal(e, plan)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-sm transition-colors">
                        Từ chối
                      </button>
                   </div>
                </div>
               );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: DUYỆT KẾ HOẠCH MỚI */}
      <div>
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Clock className="text-blue-600" size={28} />
          <div>
            <h2 className="text-xl font-bold text-gray-800">Phê Duyệt Kế Hoạch Mới</h2>
            <p className="text-sm text-gray-500">Danh sách các kế hoạch đang chờ xử lý ({pendingPlans.length})</p>
          </div>
        </div>
        
        {pendingPlans.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-dashed border-gray-300">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
            <p className="text-lg font-medium">Tuyệt vời! Không có kế hoạch mới cần duyệt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-400 hover:shadow-lg transition-all duration-200 group">
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{plan.employee_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium border border-gray-200">{plan.position}</span>
                      <span className="text-xs text-gray-500">Gửi: {new Date(plan.submitted_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700 text-lg">{plan.week_number}</p>
                    <p className="text-sm font-medium text-gray-600">{new Date(plan.date).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                
                <div className="mb-5 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Địa bàn</span>
                    <p className="text-gray-800 font-medium">{plan.area}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nội dung công việc</span>
                    <div className="mt-1 bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-200 leading-relaxed italic">
                      {plan.work_content}
                    </div>
                  </div>
                  {plan.collaborators && (
                    <div className="flex items-center gap-2 text-sm text-blue-700 font-bold">
                      <UsersIcon size={16} /> Phối hợp: {plan.collaborators}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Chỉ tiêu đăng ký</span>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100">
                      <span className="text-[10px] text-gray-500 block">SIM</span>
                      <span className="text-sm font-bold text-blue-700">{plan.sim_target}</span>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg text-center border border-green-100">
                      <span className="text-[10px] text-gray-500 block">Fiber</span>
                      <span className="text-sm font-bold text-green-700">{plan.fiber_target}</span>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg text-center border border-purple-100">
                      <span className="text-[10px] text-gray-500 block">MyTV</span>
                      <span className="text-sm font-bold text-purple-700">{plan.mytv_target}</span>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg text-center border border-orange-100">
                      <span className="text-[10px] text-gray-500 block">Mesh/Cam</span>
                      <span className="text-sm font-bold text-orange-700">{plan.mesh_camera_target}</span>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg text-center border border-indigo-100">
                      <span className="text-[10px] text-gray-500 block">CNTT</span>
                      <span className="text-sm font-bold text-indigo-700">{plan.cntt_target}</span>
                    </div>
                    <div className="bg-indigo-100 p-2 rounded-lg text-center border border-indigo-200">
                      <span className="text-[10px] text-gray-500 block">DT CNTT</span>
                      <span className="text-[10px] font-bold text-indigo-800">{plan.revenue_cntt_target?.toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-200">
                      <span className="text-[10px] text-gray-500 block">Khác</span>
                      <span className="text-sm font-bold text-gray-700">{plan.other_services_target || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={(e) => handleApprove(e, plan)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-sm">
                    <CheckCircle size={18} /> Duyệt
                  </button>
                  <button type="button" onClick={(e) => handleOpenRejectModal(e, plan)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition font-semibold">
                    <XCircle size={18} /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
              <AlertCircle className="text-red-600" size={24} />
              <h3 className="text-lg font-bold text-red-800">
                 {isRejectingAdjustment ? 'Từ chối điều chỉnh' : 'Từ chối kế hoạch'}
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do từ chối *:</label>
              <textarea autoFocus className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none text-sm" rows={4} placeholder="VD: Không hợp lý..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
              <button onClick={() => setRejectingPlan(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Hủy</button>
              <button onClick={handleConfirmReject} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold shadow-md">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};