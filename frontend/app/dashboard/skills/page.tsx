'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { skillsAPI, gameAPI } from '@/lib/api';
import { SkillCategory, GameState, Company } from '@/types/game';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import CountUpNumber from '@/components/CountUpNumber';

export default function SkillsPage() {
  const router = useRouter();
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

      const [skillsData, gameData] = await Promise.all([
        skillsAPI.getSkills(),
        gameAPI.getGameState()
      ]);

      setSkillCategories(skillsData.data);
      setGameState(gameData.data);
      setCompany(gameData.company);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load skills:', error);
      setLoading(false);
    }
  };

  const handleUnlockSkill = async (skillId: number, skillName: string, cost: number) => {
    if (!company || company.cash < cost) {
      setToast({ message: 'Not enough money!', type: 'error' });
      return;
    }

    setConfirmModal({
      title: '🔓 Unlock Skill',
      message: `Unlock ${skillName} for $${Number(cost).toFixed(2)}?`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const response = await skillsAPI.unlockSkill(skillId);
          setToast({ message: response.message, type: 'success' });
          loadData(); // Reload data
        } catch (error: any) {
          setToast({ message: error.response?.data?.error || 'Failed to unlock skill', type: 'error' });
        }
      }
    });
  };

  const handleUpgradeSkill = async (skillId: number, skillName: string, cost: number, currentLevel: number) => {
    if (!company || company.cash < cost) {
      setToast({ message: 'Not enough money!', type: 'error' });
      return;
    }

    setConfirmModal({
      title: '⬆️ Upgrade Skill',
      message: `Upgrade ${skillName} to level ${currentLevel + 1} for $${Number(cost).toFixed(2)}?`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const response = await skillsAPI.upgradeSkill(skillId);
          setToast({ message: response.message, type: 'success' });
          loadData(); // Reload data
        } catch (error: any) {
          setToast({ message: error.response?.data?.error || 'Failed to upgrade skill', type: 'error' });
        }
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Frontend': '🎨',
      'Backend': '⚙️',
      'Database': '🗄️',
      'Mobile': '📱',
      'DevOps': '🐳',
      'AI': '🤖',
    };
    return icons[category] || '💻';
  };

  const getFilteredCategories = () => {
    if (selectedCategory === 'All') {
      return skillCategories;
    }
    return skillCategories.filter(cat => cat.category === selectedCategory);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <Skeleton width="250px" height="40px" className="mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const categories = ['All', ...skillCategories.map(cat => cat.category)];
  const filteredCategories = getFilteredCategories();

  const totalSkills = skillCategories.reduce((sum, cat) => sum + cat.skills.length, 0);
  const unlockedSkills = skillCategories.reduce((sum, cat) => sum + cat.skills.filter(s => s.is_unlocked).length, 0);
  const totalBonusValue = skillCategories.reduce((sum, cat) => 
    sum + cat.skills.reduce((skillSum, skill) => 
      skillSum + (skill.is_unlocked ? skill.efficiency_bonus * skill.current_level * 100 : 0), 0), 0);
  const maxedSkills = skillCategories.reduce((sum, cat) => sum + cat.skills.filter(s => s.is_unlocked && s.current_level === s.max_level).length, 0);

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
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                💡 Skills & Tech Stack
              </h1>
              <p className="text-gray-400">
                Unlock and upgrade skills to boost your productivity
              </p>
            </div>
            
            {company && (
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 px-6 py-4 rounded-lg shadow-lg hover:shadow-green-500/30 transition-all">
                <div className="text-sm text-gray-400 mb-1">Your Money</div>
                <div className="text-3xl font-bold text-green-400">
                  $<CountUpNumber value={company ? Number(company.cash) : 0} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {gameState && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 rounded-lg p-4 shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Unlocked Skills</p>
                  <p className="text-3xl font-bold text-purple-400">
                    <CountUpNumber value={unlockedSkills} /> / {totalSkills}
                  </p>
                </div>
                <div className="text-4xl">🔓</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 rounded-lg p-4 shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Bonus</p>
                  <p className="text-3xl font-bold text-blue-400">
                    +<CountUpNumber value={totalBonusValue} decimals={0} />%
                  </p>
                </div>
                <div className="text-4xl">⚡</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-500/30 rounded-lg p-4 shadow-lg hover:shadow-yellow-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Maxed Skills</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    <CountUpNumber value={maxedSkills} />
                  </p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-lg p-4 shadow-lg hover:shadow-green-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Categories</p>
                  <p className="text-3xl font-bold text-green-400">
                    <CountUpNumber value={skillCategories.length} />
                  </p>
                </div>
                <div className="text-4xl">📚</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide animate-slide-up">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
              }`}
            >
              {category === 'All' ? '📚 All' : `${getCategoryIcon(category)} ${category}`}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        {filteredCategories.map((categoryData, catIndex) => (
          <div key={categoryData.category} className="mb-12 animate-slide-up" style={{ animationDelay: `${catIndex * 100}ms` }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-3xl">{getCategoryIcon(categoryData.category)}</span>
              <span>{categoryData.category}</span>
              <span className="text-sm text-gray-400 font-normal ml-2">
                ({categoryData.skills.filter(s => s.is_unlocked).length}/{categoryData.skills.length} unlocked)
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryData.skills.map((skill, skillIndex) => (
                <div
                  key={skill.id}
                  className={`group bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 animate-fade-in ${
                    skill.is_unlocked
                      ? 'border-purple-500/50 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20'
                      : 'border-gray-700/50 opacity-75 hover:border-gray-600 hover:opacity-90'
                  }`}
                  style={{ animationDelay: `${skillIndex * 50}ms` }}
                >
                  {/* Skill Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-5xl group-hover:scale-110 transition-transform">{skill.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{skill.name}</h3>
                        {skill.is_unlocked && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-sm font-semibold text-purple-400">
                              Level {skill.current_level}/{skill.max_level}
                            </div>
                            {skill.current_level === skill.max_level && (
                              <span className="text-xs bg-yellow-600/30 border border-yellow-500/50 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
                                MAX
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {skill.is_unlocked && (
                      <span className="bg-gradient-to-r from-green-600 to-green-500 px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                        ✓ UNLOCKED
                      </span>
                    )}
                    {!skill.is_unlocked && (
                      <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">
                        🔒 LOCKED
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{skill.description}</p>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Efficiency Bonus</span>
                        <span className="text-green-400 font-bold">
                          +{(skill.efficiency_bonus * 100).toFixed(0)}% / level
                        </span>
                      </div>
                    </div>
                    
                    {skill.is_unlocked && (
                      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-3 border border-purple-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-300 font-semibold">Current Total Bonus</span>
                          <span className="text-purple-400 font-bold text-lg">
                            +{(skill.efficiency_bonus * skill.current_level * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Project Types */}
                    {skill.project_types && skill.project_types.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2 font-semibold">Helps with:</div>
                        <div className="flex flex-wrap gap-2">
                          {skill.project_types.map((type: string, index: number) => (
                            <span
                              key={index}
                              className="bg-gray-700/50 border border-gray-600/50 px-2.5 py-1 rounded text-xs hover:bg-gray-600/50 transition-colors"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {!skill.is_unlocked ? (
                    (() => {
                      const hasMoney = company && company.cash >= skill.unlock_cost;
                      
                      return (
                        <button
                          onClick={() => handleUnlockSkill(skill.id, skill.name, skill.unlock_cost)}
                          className={`w-full py-3 rounded-lg font-bold transition-all ${
                            hasMoney
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!hasMoney}
                        >
                          🔓 Unlock • ${Number(skill.unlock_cost).toFixed(0)}
                        </button>
                      );
                    })()
                  ) : skill.current_level < skill.max_level && skill.upgrade_cost ? (
                    <button
                      onClick={() => handleUpgradeSkill(skill.id, skill.name, skill.upgrade_cost!, skill.current_level)}
                      className={`w-full py-3 rounded-lg font-bold transition-all ${
                        company && company.cash >= skill.upgrade_cost
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-blue-500/50 hover:scale-105'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!company || company.cash < skill.upgrade_cost}
                    >
                      ⬆️ Upgrade to Lv.{skill.current_level + 1} • ${Number(skill.upgrade_cost).toFixed(0)}
                    </button>
                  ) : (
                    <div className="w-full py-3 text-center bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-2 border-yellow-500/50 rounded-lg font-bold text-yellow-400">
                      ⭐ MAX LEVEL REACHED
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <EmptyState
            icon="💡"
            title="No Skills Found"
            description={`No skills available in ${selectedCategory} category yet. Try selecting a different category!`}
            action={{
              label: "View All Skills",
              onClick: () => setSelectedCategory('All')
            }}
          />
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
  );
}

