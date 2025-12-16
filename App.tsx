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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemData, setSystemData] = useState<SystemData>({ users: [], plans: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const data = dataService.init();
    setSystemData(data);
    
    // Check session
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const refreshData = () => {
    // Force a new object reference to ensure React triggers a re-render
    const newData = dataService.getData();
    setSystemData({ ...newData });
  };

  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));
    
    const user = systemData.users.find(u => u.username === username && u.password === pass);
    
    setIsLoading(false);
    if (user && user.is_active) {
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

  // CRUD Wrappers
  const handleAddUser = (user: Omit<User, 'id' | 'created_at'>) => {
    dataService.createUser(user);
    refreshData();
  };
  const handleUpdateUser = (user: User) => {
    dataService.updateUser(user);
    refreshData();
  };
  const handleDeleteUser = (id: string) => {
    dataService.deleteUser(id);
    refreshData();
  };

  const handleAddPlan = (plan: Omit<Plan, 'id' | 'created_at'>) => {
    dataService.createPlan(plan);
    refreshData();
  };
  const handleUpdatePlan = (plan: Plan) => {
    dataService.updatePlan(plan);
    refreshData();
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={isLoading} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={handleLogout}
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
          <WeeklyPlan currentUser={currentUser} plans={systemData.plans} onAddPlan={handleAddPlan} />
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