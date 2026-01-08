
import React, { useState } from 'react';
import { User, Role } from '../types';
import { LogOut, LayoutDashboard, Users, Calendar, CheckSquare, Star, FileBarChart, UserCircle, Key, X, Lock, Sparkles } from 'lucide-react';

interface LayoutProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onChangePassword: (oldPass: string, newPass: string) => Promise<{success: boolean, message: string}>;
  children: React.ReactNode;
}

const TABS: Record<string, { label: string; icon: React.ReactNode; roles: Role[] }> = {
  dashboard: { label: 'Tổng Quan', icon: <LayoutDashboard size={18} />, roles: ['admin', 'manager', 'employee'] },
  users: { label: 'Người Dùng', icon: <Users size={18} />, roles: ['admin', 'manager'] },
  plan: { label: 'Kế Hoạch', icon: <Calendar size={18} />, roles: ['admin', 'manager', 'employee'] },
  daily: { label: 'Báo Cáo', icon: <CheckSquare size={18} />, roles: ['admin', 'manager', 'employee'] },
  rating: { label: 'Đánh Giá', icon: <Star size={18} />, roles: ['admin', 'manager', 'employee'] },
  analysis: { label: 'Trợ Lý AI', icon: <Sparkles size={18} />, roles: ['admin', 'manager', 'employee'] }, // New Tab
  summary: { label: 'Tổng Hợp', icon: <FileBarChart size={18} />, roles: ['admin', 'manager'] }
};

export const Layout: React.FC<LayoutProps> = ({ currentUser, activeTab, onTabChange, onLogout, onChangePassword, children }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  const availableTabs = Object.entries(TABS).filter(([_, config]) => config.roles.includes(currentUser.role));

  const roleLabels: Record<Role, string> = {
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    employee: 'Nhân viên'
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage({ text: '', type: '' });

    if (passwordForm.newPass !== passwordForm.confirmPass) {
      setPassMessage({ text: 'Mật khẩu mới không khớp!', type: 'error' });
      return;
    }
    
    if (passwordForm.newPass.length < 6) {
      setPassMessage({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự', type: 'error' });
      return;
    }

    setIsSubmittingPass(true);
    try {
      const result = await onChangePassword(passwordForm.oldPass, passwordForm.newPass);
      if (result.success) {
        setPassMessage({ text: result.message, type: 'success' });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordForm({ oldPass: '', newPass: '', confirmPass: '' });
          setPassMessage({ text: '', type: '' });
        }, 1500);
      } else {
        setPassMessage({ text: result.message, type: 'error' });
      }
    } catch (error) {
       setPassMessage({ text: 'Có lỗi xảy ra', type: 'error' });
    } finally {
       setIsSubmittingPass(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="vnpt-gradient text-white shadow-lg flex-shrink-0 relative z-20">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-md hidden sm:block">
                 <img 
                   src="https://hcom.vn/wp-content/uploads/2021/04/logo-VNPT.jpg" 
                   alt="VNPT Logo" 
                   className="h-16 w-auto object-contain"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none'; // Ẩn nếu lỗi ở header
                   }}
                 />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">HỆ THỐNG QUẢN LÝ BÁN HÀNG</h1>
                <p className="text-xs md:text-sm opacity-90 mt-0.5 font-medium">VNPT Hàm Yên - Tuyên Quang</p>
              </div>
            </div>
            
            <div className="text-right flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={24} />
                  )}
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold">{currentUser.employee_name}</p>
                  <p className="text-xs opacity-80">{roleLabels[currentUser.role]}</p>
                </div>
              </div>
              
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="p-2 rounded-md hover:bg-white/20 transition-colors text-white/90 hover:text-white"
                  title="Đổi mật khẩu"
                >
                  <Key size={18} />
                </button>
                <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
                <button 
                  onClick={onLogout}
                  className="p-2 rounded-md hover:bg-white/20 transition-colors text-white/90 hover:text-white"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 flex gap-1 overflow-x-auto pb-0 hide-scrollbar mt-2">
          {availableTabs.map(([key, config]) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-all
                ${activeTab === key 
                  ? 'bg-gray-50 text-blue-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] translate-y-[1px]' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'}
              `}
            >
              {config.icon}
              {config.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 w-full p-4 md:p-6 overflow-y-auto relative z-10">
        {children}
      </main>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Key size={20} /> Đổi Mật Khẩu
                </h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20}/></button>
             </div>
             
             <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                {passMessage.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${passMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {passMessage.type === 'error' ? <X size={16}/> : <CheckSquare size={16}/>}
                    {passMessage.text}
                  </div>
                )}

                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu cũ</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                       type="password" 
                       required
                       className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                       value={passwordForm.oldPass}
                       onChange={e => setPasswordForm({...passwordForm, oldPass: e.target.value})}
                       placeholder="Nhập mật khẩu hiện tại"
                     />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu mới</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                       type="password" 
                       required
                       className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                       value={passwordForm.newPass}
                       onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})}
                       placeholder="Ít nhất 6 ký tự"
                     />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-500 uppercase">Xác nhận mật khẩu mới</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                       type="password" 
                       required
                       className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                       value={passwordForm.confirmPass}
                       onChange={e => setPasswordForm({...passwordForm, confirmPass: e.target.value})}
                       placeholder="Nhập lại mật khẩu mới"
                     />
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button 
                     type="button" 
                     onClick={() => setIsPasswordModalOpen(false)}
                     className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors text-sm"
                   >
                     Hủy bỏ
                   </button>
                   <button 
                     type="submit" 
                     disabled={isSubmittingPass}
                     className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-sm disabled:opacity-70"
                   >
                     {isSubmittingPass ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
