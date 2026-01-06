
import React, { useState, useRef } from 'react';
import { User, Plan } from '../types';
import { Star, ShieldAlert, Award, Image as ImageIcon, PlusCircle, MinusCircle, UploadCloud, FileText, Camera, Target, TrendingUp } from 'lucide-react';

interface RatingProps {
  currentUser: User;
  plans: Plan[];
  onUpdatePlan: (plan: Plan) => void;
}

export const RatingEvaluation: React.FC<RatingProps> = ({ currentUser, plans, onUpdatePlan }) => {
  const isManager = currentUser.role === 'admin' || currentUser.role === 'manager';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedPlans = plans
    .filter(p => p.status === 'completed')
    .filter(p => isManager ? true : p.employee_id === currentUser.employee_id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const [ratingData, setRatingData] = useState({
    attitude_score: 'Tốt',
    discipline_score: 'Tốt',
    effectiveness_score: 'Tốt',
    bonus_score: 0,
    penalty_score: 0,
    evidence_photo: '',
    manager_comment: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh quá lớn (giới hạn 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRatingData(prev => ({ ...prev, evidence_photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    onUpdatePlan({
      ...selectedPlan,
      ...ratingData,
      rating: 'rated'
    });

    alert('Đã lưu đánh giá và ảnh chứng minh!');
    setSelectedPlanId('');
    setRatingData({
      attitude_score: 'Tốt',
      discipline_score: 'Tốt',
      effectiveness_score: 'Tốt',
      bonus_score: 0,
      penalty_score: 0,
      evidence_photo: '',
      manager_comment: ''
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scoreOptions = ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'];
  const myRatedPlans = completedPlans.filter(p => p.rating === 'rated');

  const inputLightStyle = "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-800 placeholder-slate-400 font-medium";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      {/* LEFT COLUMN: EVALUATION FORM */}
      <div>
        {isManager ? (
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 sticky top-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <Award size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Đánh Giá Nhân Viên</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Xác thực kết quả công việc</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Chọn báo cáo để đánh giá</label>
              <select 
                className={inputLightStyle}
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
              >
                <option value="">-- Chọn nhân viên / ngày --</option>
                {completedPlans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.employee_name} - {p.date} {p.rating === 'rated' ? '(Đã có đánh giá)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlan && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                
                {/* --- NEW: PERFORMANCE RESULT SUMMARY BLOCK --- */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Target size={16} className="text-blue-500" /> Kết Quả Thực Hiện
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                     {[
                       { l: 'SIM', t: selectedPlan.sim_target, r: selectedPlan.sim_result },
                       { l: 'Fiber', t: selectedPlan.fiber_target, r: selectedPlan.fiber_result },
                       { l: 'MyTV', t: selectedPlan.mytv_target, r: selectedPlan.mytv_result },
                       { l: 'Mesh/Cam', t: selectedPlan.mesh_camera_target, r: selectedPlan.mesh_camera_result },
                       { l: 'CNTT', t: selectedPlan.cntt_target, r: selectedPlan.cntt_result },
                       { l: 'Doanh thu', t: selectedPlan.revenue_cntt_target, r: selectedPlan.revenue_cntt_result, isMoney: true },
                     ].map((m, i) => {
                       const percent = m.t > 0 ? (m.r / m.t) * 100 : (m.r > 0 ? 100 : 0);
                       const isHigh = percent >= 100;
                       return (
                         <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-1.5">
                               <span className="text-[10px] font-bold text-slate-500 uppercase">{m.l}</span>
                               <span className={`text-[10px] font-black ${isHigh ? 'text-emerald-500' : 'text-orange-500'}`}>
                                 {percent.toFixed(0)}%
                               </span>
                            </div>
                            <div className="flex items-end justify-between mb-2">
                               <div className="text-[10px] font-medium text-slate-400 flex flex-col">
                                 <span>KH</span>
                                 <span>{m.isMoney ? (m.t/1000000).toFixed(1) : m.t}</span>
                               </div>
                               <div className="text-sm font-black text-slate-800 flex flex-col items-end">
                                 <span className="text-[8px] font-bold text-slate-300 uppercase">Thực đạt</span>
                                 <span>{m.isMoney ? (m.r/1000000).toFixed(1) : m.r}</span>
                               </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-emerald-500' : 'bg-orange-400'}`} 
                                 style={{width: `${Math.min(percent, 100)}%`}}
                               ></div>
                            </div>
                         </div>
                       )
                     })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">Khách hàng tiếp cận</span>
                         <span className="text-base font-black text-blue-600">{selectedPlan.customers_contacted || 0}</span>
                      </div>
                      <div className="flex flex-col text-right">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">Hợp đồng đã ký</span>
                         <span className="text-base font-black text-emerald-600">{selectedPlan.contracts_signed || 0}</span>
                      </div>
                  </div>
                  
                  {selectedPlan.challenges && (
                    <div className="mt-4 text-xs bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 italic">
                      <span className="font-bold not-italic mr-1">Khó khăn:</span> "{selectedPlan.challenges}"
                    </div>
                  )}
                </div>

                {/* Image Upload for Evidence */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ảnh Chứng Minh Kết Quả</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden group"
                  >
                    {ratingData.evidence_photo ? (
                      <div className="w-full h-full relative">
                        <img src={ratingData.evidence_photo} className="w-full h-full object-cover" alt="Evidence" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="text-white" size={32} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="mx-auto text-slate-300 mb-2" size={40} />
                        <span className="text-xs font-bold text-slate-400">Tải ảnh chứng minh (Max 5MB)</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>
                </div>

                {/* Rating Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Thái độ', key: 'attitude_score' },
                    { label: 'Kỷ luật', key: 'discipline_score' },
                    { label: 'Hiệu quả', key: 'effectiveness_score' }
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{field.label}</label>
                      <select 
                        className={`${inputLightStyle} !py-2 !px-3 text-sm`}
                        value={(ratingData as any)[field.key]}
                        onChange={e => setRatingData({...ratingData, [field.key]: e.target.value})}
                      >
                        {scoreOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Bonus/Penalty Points */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <label className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">
                      <PlusCircle size={14} /> Điểm Cộng
                    </label>
                    <input 
                      type="number"
                      className={`${inputLightStyle} !bg-white/80 !border-emerald-100 focus:!border-emerald-400 focus:!ring-emerald-50`}
                      value={ratingData.bonus_score}
                      onChange={e => setRatingData({...ratingData, bonus_score: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                    <label className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">
                      <MinusCircle size={14} /> Điểm Trừ
                    </label>
                    <input 
                      type="number"
                      className={`${inputLightStyle} !bg-white/80 !border-rose-100 focus:!border-rose-400 focus:!ring-rose-50`}
                      value={ratingData.penalty_score}
                      onChange={e => setRatingData({...ratingData, penalty_score: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Comment Section */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nhận xét chi tiết</label>
                  <textarea 
                    className={`${inputLightStyle} h-24 resize-none`}
                    rows={3}
                    value={ratingData.manager_comment}
                    onChange={e => setRatingData({...ratingData, manager_comment: e.target.value})}
                    placeholder="Ghi chú về nỗ lực hoặc lỗi vi phạm của nhân viên..."
                  />
                </div>

                <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-700 transition shadow-xl shadow-purple-500/20 transform active:scale-95">
                  Lưu Đánh Giá
                </button>
              </form>
            )}

            {!selectedPlan && (
              <div className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl">
                <FileText className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold text-sm">Vui lòng chọn báo cáo từ danh sách trên</p>
              </div>
            )}
          </div>
        ) : (
          /* EMPLOYEE VIEW - STATS CARD */
          <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center text-center h-fit sticky top-6">
            <div className="bg-white/20 p-5 rounded-full mb-6 border border-white/30 shadow-inner">
              <Award size={64} className="text-white drop-shadow-lg" />
            </div>
            <h2 className="text-3xl font-black mb-3">Thành Tích Cá Nhân</h2>
            <p className="text-white/70 mb-10 text-sm max-w-xs font-medium leading-relaxed">
              Dưới đây là lịch sử đánh giá chất lượng công việc từ cấp quản lý trực tiếp.
            </p>
            
            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/10 shadow-lg">
                <span className="block text-4xl font-black tracking-tighter mb-1">{myRatedPlans.length}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-white/60">Lượt đánh giá</span>
              </div>
              <div className="bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/10 shadow-lg">
                <span className="block text-4xl font-black tracking-tighter mb-1">
                  {myRatedPlans.reduce((acc, p) => acc + (p.bonus_score || 0) - (p.penalty_score || 0), 0)}
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest text-white/60">Tổng điểm tích lũy</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: EVALUATION HISTORY */}
      <div className="bg-white rounded-3xl shadow-sm p-8 overflow-hidden border border-slate-100 flex flex-col h-[800px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              Lịch Sử Đánh Giá {isManager ? "Toàn Hệ Thống" : "Của Tôi"}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Cập nhật thời gian thực</p>
          </div>
          <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">
            {myRatedPlans.length} Bản ghi
          </span>
        </div>
        
        <div className="overflow-y-auto flex-1 pr-2 space-y-6 hide-scrollbar">
          {myRatedPlans.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center h-full text-slate-200">
              <ShieldAlert size={64} className="mb-4 opacity-30" />
              <p className="text-sm font-bold text-slate-400 italic">Chưa có dữ liệu đánh giá nào.</p>
            </div>
          ) : (
            myRatedPlans.map(p => (
              <div key={p.id} className="group border border-slate-100 rounded-3xl p-5 hover:bg-purple-50/20 hover:border-purple-100 transition-all shadow-sm hover:shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {p.evidence_photo && (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 shadow-sm">
                        <img src={p.evidence_photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform cursor-pointer" alt="Evidence" onClick={() => window.open(p.evidence_photo)} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-slate-800 text-lg tracking-tight">{p.employee_name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        <span className="bg-slate-50 px-2 py-0.5 rounded text-slate-500">{p.week_number}</span>
                        <span className="text-slate-200">•</span>
                        <span>{new Date(p.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className={`${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { l: 'Thái độ', v: p.attitude_score, c: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { l: 'Kỷ luật', v: p.discipline_score, c: 'bg-green-50 text-green-700 border-green-100' },
                    { l: 'Hiệu quả', v: p.effectiveness_score, c: 'bg-purple-50 text-purple-700 border-purple-100' }
                  ].map((stat, i) => (
                    <div key={i} className={`p-2 rounded-xl text-center border ${stat.c}`}>
                      <span className="text-[8px] uppercase font-black opacity-60 block mb-0.5">{stat.l}</span>
                      <span className="text-[11px] font-black">{stat.v}</span>
                    </div>
                  ))}
                </div>

                {(p.bonus_score !== 0 || p.penalty_score !== 0) && (
                  <div className="flex gap-4 mb-4">
                    {p.bonus_score !== 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <PlusCircle size={14} /> Điểm cộng: {p.bonus_score}
                      </div>
                    )}
                    {p.penalty_score !== 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full">
                        <MinusCircle size={14} /> Điểm trừ: {p.penalty_score}
                      </div>
                    )}
                  </div>
                )}
                
                {p.manager_comment && (
                  <div className="mt-2 bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 italic border border-slate-100 relative group-hover:bg-white transition-colors leading-relaxed">
                    <span className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] border border-slate-100 rounded-full">Nhận xét của QL</span>
                    "{p.manager_comment}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
