'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { skillsAPI, gameAPI } from '@/lib/api';
import { SkillCategory, GameState } from '@/types/game';

export default function SkillsPage() {
  const router = useRouter();
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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
      setLoading(false);
    } catch (error) {
      console.error('Failed to load skills:', error);
      setLoading(false);
    }
  };

  const handleUnlockSkill = async (skillId: number, skillName: string, cost: number) => {
    if (!gameState || gameState.money < cost) {
      alert('Not enough money!');
      return;
    }

    if (!confirm(`Unlock ${skillName} for $${cost.toFixed(2)}?`)) {
      return;
    }

    try {
      const response = await skillsAPI.unlockSkill(skillId);
      alert(response.message);
      loadData(); // Reload data
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unlock skill');
    }
  };

  const handleUpgradeSkill = async (skillId: number, skillName: string, cost: number, currentLevel: number) => {
    if (!gameState || gameState.money < cost) {
      alert('Not enough money!');
      return;
    }

    if (!confirm(`Upgrade ${skillName} to level ${currentLevel + 1} for $${cost.toFixed(2)}?`)) {
      return;
    }

    try {
      const response = await skillsAPI.upgradeSkill(skillId);
      alert(response.message);
      loadData(); // Reload data
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upgrade skill');
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="text-2xl">Loading skills...</div>
      </div>
    );
  }

  const categories = ['All', ...skillCategories.map(cat => cat.category)];
  const filteredCategories = getFilteredCategories();

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
              💡 Skills & Tech Stack
            </h1>
            <p className="text-gray-300 mt-2">
              Unlock and upgrade skills to boost your productivity
            </p>
          </div>
          
          {gameState && (
            <div className="bg-gray-800 px-6 py-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Your Money</div>
              <div className="text-3xl font-bold text-green-400">
                ${Number(gameState.money).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category === 'All' ? '📚 All' : `${getCategoryIcon(category)} ${category}`}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        {filteredCategories.map((categoryData) => (
          <div key={categoryData.category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              {getCategoryIcon(categoryData.category)} {categoryData.category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryData.skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`bg-gray-800 p-6 rounded-lg border-2 transition ${
                    skill.is_unlocked
                      ? 'border-purple-500'
                      : 'border-gray-700 opacity-75'
                  }`}
                >
                  {/* Skill Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{skill.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold">{skill.name}</h3>
                        {skill.is_unlocked && (
                          <div className="text-sm text-purple-400">
                            Level {skill.current_level}/{skill.max_level}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {skill.is_unlocked && (
                      <span className="bg-green-600 px-2 py-1 rounded text-xs font-bold">
                        ✓ UNLOCKED
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4">{skill.description}</p>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Efficiency Bonus:</span>
                      <span className="text-green-400 font-bold">
                        +{(skill.efficiency_bonus * 100).toFixed(0)}% per level
                      </span>
                    </div>
                    
                    {skill.is_unlocked && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Bonus:</span>
                        <span className="text-purple-400 font-bold">
                          +{(skill.efficiency_bonus * skill.current_level * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {/* Project Types */}
                    {skill.project_types && skill.project_types.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Helps with:</div>
                        <div className="flex flex-wrap gap-1">
                          {skill.project_types.map((type: string, index: number) => (
                            <span
                              key={index}
                              className="bg-gray-700 px-2 py-1 rounded text-xs"
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
                    <button
                      onClick={() => handleUnlockSkill(skill.id, skill.name, skill.unlock_cost)}
                      className={`w-full py-2 rounded font-bold transition ${
                        gameState && gameState.money >= skill.unlock_cost
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!gameState || gameState.money < skill.unlock_cost}
                    >
                      🔓 Unlock - ${skill.unlock_cost.toFixed(2)}
                    </button>
                  ) : skill.current_level < skill.max_level && skill.upgrade_cost ? (
                    <button
                      onClick={() => handleUpgradeSkill(skill.id, skill.name, skill.upgrade_cost!, skill.current_level)}
                      className={`w-full py-2 rounded font-bold transition ${
                        gameState && gameState.money >= skill.upgrade_cost
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!gameState || gameState.money < skill.upgrade_cost}
                    >
                      ⬆️ Upgrade - ${skill.upgrade_cost.toFixed(2)}
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center bg-gray-700 rounded font-bold text-yellow-400">
                      ⭐ MAX LEVEL
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="bg-gray-800 p-12 rounded-lg text-center">
            <p className="text-xl text-gray-400">No skills found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

