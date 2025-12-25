
import React, { useState, useRef } from 'react';
import { User, Role } from '../types';
import { Trash2, Lock, Unlock, UserPlus, Shield, Check, Camera, User as UserIcon, UploadCloud, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { dataService } from '../services/dataService';

interface UserManagementProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: Omit<User, 'id' | 'created_at'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);
  const [targetUserForAvatar, setTargetUserForAvatar] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    employee_name: '',
    avatar: '',
    position: '',
    management_area: '',
    username: '',
    password: '',
    role: 'employee' as Role,
  });

  const availableRoles = currentUser.role === 'admin' 
    ? [
        { value: 'admin', label: 'Quản Trị Viên (Admin)', desc: 'Toàn quyền hệ thống, quản lý người dùng, xem tất cả báo cáo.' },
        { value: 'manager', label: 'Quản Lý (Manager)', desc: 'Duyệt kế hoạch, đánh giá nhân viên, xem báo cáo tổng hợp.' },
        { value: 'employee', label: 'Nhân Viên (Employee)', desc: 'Lập kế hoạch tuần, báo cáo ngày, xem đánh giá cá nhân.' }
      ]
    : [
        { value: 'employee', label: 'Nhân Viên (Employee)', desc: 'Lập kế hoạch tuần, báo cáo ngày, xem đánh giá cá nhân.' }
      ];

  const currentRoleDesc = availableRoles.find(r => r.value === formData.role)?.desc;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Kích thước ảnh quá lớn (giới hạn 2MB)");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditAvatarClick = (user: User) => {
    setTargetUserForAvatar(user);
    editAvatarInputRef.current?.click();
  };

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetUserForAvatar) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Kích thước ảnh quá lớn (giới hạn 2MB)");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({
          ...targetUserForAvatar,
          avatar: reader.result as string
        });
        setTargetUserForAvatar(null);
        alert(`Đã cập nhật ảnh đại diện cho ${targetUserForAvatar.employee_name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.position) {
      setErrorMsg('Vui lòng chọn chức danh');
      return;
    }

    if (dataService.isUsernameTaken(formData.username)) {
      setErrorMsg('Tên đăng nhập đã tồn tại trong hệ thống');
      return;
    }

    onAddUser({
      ...formData,
      employee_id: `EMP_${Date.now()}`,
      is_active: true
    });

    setFormData({
      employee_name: '',
      avatar: '',
      position: '',
      management_area: '',
      username: '',
      password: '',
      role: 'employee',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert('Thêm người dùng thành công!');
  };

  const inputLightStyle = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-800 placeholder-slate-400 font-medium";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden input for editing existing user avatar */}
      <input 
        type="file" 
        ref={editAvatarInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleEditAvatarChange} 
      />

      <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <UserPlus size={24} />
          </div>
          Thêm Người Dùng & Phân Quyền
        </h2>
        
        {errorMsg && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 text-red-700 animate-in slide-in-from-left-2">
            <AlertCircle size={20} />
            <span className="text-sm font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="w-full md:w-1/4 flex flex-col items-center gap-4">
              <div 
                className="relative w-40 h-40 rounded-full border-4 border-slate-50 flex items-center justify-center overflow-hidden bg-slate-100 group hover:border-blue-100 transition-all cursor-pointer shadow-inner"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Camera size={32} className="mx-auto mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Tải ảnh</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-blue-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <UploadCloud className="text-white" size={24} />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                Max Size: 2MB
              </p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Họ và Tên</label>
                <input
                  required
                  type="text"
                  className={inputLightStyle}
                  value={formData.employee_name}
                  onChange={e => setFormData({...formData, employee_name: e.target.value})}
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Chức Danh</label>
                <select
                  required
                  className={inputLightStyle}
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                >
                  <option value="">-- Chọn chức danh --</option>
                  <option value="Nhân viên kinh doanh">Nhân viên kinh doanh</option>
                  <option value="Tổ trưởng kinh doanh">Tổ trưởng kinh doanh</option>
                  <option value="Phó phòng kinh doanh">Phó phòng kinh doanh</option>
                  <option value="Trưởng phòng kinh doanh">Trưởng phòng kinh doanh</option>
                  <option value="Giám đốc">Giám đốc</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Địa Bàn Quản Lý</label>
                <input
                  required
                  type="text"
                  className={inputLightStyle}
                  value={formData.management_area}
                  onChange={e => setFormData({...formData, management_area: e.target.value})}
                  placeholder="VD: Xã Yên Thuận"
                />
              </div>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 md:col-span-1 md:row-span-2 shadow-inner">
                <label className="block text-xs font-black text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <Shield size={16} className="text-blue-600" />
                  Cấp Độ Truy Cập (Role)
                </label>
                <select
                  required
                  className={`${inputLightStyle} !py-2.5 mb-4`}
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                
                {currentRoleDesc && (
                  <div className="text-xs text-blue-700 bg-blue-50/80 p-4 rounded-xl border border-blue-100/50 flex gap-2 items-start leading-relaxed shadow-sm">
                    <Check size={14} className="mt-0.5 flex-shrink-0" />
                    <span><strong>Quyền hạn:</strong> {currentRoleDesc}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Tên Đăng Nhập</label>
                <input
                  required
                  type="text"
                  className={inputLightStyle}
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Mật Khẩu</label>
                <input
                  required
                  type="password"
                  className={inputLightStyle}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t border-slate-50">
            <button 
              type="submit" 
              className="w-full md:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 transform active:scale-95"
            >
              Thêm Người Dùng
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="px-6 py-5 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Danh Sách Người Dùng ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin cá nhân</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chức Danh</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa Bàn</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quyền</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const isCurrentUser = user.id === currentUser.id;
                let canModify = false;
                if (currentUser.role === 'admin') {
                  canModify = true;
                } else if (currentUser.role === 'manager') {
                  canModify = user.role === 'employee';
                }
                // Admin can modify themselves only for avatar, but not roles/delete (logic below handles buttons)

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 group/avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <UserIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{user.position}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{user.management_area}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-black border
                        ${user.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 
                          user.role === 'manager' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {user.role === 'admin' ? 'ADMIN' : user.role === 'manager' ? 'MANAGER' : 'EMPLOYEE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 w-fit px-2 py-0.5 text-[10px] rounded-full font-black
                        ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {user.is_active ? 'ACTIVE' : 'LOCKED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Avatar Update Button */}
                        <button
                          type="button"
                          onClick={() => handleEditAvatarClick(user)}
                          className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                          title="Cập nhật ảnh đại diện"
                        >
                          <Camera size={16} />
                        </button>

                        <button
                          type="button"
                          disabled={!canModify || isCurrentUser}
                          onClick={() => onUpdateUser({...user, is_active: !user.is_active})}
                          className={`p-2 rounded-xl text-white transition-all shadow-sm hover:shadow-md active:scale-95 
                            ${(!canModify || isCurrentUser) ? 'bg-slate-200 cursor-not-allowed text-slate-400' : (user.is_active ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600')}`}
                          title={isCurrentUser ? 'Bạn không thể tự khóa mình' : (!canModify ? 'Bạn không có quyền thao tác' : (user.is_active ? 'Khóa' : 'Mở khóa'))}
                        >
                          {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        
                        <button
                          type="button"
                          disabled={!canModify || isCurrentUser}
                          onClick={() => {
                            if (canModify && !isCurrentUser && window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.employee_name}" không?`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className={`p-2 rounded-xl text-white transition-all shadow-sm hover:shadow-md active:scale-95 
                            ${(!canModify || isCurrentUser) ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-rose-500 hover:bg-rose-600'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
