import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    const response = await api.post('/auth/register', { 
      name, 
      email, 
      password, 
      password_confirmation 
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  },
};

// Game API
export const gameAPI = {
  getGameState: async () => {
    const response = await api.get('/game');
    return response.data;
  },

  click: async () => {
    const response = await api.post('/game/click');
    return response.data;
  },

  buyUpgrade: async (upgradeType: string) => {
    const response = await api.post('/game/upgrade', { upgrade_type: upgradeType });
    return response.data;
  },

  prestige: async () => {
    const response = await api.post('/game/prestige');
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await api.get('/leaderboard');
    return response.data;
  },
};

// Company API
export const companyAPI = {
  getCompany: async () => {
    const response = await api.get('/company');
    return response.data;
  },

  createCompany: async (name: string) => {
    const response = await api.post('/company', { name });
    return response.data;
  },

  updateCompany: async (name: string) => {
    const response = await api.put('/company', { name });
    return response.data;
  },
};

// Project API
export const projectAPI = {
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  getProject: async (id: number) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  startProject: async (title: string, description: string, difficulty: number) => {
    const response = await api.post('/projects/start', { 
      title, 
      description, 
      difficulty 
    });
    return response.data;
  },

  claimProject: async (id: number) => {
    const response = await api.post(`/projects/${id}/claim`);
    return response.data;
  },
};

// Employee API
export const employeeAPI = {
  getEmployees: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  hire: async (name: string, role: string) => {
    const response = await api.post('/employees/hire', { name, role });
    return response.data;
  },

  fire: async (id: number) => {
    const response = await api.post(`/employees/${id}/fire`);
    return response.data;
  },

  assignTask: async (id: number, taskId: number) => {
    const response = await api.post(`/employees/${id}/assign`, { task_id: taskId });
    return response.data;
  },

  assignToProject: async (id: number, projectId: number) => {
    const response = await api.post(`/employees/${id}/assign-project`, { project_id: projectId });
    return response.data;
  },

  unassignFromProject: async (id: number) => {
    const response = await api.post(`/employees/${id}/unassign`);
    return response.data;
  },

  rest: async (id: number) => {
    const response = await api.post(`/employees/${id}/rest`);
    return response.data;
  },
};

// Skills API
export const skillsAPI = {
  getSkills: async () => {
    const response = await api.get('/skills');
    return response.data;
  },

  getUserSkills: async () => {
    const response = await api.get('/user/skills');
    return response.data;
  },

  unlockSkill: async (skillId: number) => {
    const response = await api.post('/skills/unlock', { skill_id: skillId });
    return response.data;
  },

  upgradeSkill: async (skillId: number) => {
    const response = await api.post('/skills/upgrade', { skill_id: skillId });
    return response.data;
  },
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: async (category: 'money' | 'level' | 'reputation' | 'projects' = 'money') => {
    const response = await api.get('/leaderboard', { params: { category } });
    return response.data;
  },
};

// Achievements API
export const achievementAPI = {
  getAchievements: async () => {
    const response = await api.get('/achievements');
    return response.data;
  },
  checkAchievements: async () => {
    const response = await api.post('/achievements/check');
    return response.data;
  },
  getUnnotified: async () => {
    const response = await api.get('/achievements/unnotified');
    return response.data;
  },
};

// Shop API
export const shopAPI = {
  getItems: async () => {
    const response = await api.get('/shop');
    return response.data;
  },
  purchase: async (itemId: number) => {
    const response = await api.post('/shop/purchase', { item_id: itemId });
    return response.data;
  },
  getActivePurchases: async () => {
    const response = await api.get('/shop/purchases');
    return response.data;
  },
};

// Research API
export const researchAPI = {
  getResearches: async () => {
    const response = await api.get('/research');
    return response.data;
  },
  unlockResearch: async (id: number) => {
    const response = await api.post(`/research/${id}/unlock`);
    return response.data;
  },
};

// Automation API
export const automationAPI = {
  getSettings: async () => {
    const response = await api.get('/automation');
    return response.data;
  },
  updateSettings: async (settings: any) => {
    const response = await api.put('/automation', settings);
    return response.data;
  },
};

// Product Bugs API
export const productBugAPI = {
  getBugs: async (productId: number) => {
    const response = await api.get(`/products/${productId}/bugs`);
    return response.data;
  },
  startFix: async (bugId: number) => {
    const response = await api.post(`/bugs/${bugId}/start-fix`);
    return response.data;
  },
  completeFix: async (bugId: number) => {
    const response = await api.post(`/bugs/${bugId}/complete-fix`);
    return response.data;
  },
};

export default api;

