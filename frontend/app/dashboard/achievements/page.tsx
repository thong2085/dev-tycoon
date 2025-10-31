'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { achievementAPI } from '@/lib/api';
import { Achievement } from '@/types/game';
import { SkeletonCard } from '@/components/Skeleton';

export default function AchievementsPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await achievementAPI.getAchievements();
      setAchievements(data.achievements || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'money', 'level', 'projects', 'employees', 'skills', 'reputation', 'special'];
  const filteredAchievements = filter === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === filter);

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      all: '🏆', money: '💰', level: '📈', projects: '📋',
      employees: '👥', skills: '💡', reputation: '⭐', special: '✨'
    };
    return icons[cat] || '🏆';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (<SkeletonCard key={i} />))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-4">
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🏆 Achievements</h1>
          <p className="text-gray-400">Unlock achievements to earn rewards!</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-2 border-yellow-600/50 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Unlocked</div>
              <div className="text-3xl font-bold text-yellow-400">{stats.unlocked} / {stats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-2 border-green-600/50 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Completion</div>
              <div className="text-3xl font-bold text-green-400">{stats.completion_percentage}%</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-600/50 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Categories</div>
              <div className="text-3xl font-bold text-purple-400">{categories.length - 1}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                filter === cat
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-gradient-to-br ${
                achievement.is_unlocked
                  ? 'from-yellow-900/30 to-orange-900/30 border-yellow-500'
                  : 'from-gray-800 to-gray-900 border-gray-700'
              } border-2 rounded-lg p-6 transition-all hover:scale-105`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-5xl">{achievement.icon}</div>
                {achievement.is_unlocked && (
                  <div className="bg-yellow-500/20 border border-yellow-500 px-2 py-1 rounded text-xs font-bold text-yellow-400">
                    ✓ UNLOCKED
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{achievement.description}</p>

              {!achievement.is_unlocked && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-bold">{achievement.progress.toFixed(0)}%</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, achievement.progress)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 text-sm">
                {achievement.reward_money > 0 && (
                  <span className="bg-green-900/30 border border-green-500/30 px-2 py-1 rounded text-green-400">
                    💰 ${achievement.reward_money}
                  </span>
                )}
                {achievement.reward_xp > 0 && (
                  <span className="bg-blue-900/30 border border-blue-500/30 px-2 py-1 rounded text-blue-400">
                    ⚡ {achievement.reward_xp} XP
                  </span>
                )}
                {achievement.reward_prestige_points > 0 && (
                  <span className="bg-purple-900/30 border border-purple-500/30 px-2 py-1 rounded text-purple-400">
                    ✨ {achievement.reward_prestige_points} PP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

