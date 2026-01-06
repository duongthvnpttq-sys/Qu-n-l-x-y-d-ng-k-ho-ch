
export type Role = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  employee_id: string;
  employee_name: string;
  avatar?: string; // Base64 string for profile picture
  position: string;
  management_area: string;
  username: string;
  password?: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  management_area: string; // User's area
  week_number: string;
  date: string;
  area: string; // Specific area for this plan
  work_content: string;
  collaborators?: string; // New field
  
  // Targets
  sim_target: number;
  vas_target: number;
  fiber_target: number;
  mytv_target: number;
  mesh_camera_target: number;
  cntt_target: number;
  revenue_cntt_target: number;
  other_services_target?: number; // New field
  
  time_schedule: string;
  implementation_method: string;
  
  // Results
  sim_result: number;
  vas_result: number;
  fiber_result: number;
  mytv_result: number;
  mesh_camera_result: number;
  cntt_result: number;
  revenue_cntt_result: number;
  other_services_result?: number; // New field
  
  customers_contacted: number;
  contracts_signed: number;
  
  challenges: string;
  notes: string;
  
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  
  // Rating
  rating?: 'rated' | '';
  manager_comment?: string;
  attitude_score?: string;
  discipline_score?: string;
  effectiveness_score?: string;
  evidence_photo?: string; // New: Proof of results
  bonus_score?: number;     // New: Additive points
  penalty_score?: number;   // New: Subtractive points
  
  // Metadata
  approved_by?: string;
  approved_at?: string;
  submitted_at: string;
  returned_reason?: string;
  created_at: string;
}

export interface SystemData {
  users: User[];
  plans: Plan[];
}
