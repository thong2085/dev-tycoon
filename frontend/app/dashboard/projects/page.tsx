'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectAPI, gameAPI, employeeAPI } from '@/lib/api';
import { Project, GameState, Employee } from '@/types/game';

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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadProjects();
    
    // Auto-refresh every 3 seconds for faster updates
    const interval = setInterval(() => {
      loadProjects();
    }, 3000);

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

  const handleStartProject = async (template: any) => {
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
      alert(error.response?.data?.error || 'Failed to start project');
    }
  };

  const handleClaimReward = async (projectId: number) => {
    try {
      await projectAPI.claimProject(projectId);
      loadProjects();
      alert('💰 Reward claimed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to claim reward');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="text-2xl">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-purple-400 hover:text-purple-300 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold">📋 Projects & Jobs</h1>
            <p className="text-gray-300 mt-2">
              Freelance jobs available • 
              <span className="text-purple-400 ml-2">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold"
          >
            + New Project
          </button>
        </div>

        {/* Active Projects */}
        {projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🔨 Active Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-purple-600 h-4 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">
                        Difficulty: <span className={getDifficultyColor(project.difficulty)}>
                          {'⭐'.repeat(project.difficulty)}
                        </span>
                      </p>
                      <p className="text-lg font-bold text-green-400">
                        Reward: ${Number(project.reward).toFixed(2)}
                      </p>
                    </div>
                    
                    {project.status === 'completed' && (
                      <button
                        onClick={() => handleClaimReward(project.id)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold"
                      >
                        💰 Claim
                      </button>
                    )}
                  </div>

                  {/* Assigned Employees */}
                  {(() => {
                    const assignedEmployees = employees.filter(e => e.assigned_project?.id === project.id);
                    if (assignedEmployees.length > 0) {
                      return (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-400 mb-2">👥 Working on this:</div>
                          <div className="flex flex-wrap gap-2">
                            {assignedEmployees.map(emp => (
                              <div key={emp.id} className="flex items-center gap-1 bg-blue-900/30 border border-blue-500/30 px-2 py-1 rounded text-xs">
                                <span>{emp.status_emoji}</span>
                                <span className="font-bold">{emp.name}</span>
                                <span className="text-gray-400">({emp.role})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Deadline */}
                  {project.deadline && (
                    <p className="text-xs text-gray-500 mt-2">
                      Deadline: {new Date(project.deadline).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Active Projects */}
        {projects.length === 0 && (
          <div className="bg-gray-800 p-12 rounded-lg text-center mb-8">
            <p className="text-xl text-gray-400 mb-4">No active projects</p>
            <p className="text-gray-500 mb-6">Start a new project to begin earning!</p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-bold"
            >
              Browse Available Jobs
            </button>
          </div>
        )}

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">💼 Available Jobs</h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="text-gray-400 hover:text-white text-3xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {JOB_TEMPLATES.map((template, index) => {
                  const isLocked = gameState && (gameState.reputation || 0) < template.requiredReputation;
                  
                  return (
                    <div
                      key={index}
                      className={`bg-gray-700 p-6 rounded-lg transition ${
                        isLocked 
                          ? 'opacity-60 cursor-not-allowed border-2 border-red-500' 
                          : 'hover:bg-gray-600 cursor-pointer'
                      }`}
                      onClick={() => !isLocked && setSelectedTemplate(template)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold">{template.title}</h3>
                        {isLocked && (
                          <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold">
                            🔒 LOCKED
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4">{template.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-400">Difficulty:</span>{' '}
                          <span className={getDifficultyColor(template.difficulty)}>
                            {'⭐'.repeat(template.difficulty)}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">Time:</span>{' '}
                          <span className="text-white">{template.time}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">Required Reputation:</span>{' '}
                          <span className={isLocked ? 'text-red-400' : 'text-green-400'}>
                            ⭐ {template.requiredReputation}
                          </span>
                          {gameState && (
                            <span className="text-gray-500 ml-2">
                              (You: {gameState.reputation || 0})
                            </span>
                          )}
                        </p>
                        <p className="text-lg font-bold text-green-400">
                          ${template.estimatedReward}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) {
                            handleStartProject(template);
                          }
                        }}
                        disabled={isLocked || false}
                        className={`w-full mt-4 py-2 rounded font-bold ${
                          isLocked
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {isLocked ? '🔒 Reputation Too Low' : 'Accept Job'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

