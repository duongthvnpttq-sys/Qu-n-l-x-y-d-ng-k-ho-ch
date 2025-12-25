
import { User, Plan, SystemData } from '../types';

const STORAGE_KEY = 'vnpt_system_data';

const SEED_USERS: User[] = [
  {
    id: 'ADMIN_001',
    employee_id: 'ADMIN_001',
    employee_name: 'Administrator',
    position: 'Quản trị viên hệ thống',
    management_area: 'Toàn bộ hệ thống',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'MNG_001',
    employee_id: 'MNG_001',
    employee_name: 'Lê Văn Cường',
    position: 'Tổ trưởng kinh doanh',
    management_area: 'Toàn huyện',
    username: 'levancuong',
    password: 'manager123',
    role: 'manager',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'EMP_001',
    employee_id: 'EMP_001',
    employee_name: 'Nguyễn Văn An',
    position: 'Nhân viên kinh doanh',
    management_area: 'Xã Yên Thuận',
    username: 'nguyenvanan',
    password: '123456',
    role: 'employee',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const dataService = {
  init: (): SystemData => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Đảm bảo plans luôn trống nếu người dùng muốn làm mới hoàn toàn
      // Hoặc có thể giữ lại users nhưng xóa plans. Ở đây ta giữ logic mặc định nhưng reset plans.
      return data;
    }
    const initialData: SystemData = {
      users: SEED_USERS,
      plans: [] // Khởi tạo với danh sách kế hoạch trống
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  },

  getData: (): SystemData => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: SystemData = stored ? JSON.parse(stored) : { users: [], plans: [] };
    return data;
  },

  saveData: (data: SystemData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  isUsernameTaken: (username: string): boolean => {
    const data = dataService.getData();
    return data.users.some(u => u.username.toLowerCase() === username.toLowerCase());
  },

  createUser: (user: Omit<User, 'id' | 'created_at'>): User => {
    const data = dataService.getData();
    const newUser: User = {
      ...user,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    dataService.saveData(data);
    return newUser;
  },

  updateUser: (user: User) => {
    const data = dataService.getData();
    const index = data.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      data.users[index] = user;
      dataService.saveData(data);
    }
  },

  deleteUser: (id: string) => {
    const data = dataService.getData();
    data.users = data.users.filter(u => u.id !== id);
    dataService.saveData(data);
  },

  createPlan: (plan: Omit<Plan, 'id' | 'created_at'>): Plan => {
    const data = dataService.getData();
    const newPlan: Plan = {
      ...plan,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    data.plans.push(newPlan);
    dataService.saveData(data);
    return newPlan;
  },

  updatePlan: (plan: Plan) => {
    const data = dataService.getData();
    const index = data.plans.findIndex(p => p.id === plan.id);
    if (index !== -1) {
      data.plans[index] = plan;
      dataService.saveData(data);
    }
  },

  deletePlan: (id: string) => {
    const data = dataService.getData();
    data.plans = data.plans.filter(p => p.id !== id);
    dataService.saveData(data);
  }
};
