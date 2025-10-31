export interface User {
  id: number;
  name: string;
  email: string;
  level: number;
  prestige_points: number;
  last_active: string;
}

export interface GameState {
  id: number;
  user_id: number;
  company_id: number | null;
  money: number;
  click_power: number;
  auto_income: number;
  xp: number;
  level: number;
  reputation: number;
  completed_projects: number;
  prestige_level: number;
  prestige_points: number;
  lifetime_earnings: number;
  total_clicks: number;
  upgrades: Record<string, number>;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  user_id: number;
  name: string;
  company_level: number;
  cash: number;
  monthly_revenue: number;
  monthly_costs: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  company_id?: number;
  name: string;
  role: 'junior' | 'mid' | 'senior' | 'lead' | 'architect';
  productivity: number;
  skill_level: number;
  salary: number;
  energy: number;
  status: 'working' | 'idle' | 'quit';
  morale: number;
  level: number;
  experience: number;
  xp_for_next_level: number;
  projects_completed: number;
  effective_productivity?: number;
  status_emoji: string;
  needs_rest: boolean;
  assigned_project?: {
    id: number;
    title: string;
    progress: number;
  } | null;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  company_id: number;
  user_id: number;
  title: string;
  description: string | null;
  difficulty: number;
  required_reputation: number;
  reward: number;
  progress: number;
  started_at: string;
  deadline: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  tasks?: ProjectTask[];
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  estimated_hours: number;
  progress: number;
  assigned_employee_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface MarketEvent {
  id: number;
  event_type: string;
  description: string;
  effect: Record<string, any>;
  start_time: string;
  end_time: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  money: number;
  level: number;
  reputation: number;
  projects_completed: number;
  is_current_user: boolean;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
  icon: string;
  max_level: number;
  is_unlocked: boolean;
  current_level: number;
  experience: number;
  unlock_cost: number;
  upgrade_cost: number | null;
  efficiency_bonus: number;
  project_types: string[];
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface UserSkill {
  id: number;
  name: string;
  category: string;
  icon: string;
  level: number;
  experience: number;
  max_level: number;
  efficiency_bonus: number;
  upgrade_cost: number | null;
  unlocked_at: string;
}

export interface Achievement {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  requirement_type: string;
  reward_money: number;
  reward_xp: number;
  reward_prestige_points: number;
  is_unlocked: boolean;
  progress: number;
  unlocked_at?: string;
}

export interface ShopItem {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  price: number;
  duration_minutes: number | null;
  effect_type: string;
  effect_data: Record<string, any>;
  is_available: boolean;
}

export interface UserPurchase {
  id: number;
  user_id: number;
  shop_item_id: number;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
  shopItem: ShopItem;
}

