'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeAPI, projectAPI } from '@/lib/api';
import { Employee, Project } from '@/types/game';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import CountUpNumber from '@/components/CountUpNumber';
import EmptyState from '@/components/EmptyState';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; type?: 'info' | 'warning' | 'danger' } | null>(null);

  const EMPLOYEE_TIERS = [
    { role: 'junior', label: '👶 Junior Developer', cost: 1000, salary: 100, productivity: 50, description: 'Fresh graduate, learning the basics' },
    { role: 'mid', label: '💼 Mid Developer', cost: 2500, salary: 250, productivity: 75, description: 'Solid experience, reliable worker' },
    { role: 'senior', label: '⭐ Senior Developer', cost: 5000, salary: 500, productivity: 100, description: 'Expert level, high productivity' },
    { role: 'lead', label: '🚀 Lead Developer', cost: 10000, salary: 1000, productivity: 125, description: 'Team leader, excellent skills' },
    { role: 'architect', label: '🏛️ Software Architect', cost: 20000, salary: 2000, productivity: 150, description: 'Top tier, architectural expertise' },
  ];

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, projectsData] = await Promise.all([
        employeeAPI.getEmployees(),
        projectAPI.getProjects()
      ]);
      
      setEmployees(employeesData.data || []);
      setProjects(projectsData.data || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async (tier: typeof EMPLOYEE_TIERS[0]) => {
    if (!newEmployeeName.trim()) {
      setToast({ message: 'Please enter employee name!', type: 'error' });
      return;
    }

    try {
      const result = await employeeAPI.hire(newEmployeeName, tier.role);
      setToast({ message: result.message || `Hired ${newEmployeeName}!`, type: 'success' });
      setShowHireModal(false);
      setNewEmployeeName('');
      loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to hire employee', type: 'error' });
    }
  };

  const handleFire = (employee: Employee) => {
    setConfirmModal({
      title: '🔥 Fire Employee',
      message: `Are you sure you want to fire ${employee.name}? This cannot be undone!`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const result = await employeeAPI.fire(employee.id);
          setToast({ message: result.message || 'Employee fired', type: 'success' });
          setConfirmModal(null);
          loadData();
        } catch (error: any) {
          setToast({ message: error.response?.data?.error || 'Failed to fire employee', type: 'error' });
        }
      }
    });
  };

  const handleAssignToProject = async (employee: Employee, projectId: number) => {
    try {
      const result = await employeeAPI.assignToProject(employee.id, projectId);
      
      if (result.success) {
        setToast({ message: result.message || 'Employee assigned!', type: 'success' });
        setShowAssignModal(false);
        setSelectedEmployee(null);
        loadData();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to assign employee';
      const needsRest = error.response?.data?.needs_rest;
      
      if (needsRest) {
        setToast({ message: errorMsg + ' Give them a break!', type: 'error' });
      } else {
        setToast({ message: errorMsg, type: 'error' });
      }
    }
  };

  const handleUnassign = async (employee: Employee) => {
    try {
      const result = await employeeAPI.unassignFromProject(employee.id);
      setToast({ message: result.message || 'Employee unassigned', type: 'success' });
      loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to unassign employee', type: 'error' });
    }
  };

  const handleRest = async (employee: Employee) => {
    try {
      const result = await employeeAPI.rest(employee.id);
      setToast({ message: result.message || 'Employee is resting', type: 'success' });
      loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to rest employee', type: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-green-400 bg-green-900/20';
      case 'idle': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-red-400 bg-red-900/20';
    }
  };

  const getMoraleColor = (morale: number) => {
    if (morale >= 80) return 'text-green-400';
    if (morale >= 50) return 'text-yellow-400';
    if (morale >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  // Explicit BG classes so Tailwind JIT keeps them (avoid dynamic replace)
  const getMoraleBgColor = (morale: number) => {
    if (morale >= 80) return 'bg-green-400';
    if (morale >= 50) return 'bg-yellow-400';
    if (morale >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getEnergyColor = (energy: number) => {
    if (energy >= 70) return 'bg-green-500';
    if (energy >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const inProgressProjects = projects.filter(p => p.status === 'in_progress');

  const teamStats = {
    totalEmployees: employees.length,
    working: employees.filter(e => e.status === 'working').length,
    idle: employees.filter(e => e.status === 'idle').length,
    avgLevel: employees.length > 0 ? (employees.reduce((sum, e) => sum + e.level, 0) / employees.length).toFixed(1) : 0,
    avgMorale: employees.length > 0 ? Math.round(employees.reduce((sum, e) => sum + e.morale, 0) / employees.length) : 0,
    needingRest: employees.filter(e => e.needs_rest).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton width="250px" height="40px" className="mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Dashboard
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                👥 Team Management
              </h1>
              <p className="text-gray-400">Build and manage your development team</p>
            </div>
            <button
              onClick={() => setShowHireModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/50 hover:scale-105"
            >
              ✨ Hire Employee
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-slide-up">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 p-4 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Total Team</div>
                <div className="text-2xl md:text-3xl font-bold text-blue-400">
                  <CountUpNumber value={teamStats.totalEmployees} />
                </div>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 p-4 rounded-lg shadow-lg hover:shadow-green-500/30 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Working</div>
                <div className="text-2xl md:text-3xl font-bold text-green-400">
                  <CountUpNumber value={teamStats.working} />
                </div>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-500/30 p-4 rounded-lg shadow-lg hover:shadow-gray-500/30 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Idle</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-400">
                  <CountUpNumber value={teamStats.idle} />
                </div>
              </div>
              <div className="text-3xl">💤</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 p-4 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Avg Level</div>
                <div className="text-2xl md:text-3xl font-bold text-purple-400">
                  <CountUpNumber value={Number(teamStats.avgLevel)} decimals={1} />
                </div>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-500/30 p-4 rounded-lg shadow-lg hover:shadow-yellow-500/30 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Avg Morale</div>
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">
                  <CountUpNumber value={teamStats.avgMorale} decimals={0} />%
                </div>
              </div>
              <div className="text-3xl">😊</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-500/30 p-4 rounded-lg shadow-lg hover:shadow-red-500/30 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Needs Rest</div>
                <div className="text-2xl md:text-3xl font-bold text-red-400">
                  <CountUpNumber value={teamStats.needingRest} />
                </div>
              </div>
              <div className="text-3xl">😴</div>
            </div>
          </div>
        </div>

        {/* Employees List */}
        {employees.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No Employees Yet"
            description="Hire your first team member to get started building your development team!"
            action={{
              label: "✨ Hire Your First Employee",
              onClick: () => setShowHireModal(true)
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 rounded-lg p-6 transition-all duration-200 hover:shadow-xl ${
                  employee.needs_rest 
                    ? 'border-red-500/50 shadow-red-500/20' 
                    : 'border-gray-700 hover:border-purple-500/50'
                }`}
              >
                {/* Employee Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{employee.name}</h3>
                      <span className="text-2xl">{employee.status_emoji}</span>
                    </div>
                    <div className="text-sm text-gray-400 capitalize">{employee.role}</div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${getStatusColor(employee.status)}`}>
                      {employee.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Level</div>
                    <div className="text-2xl font-bold text-purple-400">{employee.level}</div>
                  </div>
                </div>

                {/* Stats Bars */}
                <div className="space-y-3 mb-4">
                  {/* Energy */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">⚡ Energy</span>
                      <span className="font-bold">{employee.energy}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getEnergyColor(employee.energy)}`}
                        style={{ width: `${employee.energy}%` }}
                      />
                    </div>
                  </div>

                  {/* Morale */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">😊 Morale</span>
                      <span className={`font-bold ${getMoraleColor(employee.morale)}`}>{employee.morale}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getMoraleBgColor(employee.morale)}`}
                        style={{ width: `${employee.morale}%` }}
                      />
                    </div>
                  </div>

                  {/* XP */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">💎 Experience</span>
                      <span className="font-bold text-blue-400">{employee.experience} / {employee.xp_for_next_level}</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(employee.experience / employee.xp_for_next_level) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400 text-xs">Productivity</div>
                    <div className="font-bold text-green-400">{employee.productivity}</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400 text-xs">Effective</div>
                    <div className="font-bold text-green-400">{employee.effective_productivity?.toFixed(1)}</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400 text-xs">Salary</div>
                    <div className="font-bold text-yellow-400">${employee.salary}/mo</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400 text-xs">Projects Done</div>
                    <div className="font-bold text-blue-400">{employee.projects_completed}</div>
                  </div>
                </div>

                {/* Assigned Project */}
                {employee.assigned_project ? (
                  <div className="bg-purple-900/30 border border-purple-500/50 p-3 rounded mb-3">
                    <div className="text-xs text-gray-400 mb-1">Working on:</div>
                    <div className="font-bold text-sm text-purple-300">{employee.assigned_project.title}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${employee.assigned_project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{employee.assigned_project.progress.toFixed(0)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900/30 border border-gray-700 p-3 rounded mb-3 text-center text-sm text-gray-500">
                    No project assigned
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {employee.needs_rest ? (
                    <button
                      onClick={() => handleRest(employee)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 px-4 py-2 rounded font-bold text-sm transition-all"
                    >
                      💤 Rest
                    </button>
                  ) : employee.assigned_project ? (
                    <button
                      onClick={() => handleUnassign(employee)}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-4 py-2 rounded font-bold text-sm transition-all"
                    >
                      ❌ Unassign
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowAssignModal(true);
                      }}
                      disabled={inProgressProjects.length === 0}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-bold text-sm transition-all"
                    >
                      📋 Assign
                    </button>
                  )}
                  <button
                    onClick={() => handleFire(employee)}
                    className="bg-red-900/50 hover:bg-red-800/50 border border-red-500/50 hover:border-red-400 px-4 py-2 rounded font-bold text-sm transition-all"
                  >
                    🔥
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Hire New Employee</h2>
              <button
                onClick={() => {
                  setShowHireModal(false);
                  setNewEmployeeName('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="Enter employee name..."
              className="w-full bg-gray-900 border-2 border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 mb-6 text-white outline-none"
            />

            <div className="space-y-3">
              {EMPLOYEE_TIERS.map((tier) => (
                <div
                  key={tier.role}
                  className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-2 border-gray-700 hover:border-purple-500/50 rounded-lg p-4 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{tier.label}</div>
                      <div className="text-sm text-gray-400 mb-2">{tier.description}</div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-400">💪 {tier.productivity} productivity</span>
                        <span className="text-yellow-400">💰 ${tier.salary}/month</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleHire(tier)}
                      disabled={!newEmployeeName.trim()}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all"
                    >
                      Hire - ${tier.cost}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500 rounded-lg max-w-xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Assign {selectedEmployee.name} to Project</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedEmployee(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {inProgressProjects.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No active projects available. Start a project first!
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressProjects.map((project) => {
                  const alreadyAssigned = employees.some(
                    e => e.assigned_project?.id === project.id
                  );

                  return (
                    <div
                      key={project.id}
                      className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-2 border-gray-700 hover:border-purple-500/50 rounded-lg p-4 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-bold text-lg mb-1">{project.title}</div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-yellow-400">⭐ Difficulty {project.difficulty}</span>
                            <span className="text-green-400">💰 ${project.reward}</span>
                            <span className="text-blue-400">📊 {project.progress.toFixed(0)}%</span>
                          </div>
                          {alreadyAssigned && (
                            <div className="text-xs text-orange-400 mt-1">
                              ⚠️ Someone else is already working on this
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssignToProject(selectedEmployee, project.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3 rounded-lg font-bold transition-all"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

