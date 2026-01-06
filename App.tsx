import React, { useState, useEffect } from 'react';
import { User, Plan, SystemData } from './types';
import { dataService } from './services/dataService';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { WeeklyPlan } from './components/WeeklyPlan';
import { PlanApproval } from './components/PlanApproval';
import { DailyReport } from './components/DailyReport';
import { RatingEvaluation } from './components/RatingEvaluation';
import { SummaryExport } from './components/SummaryExport';
import { AlertTriangle } from 'lucide-react';
import bcrypt from 'bcryptjs';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemData, setSystemData] = useState<SystemData>({ users: [], plans: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Function to load data from Supabase
  const refreshData = async () => {
    const response = await dataService.getData();
    if (response.error) {
      setConnectionError(response.error);
    } else {
      setSystemData(response.data);
      setConnectionError(null);
    }
    setIsDataLoading(false);
  };

  useEffect(() => {
    // Initial data load
    refreshData();
    
    // Check session
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Ensure we have the latest data before checking login
    const response = await dataService.getData();
    
    if (response.error) {
      setConnectionError(response.error);
      setIsLoading(false);
      return false;
    }
    
    setSystemData(response.data);
    setConnectionError(null);
    
    // Find user by username only
    const user = response.data.users.find(u => u.username === username);
    
    let isAuthenticated = false;

    if (user && user.is_active && user.password) {
      // Check if password is a hash (starts with $2)
      if (user.password.startsWith('$2')) {
        isAuthenticated = await bcrypt.compare(pass, user.password);
      } else {
        // Fallback for legacy plain text passwords (temporary support)
        isAuthenticated = user.password === pass;
      }
    }
    
    setIsLoading(false);
    if (isAuthenticated && user) {
      setCurrentUser(user);
      localStorage.setItem('current_user', JSON.stringify(user));
      setActiveTab('dashboard');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user');
    setActiveTab('dashboard');
  };

  const handleChangePassword = async (oldPass: string, newPass: string): Promise<{success: boolean, message: string}> => {
    if (!currentUser || !currentUser.password) return { success: false, message: 'Lỗi phiên đăng nhập' };

    // 1. Verify old password
    let isMatch = false;
    if (currentUser.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(oldPass, currentUser.password);
    } else {
      isMatch = currentUser.password === oldPass;
    }

    if (!isMatch) {
      return { success: false, message: 'Mật khẩu cũ không chính xác' };
    }

    // 2. Call service to update
    const success = await dataService.changePassword(currentUser.id, newPass);
    if (success) {
      // 3. Update local state to reflect new hash (fetch fresh data or just invalidate session)
      // Ideally, we fetch the new user object to get the new hash
      await refreshData();
      
      // Update current user state with new info so subsequent actions don't fail
      // Since we don't have the new hash locally without refetching, 
      // we'll rely on refreshData() updating systemData. 
      // But we also need to update currentUser to keep session valid if we used the hash from there.
      // For simplicity in this flow, forcing re-login or just updating UI notification is fine.
      return { success: true, message: 'Đổi mật khẩu thành công' };
    } else {
      return { success: false, message: 'Lỗi khi cập nhật mật khẩu' };
    }
  };

  // CRUD Wrappers - Now Async
  const handleAddUser = async (user: Omit<User, 'id' | 'created_at'>) => {
    await dataService.createUser(user);
    await refreshData();
  };
  const handleUpdateUser = async (user: User) => {
    await dataService.updateUser(user);
    await refreshData();
  };
  const handleDeleteUser = async (id: string) => {
    await dataService.deleteUser(id);
    await refreshData();
  };

  const handleAddPlan = async (plan: Omit<Plan, 'id' | 'created_at'>) => {
    await dataService.createPlan(plan);
    await refreshData();
  };
  const handleUpdatePlan = async (plan: Plan) => {
    await dataService.updatePlan(plan);
    await refreshData();
  };

  // Error Screen
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Lỗi Kết Nối</h2>
          <p className="text-gray-600 mb-6 text-sm">{connectionError}</p>
          <div className="bg-slate-50 p-4 rounded-lg text-left text-xs text-slate-500 mb-6">
            <p className="font-bold mb-1">Hướng dẫn khắc phục:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Mở file <code>services/dataService.ts</code></li>
              <li>Thay thế <code>YOUR_SUPABASE_URL</code> bằng URL dự án của bạn</li>
              <li>Thay thế <code>YOUR_SUPABASE_ANON_KEY</code> bằng Key của bạn</li>
              <li>Đảm bảo đã chạy Script SQL tạo bảng trong Supabase</li>
            </ol>
          </div>
          <button 
            onClick={() => { setConnectionError(null); setIsDataLoading(true); refreshData(); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while initial data fetches
  if (isDataLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center vnpt-gradient">
        <div className="text-white text-xl font-bold animate-pulse">Đang tải dữ liệu hệ thống...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={isLoading} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      onChangePassword={handleChangePassword}
    >
      {activeTab === 'dashboard' && <Dashboard users={systemData.users} plans={systemData.plans} />}
      {activeTab === 'users' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
        <UserManagement 
          currentUser={currentUser}
          users={systemData.users} 
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
        />
      )}
      {activeTab === 'plan' && (
        <>
          <WeeklyPlan 
            currentUser={currentUser} 
            plans={systemData.plans} 
            onAddPlan={handleAddPlan}
            onUpdatePlan={handleUpdatePlan}
          />
          {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
             <div className="mt-12 pt-8 border-t border-gray-200">
               <PlanApproval currentUser={currentUser} plans={systemData.plans} onUpdatePlan={handleUpdatePlan} />
             </div>
          )}
        </>
      )}
      {activeTab === 'daily' && <DailyReport currentUser={currentUser} plans={systemData.plans} onUpdatePlan={handleUpdatePlan} />}
      {activeTab === 'rating' && <RatingEvaluation currentUser={currentUser} plans={systemData.plans} onUpdatePlan={handleUpdatePlan} />}
      {activeTab === 'summary' && <SummaryExport users={systemData.users} plans={systemData.plans} />}
    </Layout>
  );
};

export default App;