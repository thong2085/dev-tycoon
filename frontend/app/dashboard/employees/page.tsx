'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeAPI, gameAPI } from '@/lib/api';
import { Employee, GameState } from '@/types/game';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const EMPLOYEE_TEMPLATES = [
  {
    role: 'junior',
    title: '👶 Junior Developer',
    description: 'Fresh graduate, eager to learn',
    cost: 1000,
    productivity: 50,
    salary: 100,
    icon: '🌱'
  },
  {
    role: 'mid',
    title: '👔 Mid-level Developer',
    description: 'Experienced and reliable',
    cost: 2500,
    productivity: 75,
    salary: 250,
    icon: '💼'
  },
  {
    role: 'senior',
    title: '🎖️ Senior Developer',
    description: 'Expert problem solver',
    cost: 5000,
    productivity: 100,
    salary: 500,
    icon: '⭐'
  },
  {
    role: 'lead',
    title: '👨‍💼 Tech Lead',
    description: 'Leads teams to success',
    cost: 10000,
    productivity: 125,
    salary: 1000,
    icon: '🚀'
  },
  {
    role: 'architect',
    title: '🏗️ Architect',
    description: 'Designs complex systems',
    cost: 20000,
    productivity: 150,
    salary: 2000,
    icon: '🏛️'
  },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ 
    title: string; 
    message: string; 
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [employeesData, gameData] = await Promise.all([
        employeeAPI.getEmployees(),
        gameAPI.getGameState()
      ]);

      setEmployees(employeesData.data || []);
      setGameState(gameData.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load employees:', error);
      setToast({ message: 'Failed to load employees', type: 'error' });
      setLoading(false);
    }
  };

  const handleHire = async () => {
    if (!selectedTemplate) return;
    if (!newEmployeeName.trim()) {
      setToast({ message: 'Please enter employee name', type: 'error' });
      return;
    }

    if (!gameState || Number(gameState.money) < selectedTemplate.cost) {
      setToast({ message: 'Not enough money!', type: 'error' });
      return;
    }

    setConfirmModal({
      title: '💼 Hire Employee',
      message: `Hire ${newEmployeeName} as ${selectedTemplate.title} for $${selectedTemplate.cost}? Monthly salary: $${selectedTemplate.salary}`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const response = await employeeAPI.hire(newEmployeeName, selectedTemplate.role);
          setToast({ message: response.message, type: 'success' });
          setShowHireModal(false);
          setNewEmployeeName('');
          setSelectedTemplate(null);
          loadData();
        } catch (error: any) {
          setToast({ message: error.response?.data?.error || 'Failed to hire employee', type: 'error' });
        }
      }
    });
  };

  const handleFire = async (employee: Employee) => {
    setConfirmModal({
      title: '🔥 Fire Employee',
      message: `Are you sure you want to fire ${employee.name}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const response = await employeeAPI.fire(employee.id);
          setToast({ message: response.message, type: 'info' });
          loadData();
        } catch (error: any) {
          setToast({ message: error.response?.data?.error || 'Failed to fire employee', type: 'error' });
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      working: 'bg-green-600',
      idle: 'bg-blue-600',
      quit: 'bg-red-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const getRoleIcon = (role: string) => {
    const template = EMPLOYEE_TEMPLATES.find(t => t.role === role);
    return template?.icon || '👤';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="text-2xl">Loading employees...</div>
      </div>
    );
  }

  const totalMonthlyCost = employees.reduce((sum, emp) => sum + emp.salary, 0);

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
            <h1 className="text-4xl font-bold flex items-center gap-3">
              👥 Team Management
            </h1>
            <p className="text-gray-300 mt-2">Hire and manage your development team</p>
          </div>
          
          <div className="text-right">
            <div className="bg-gray-800 px-6 py-4 rounded-lg mb-2">
              <div className="text-sm text-gray-400">Your Money</div>
              <div className="text-2xl font-bold text-green-400">
                ${gameState ? Number(gameState.money).toFixed(2) : '0.00'}
              </div>
            </div>
            <button
              onClick={() => setShowHireModal(true)}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold"
            >
              + Hire Employee
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Team Size</h3>
            <p className="text-3xl font-bold text-blue-400">{employees.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Monthly Costs</h3>
            <p className="text-3xl font-bold text-red-400">${totalMonthlyCost.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Total Productivity</h3>
            <p className="text-3xl font-bold text-green-400">
              {employees.reduce((sum, emp) => sum + (emp.effective_productivity || emp.productivity), 0)}
            </p>
          </div>
        </div>

        {/* Employees List */}
        {employees.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">👨‍💻 Your Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <div key={employee.id} className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 hover:border-purple-500 transition">
                  {/* Employee Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{getRoleIcon(employee.role)}</div>
                      <div>
                        <h3 className="text-xl font-bold">{employee.name}</h3>
                        <p className="text-sm text-gray-400 capitalize">{employee.role}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(employee.status)}`}>
                      {employee.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Productivity:</span>
                      <span className="text-green-400 font-bold">{employee.effective_productivity || employee.productivity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Skill Level:</span>
                      <span className="text-blue-400 font-bold">{'⭐'.repeat(employee.skill_level)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Salary:</span>
                      <span className="text-yellow-400 font-bold">${employee.salary}/month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Energy:</span>
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${employee.energy}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleFire(employee)}
                    className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-medium transition"
                  >
                    🔥 Fire
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-12 rounded-lg text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold mb-2">No Employees Yet</h3>
            <p className="text-gray-400 mb-6">Hire your first team member to speed up project completion!</p>
            <button
              onClick={() => setShowHireModal(true)}
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-bold"
            >
              + Hire Your First Employee
            </button>
          </div>
        )}

        {/* Hire Modal */}
        {showHireModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">💼 Hire Employee</h2>
                <button
                  onClick={() => {
                    setShowHireModal(false);
                    setSelectedTemplate(null);
                    setNewEmployeeName('');
                  }}
                  className="text-gray-400 hover:text-white text-3xl"
                >
                  ×
                </button>
              </div>

              {!selectedTemplate ? (
                <>
                  <p className="text-gray-400 mb-6">Choose employee level:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EMPLOYEE_TEMPLATES.map((template) => {
                      const canAfford = gameState && Number(gameState.money) >= template.cost;
                      
                      return (
                        <div
                          key={template.role}
                          className={`bg-gray-700 p-6 rounded-lg cursor-pointer transition ${
                            canAfford ? 'hover:bg-gray-600' : 'opacity-60 cursor-not-allowed'
                          }`}
                          onClick={() => canAfford && setSelectedTemplate(template)}
                        >
                          <div className="text-4xl mb-3">{template.icon}</div>
                          <h3 className="text-xl font-bold mb-2">{template.title}</h3>
                          <p className="text-gray-300 text-sm mb-4">{template.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Hiring Cost:</span>
                              <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                ${template.cost}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Monthly Salary:</span>
                              <span className="text-yellow-400 font-bold">${template.salary}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Productivity:</span>
                              <span className="text-blue-400 font-bold">{template.productivity}</span>
                            </div>
                          </div>

                          {!canAfford && (
                            <div className="mt-4 text-red-400 text-sm font-bold">
                              Not enough money
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div>
                  <div className="bg-gray-700 p-6 rounded-lg mb-6">
                    <div className="text-4xl mb-3">{selectedTemplate.icon}</div>
                    <h3 className="text-2xl font-bold mb-2">{selectedTemplate.title}</h3>
                    <p className="text-gray-300">{selectedTemplate.description}</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Employee Name</label>
                    <input
                      type="text"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      placeholder="Enter employee name..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setNewEmployeeName('');
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-bold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleHire}
                      disabled={!newEmployeeName.trim()}
                      className={`flex-1 py-3 rounded-lg font-bold ${
                        newEmployeeName.trim()
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-600 cursor-not-allowed'
                      }`}
                    >
                      Hire for ${selectedTemplate.cost}
                    </button>
                  </div>
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
            confirmText="Yes, proceed"
            cancelText="Cancel"
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
            type="info"
          />
        )}
      </div>
    </div>
  );
}

