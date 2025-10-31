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

export default api;

