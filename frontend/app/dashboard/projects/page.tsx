'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { projectAPI, gameAPI, employeeAPI } from '@/lib/api';
import { Project, GameState, Employee } from '@/types/game';
import Toast from '@/components/Toast';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import CountUpNumber from '@/components/CountUpNumber';

// Available job templates for freelancers
const JOB_TEMPLATES = [
  {
    title: '🎨 Landing Page',
    description: 'Create a modern landing page for a startup',
    difficulty: 2,
    estimatedReward: 200,
    time: '2-4 hours',
    requiredReputation: 0
  },
  {
    title: '💼 Business Website',
    description: 'Multi-page corporate website with CMS',
    difficulty: 3,
    estimatedReward: 500,
    time: '8-12 hours',
    requiredReputation: 10
  },
  {
    title: '🛒 E-commerce Store',
    description: 'Full-featured online store with payment',
    difficulty: 5,
    estimatedReward: 1000,
    time: '20-30 hours',
    requiredReputation: 30
  },
  {
    title: '📱 Mobile App',
    description: 'Cross-platform mobile application',
    difficulty: 6,
    estimatedReward: 1500,
    time: '30-40 hours',
    requiredReputation: 50
  },
  {
    title: '🚀 SaaS Platform',
    description: 'Subscription-based web application',
    difficulty: 8,
    estimatedReward: 2500,
    time: '50-60 hours',
    requiredReputation: 80
  },
  {
    title: '🎮 Interactive Game',
    description: 'Browser-based game with leaderboard',
    difficulty: 7,
    estimatedReward: 2000,
    time: '40-50 hours',
    requiredReputation: 65
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
    loadProducts();
    
    // Auto-refresh every 5 seconds for updates (reduced frequency to avoid rate limiting)
    const interval = setInterval(() => {
      loadProjects();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [projectsData, gameData, employeesData] = await Promise.all([
        projectAPI.getProjects(),
        gameAPI.getGameState(),
        employeeAPI.getEmployees()
      ]);
      
      setProjects(projectsData.data || []);
      setEmployees(employeesData.data || []);
      setGameState(gameData.data);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.items || []);
    } catch (e) {
      // ignore
    }
  };

  const handleLaunchProduct = async (projectId: number) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await axios.post(`${API_URL}/products/launch-from-project/${projectId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: res.data.message || 'Product launched!', type: 'success' });
      loadProducts();
      loadProjects();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || 'Failed to launch product';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleStartTemplate = async (template: any) => {
    try {
      await projectAPI.startProject(
        template.title,
        template.description,
        template.difficulty
      );
      
      setShowNewProjectModal(false);
      setSelectedTemplate(null);
      loadProjects();
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.error || 'Failed to start project', 
        type: 'error' 
      });
    }
  };

  const handleStartProject = async (projectId: number) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/projects/start`,
        { project_id: projectId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      loadProjects();
      setToast({ message: '🚀 Project started successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.error || 'Failed to start project', 
        type: 'error' 
      });
    }
  };

  const handleClaimReward = async (projectId: number) => {
    try {
      await projectAPI.claimProject(projectId);
      loadProjects();
      setToast({ message: '💰 Reward claimed successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.error || 'Failed to claim reward', 
        type: 'error' 
      });
    }
  };

  const loadAvailableJobs = async () => {
    setLoadingJobs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/projects/available`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAvailableJobs(response.data || []);
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.error || 'Failed to load available jobs', 
        type: 'error' 
      });
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleAcceptJob = async (jobId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/projects/${jobId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setToast({ message: '✅ Job accepted! Check Active Projects.', type: 'success' });
      loadProjects();
      loadAvailableJobs(); // Refresh job list
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.error || 'Failed to accept job', 
        type: 'error' 
      });
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-400';
    if (difficulty <= 4) return 'text-yellow-400';
    if (difficulty <= 6) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'queued': 'bg-gray-600 text-gray-200',
      'in_progress': 'bg-blue-600 text-white',
      'completed': 'bg-green-600 text-white',
      'failed': 'bg-red-600 text-white',
    };
    return badges[status] || badges.queued;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <Skeleton width="200px" height="40px" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Dashboard
          </button>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                📋 Projects & Jobs
              </h1>
              <p className="text-gray-400">
                Manage your freelance projects • Last update: 
                <span className="text-purple-400 ml-1 font-medium">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                setShowNewProjectModal(true);
                loadAvailableJobs();
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              🤖 Browse AI Jobs
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {gameState && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 rounded-lg p-4 shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Active Projects</p>
                  <p className="text-3xl font-bold text-purple-400">
                    <CountUpNumber value={projects.length} />
                  </p>
                </div>
                <div className="text-4xl">🔨</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-lg p-4 shadow-lg hover:shadow-green-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-400">
                    <CountUpNumber value={projects.filter(p => p.status === 'completed').length} />
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 rounded-lg p-4 shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-blue-400">
                    <CountUpNumber value={projects.filter(p => p.status === 'in_progress').length} />
                  </p>
                </div>
                <div className="text-4xl">⚡</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-500/30 rounded-lg p-4 shadow-lg hover:shadow-yellow-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Reputation</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    <CountUpNumber value={gameState.reputation || 0} />
                  </p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div>
          </div>
        )}

        {/* Active Projects */}
        {projects.length > 0 && (
          <div className="mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🔨</span>
              <span>Active Projects</span>
              <span className="text-sm text-gray-400 font-normal">({projects.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project, index) => (
                <div 
                  key={project.id} 
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-white">{project.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusBadge(project.status)} ml-3 whitespace-nowrap`}>
                      {project.status === 'in_progress' && '⚡'}
                      {project.status === 'completed' && '✅'}
                      {project.status === 'queued' && '⏱️'}
                      {project.status === 'failed' && '❌'}
                      {' '}{project.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-bold text-purple-400">{project.progress}%</span>
                    </div>
                    <div className="relative w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          project.status === 'completed' 
                            ? 'bg-gradient-to-r from-green-500 to-green-400' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Difficulty</p>
                      <p className={`text-lg font-bold ${getDifficultyColor(project.difficulty)}`}>
                        {'⭐'.repeat(Math.min(project.difficulty, 5))}
                        {project.difficulty > 5 && (
                          <span className="text-sm ml-1">×{Math.ceil(project.difficulty / 5)}</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-3 border border-green-500/30">
                      <p className="text-xs text-gray-400 mb-1">Reward</p>
                      <p className="text-lg font-bold text-green-400">
                        $<CountUpNumber value={Number(project.reward)} decimals={0} />
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-lg p-3 border border-yellow-500/30">
                      <p className="text-xs text-gray-400 mb-1">Required Rep</p>
                      <p className={`text-lg font-bold ${
                        gameState && gameState.reputation >= (project.required_reputation || 0) 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                      }`}>
                        ⭐ <CountUpNumber value={project.required_reputation || 0} decimals={0} />
                      </p>
                    </div>
                  </div>

                  {/* Assigned Employees */}
                  {(() => {
                    const assignedEmployees = employees.filter(e => e.assigned_project?.id === project.id);
                    if (assignedEmployees.length > 0) {
                      return (
                        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                          <div className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-1">
                            <span>👥</span>
                            <span>Team ({assignedEmployees.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {assignedEmployees.map(emp => (
                              <div key={emp.id} className="flex items-center gap-1.5 bg-blue-900/40 border border-blue-500/40 px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-900/60 transition-colors">
                                <span className="text-base">{emp.status_emoji}</span>
                                <span className="font-bold text-white">{emp.name}</span>
                                <span className="text-blue-300">• {emp.role}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Deadline & Action */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    {project.deadline && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>⏰</span>
                        <span>{new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {project.status === 'queued' && (
                      <>
                        {gameState && gameState.reputation >= (project.required_reputation || 0) ? (
                          <button
                            onClick={() => handleStartProject(project.id)}
                            className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-5 py-2.5 rounded-lg font-bold shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
                          >
                            🚀 Start Project
                          </button>
                        ) : (
                          <div className="ml-auto text-right">
                            <button
                              disabled
                              className="px-5 py-2.5 rounded-lg font-bold shadow-lg bg-gray-600 text-gray-400 cursor-not-allowed"
                              title={`Need ${project.required_reputation || 0} reputation (you have ${gameState?.reputation || 0})`}
                            >
                              🔒 Locked
                            </button>
                            <p className="text-xs text-red-400 mt-1">
                              Need {(project.required_reputation || 0) - (gameState?.reputation || 0)} more reputation
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {project.status === 'completed' && (
                      <div className="ml-auto flex gap-2">
                        {products.find(p => p.source_project_id === project.id) ? (
                          <span className="px-5 py-2.5 rounded-lg font-bold bg-green-900/30 text-green-400 border border-green-500/30 flex items-center gap-2">
                            ✅ Launched as Product
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLaunchProduct(project.id)}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-5 py-2.5 rounded-lg font-bold shadow-lg hover:shadow-yellow-500/50 transition-all hover:scale-105"
                            title="Convert this project into a Product"
                          >
                            📦 Launch as Product
                          </button>
                        )}
                        <button
                          onClick={() => handleClaimReward(project.id)}
                          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 px-5 py-2.5 rounded-lg font-bold shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105"
                        >
                          💰 Claim Reward
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Active Projects */}
        {projects.length === 0 && (
          <EmptyState
            icon="📋"
            title="No Active Projects"
            description="Start a new freelance project to begin earning money and reputation!"
            action={{
              label: "Browse AI Jobs",
              onClick: () => {
                setShowNewProjectModal(true);
                loadAvailableJobs();
              }
            }}
          />
        )}

        {/* Products Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">📦 Products</h2>
          {products.length === 0 ? (
            <div className="text-gray-400">No products launched yet. Convert a completed project to start earning recurring revenue.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-white">{p.name}</div>
                    <span className={`text-xs px-2 py-1 rounded ${p.active ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-300'}`}>{p.active ? 'Active' : 'Paused'}</span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">{p.description || 'No description'}</p>
                  <div className="text-sm text-gray-300">
                    <div>
                      Base Monthly Revenue: <span className="text-green-400">${Number(p.base_monthly_revenue).toLocaleString()}</span>
                    </div>
                    <div>
                      Upkeep: <span className="text-red-400">${Number(p.upkeep).toLocaleString()}</span>
                    </div>
                    <div>
                      Growth: <span className="text-blue-400">{Math.round((p.growth_rate || 0) * 100)}%/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-purple-500/20 animate-scale-in">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-sm px-6 py-5 border-b border-purple-500/30 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    🤖 AI-Generated Jobs
                    {loadingJobs && <span className="text-sm text-blue-400 animate-pulse">Loading...</span>}
                  </h2>
                  <p className="text-purple-300 text-sm">Fresh projects powered by Gemini AI • {availableJobs.length} jobs available</p>
                </div>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all hover:rotate-90 duration-300"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {availableJobs.length === 0 && !loadingJobs && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-white mb-2">No Jobs Available</h3>
                    <p className="text-gray-400 mb-6">Generate new jobs with AI Generator!</p>
                    <button
                      onClick={() => {
                        router.push('/dashboard/ai-generator');
                        setShowNewProjectModal(false);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all"
                    >
                      🤖 Go to AI Generator
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {availableJobs.map((job, index) => {
                    const isLocked = gameState && (gameState.reputation || 0) < (job.required_reputation || 0);
                    
                    return (
                      <div
                        key={job.id}
                        className={`group relative bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl transition-all duration-300 border-2 ${
                          isLocked 
                            ? 'opacity-60 border-red-500/50 hover:border-red-500' 
                            : 'border-transparent hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1'
                        } animate-slide-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Lock Badge */}
                        {isLocked && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-red-500 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                            🔒 LOCKED
                          </div>
                        )}

                        {/* AI Badge */}
                        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          🤖 AI
                        </div>

                        {/* Job Title */}
                        <div className="mb-3 mt-2">
                          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">{job.description || 'No description available'}</p>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="space-y-3 mb-4">
                          {/* Difficulty */}
                          <div className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg border border-gray-600/30">
                            <span className="text-sm text-gray-400">Difficulty</span>
                            <span className={`text-base font-bold ${getDifficultyColor(job.difficulty)}`}>
                              {'⭐'.repeat(Math.min(job.difficulty, 5))}
                              {job.difficulty > 5 && (
                                <span className="text-xs ml-1">×{Math.ceil(job.difficulty / 5)}</span>
                              )}
                            </span>
                          </div>

                          {/* Reputation */}
                          <div className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg border border-gray-600/30">
                            <span className="text-sm text-gray-400">Required Rep</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isLocked ? 'text-red-400' : 'text-green-400'}`}>
                                ⭐ {job.required_reputation || 0}
                              </span>
                              {gameState && (
                                <span className="text-xs text-gray-500">
                                  (You: {gameState.reputation || 0})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reward */}
                          <div className="p-3 bg-gradient-to-r from-green-900/30 to-green-800/20 rounded-lg border border-green-500/40">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-green-400 font-semibold">💰 Reward</span>
                              <span className="text-2xl font-bold text-green-400">
                                ${(job.reward || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) {
                              handleAcceptJob(job.id);
                            }
                          }}
                          disabled={isLocked || false}
                          className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                            isLocked
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                          }`}
                        >
                          {isLocked ? '🔒 Reputation Too Low' : '✅ Accept Job'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

