
import { createClient } from '@supabase/supabase-js';
import { User, Plan, SystemData } from '../types';
import bcrypt from 'bcryptjs';

/**
 * --- QUAN TRỌNG: CẬP NHẬT CƠ SỞ DỮ LIỆU ---
 * Nếu gặp lỗi "Could not find the '...' column" hoặc lỗi "already exists", 
 * vui lòng chạy lệnh SQL sau trong Supabase SQL Editor (đã thêm 'if not exists' để an toàn):
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
  // Use crypto.randomUUID if available for robust UUID generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const dataService = {
  // Fetch all data from Supabase
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

  // Create a new user with hashed password
  createUser: async (user: Omit<User, 'id' | 'created_at'>): Promise<User | null> => {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = user.password ? await bcrypt.hash(user.password, salt) : '';

    const newUser: User = {
      ...user,
      password: hashedPassword, // Store hash instead of plain text
      id: generateId(), // Changed to use UUID
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('users').insert([newUser]).select();
    
    if (error) {
      console.error('Error creating user:', error);
      throw error; // Throw error so UI can handle it
    }
    return data?.[0] as User;
  },

  // Update an existing user
  updateUser: async (user: User) => {
    // Note: This function assumes password is NOT being updated here. 
    // If password update feature is added, hashing logic is needed here too.
    const { error } = await supabase
      .from('users')
      .update(user)
      .eq('id', user.id);
      
    if (error) console.error('Error updating user:', error);
  },

  // Change password for a user
  changePassword: async (id: string, newPassword: string): Promise<boolean> => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', id);

      if (error) {
        console.error('Error changing password:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error hashing password:', error);
      return false;
    }
  },

  // Delete a user and their associated plans
  deleteUser: async (id: string) => {
    // First fetch the user to get employee_id for plan deletion
    const { data: userData } = await supabase.from('users').select('employee_id').eq('id', id).single();
    
    if (userData) {
      // Delete user's plans
      await supabase.from('plans').delete().eq('employee_id', userData.employee_id);
    }
    
    // Delete the user
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('Error deleting user:', error);
  },

  // Create a new plan
  createPlan: async (plan: Omit<Plan, 'id' | 'created_at'>): Promise<Plan | null> => {
    const newPlan: Plan = {
      ...plan,
      id: generateId(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('plans').insert([newPlan]).select();
    
    if (error) {
      console.error('Error creating plan:', error);
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        alert('Lỗi Cấu Trúc Dữ Liệu: Thiếu cột trong bảng plans. Vui lòng kiểm tra file services/dataService.ts để xem lệnh SQL cập nhật.');
      }
      return null;
    }
    return data?.[0] as Plan;
  },

  // Update an existing plan
  updatePlan: async (plan: Plan) => {
    const { error } = await supabase
      .from('plans')
      .update(plan)
      .eq('id', plan.id);

    if (error) {
      console.error('Error updating plan:', error);
      if (error.code === 'PGRST204' || error.message.includes('column')) {
         alert(`Lỗi Hệ Thống: CSDL chưa được cập nhật cột mới (adjustment_data...). \nVui lòng chạy script SQL trong services/dataService.ts`);
      }
    }
  },

  // Delete a plan
  deletePlan: async (id: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) console.error('Error deleting plan:', error);
  }
};
