
import { createClient } from '@supabase/supabase-js';
import { User, Plan, SystemData } from '../types';
import bcrypt from 'bcryptjs';

/**
 * --- QUAN TRỌNG: CẬP NHẬT CƠ SỞ DỮ LIỆU ---
 * Copy toàn bộ đoạn SQL dưới đây và chạy trong "SQL Editor" của Supabase.
 * Lệnh này an toàn để chạy nhiều lần (sẽ không lỗi nếu cột đã tồn tại).
 *
 * alter table "plans" add column if not exists "collaborators" text;
 * alter table "plans" add column if not exists "other_services_target" numeric default 0;
 * alter table "plans" add column if not exists "other_services_result" numeric default 0;
 * alter table "plans" add column if not exists "adjustment_status" text;
 * alter table "plans" add column if not exists "adjustment_reason" text;
 * alter table "plans" add column if not exists "adjustment_data" text;
 * alter table "plans" add column if not exists "rating" text;
 * alter table "plans" add column if not exists "manager_comment" text;
 * alter table "plans" add column if not exists "attitude_score" text;
 * alter table "plans" add column if not exists "discipline_score" text;
 * alter table "plans" add column if not exists "effectiveness_score" text;
 * alter table "plans" add column if not exists "evidence_photo" text;
 * alter table "plans" add column if not exists "bonus_score" numeric default 0;
 * alter table "plans" add column if not exists "penalty_score" numeric default 0;
 * alter table "plans" add column if not exists "approved_by" text;
 * alter table "plans" add column if not exists "approved_at" text;
 * alter table "plans" add column if not exists "returned_reason" text;
 */

const SUPABASE_URL = 'https://oppgitgwutlpqwmcyfxj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lzQALnCDYyLrGv__8KMhhQ_MYvRGlI8';

// Khởi tạo client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const dataService = {
  getData: async (): Promise<{ data: SystemData; error?: string }> => {
    try {
      const [usersResponse, plansResponse] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('plans').select('*')
      ]);

      if (usersResponse.error) throw new Error(`Users Error: ${usersResponse.error.message}`);
      if (plansResponse.error) throw new Error(`Plans Error: ${plansResponse.error.message}`);

      return {
        data: {
          users: usersResponse.data as User[] || [],
          plans: plansResponse.data as Plan[] || []
        }
      };
    } catch (error: any) {
      console.error('Lỗi kết nối Supabase:', error);
      return { 
        data: { users: [], plans: [] },
        error: error.message || 'Không thể kết nối đến máy chủ dữ liệu.'
      };
    }
  },

  createUser: async (user: Omit<User, 'id' | 'created_at'>): Promise<User | null> => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = user.password ? await bcrypt.hash(user.password, salt) : '';

    const newUser: User = {
      ...user,
      password: hashedPassword,
      id: generateId(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('users').insert([newUser]).select();
    
    if (error) {
      console.error('Error creating user:', JSON.stringify(error, null, 2));
      throw error;
    }
    return data?.[0] as User;
  },

  updateUser: async (user: User) => {
    const { error } = await supabase
      .from('users')
      .update(user)
      .eq('id', user.id);
      
    if (error) console.error('Error updating user:', JSON.stringify(error, null, 2));
  },

  changePassword: async (id: string, newPassword: string): Promise<boolean> => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', id);

      if (error) {
        console.error('Error changing password:', JSON.stringify(error, null, 2));
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error hashing password:', error);
      return false;
    }
  },

  deleteUser: async (id: string) => {
    const { data: userData } = await supabase.from('users').select('employee_id').eq('id', id).single();
    
    if (userData) {
      await supabase.from('plans').delete().eq('employee_id', userData.employee_id);
    }
    
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('Error deleting user:', JSON.stringify(error, null, 2));
  },

  createPlan: async (plan: Omit<Plan, 'id' | 'created_at'>): Promise<Plan | null> => {
    const newPlan: Plan = {
      ...plan,
      id: generateId(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('plans').insert([newPlan]).select();
    
    if (error) {
      console.error('Error creating plan:', JSON.stringify(error, null, 2));
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        alert('Lỗi CSDL: Bảng "plans" thiếu cột. Vui lòng chạy script SQL trong services/dataService.ts');
      } else {
        alert(`Lỗi tạo kế hoạch: ${error.message}`);
      }
      return null;
    }
    return data?.[0] as Plan;
  },

  updatePlan: async (plan: Plan) => {
    const { error } = await supabase
      .from('plans')
      .update(plan)
      .eq('id', plan.id);

    if (error) {
      console.error('Error updating plan:', JSON.stringify(error, null, 2));
      if (error.code === 'PGRST204' || error.message.includes('column')) {
         alert(`Lỗi CSDL: CSDL chưa được cập nhật cột mới (adjustment_data...). \nVui lòng mở services/dataService.ts và chạy script SQL trong phần comment.`);
      } else {
         alert(`Lỗi cập nhật kế hoạch: ${error.message} (Code: ${error.code})`);
      }
    }
  },

  deletePlan: async (id: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) console.error('Error deleting plan:', JSON.stringify(error, null, 2));
  }
};
