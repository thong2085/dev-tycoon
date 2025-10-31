'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { achievementAPI } from '@/lib/api';
import { Achievement } from '@/types/game';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import CountUpNumber from '@/components/CountUpNumber';
import EmptyState from '@/components/EmptyState';

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
          <Skeleton width="200px" height="40px" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (<SkeletonCard key={i} />))}
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

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
            🏆 Achievements
          </h1>
          <p className="text-gray-400">Unlock achievements to earn awesome rewards!</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-up">
            <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/30 border border-yellow-500/30 p-6 rounded-lg shadow-lg hover:shadow-yellow-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Unlocked</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    <CountUpNumber value={stats.unlocked} /> / {stats.total}
                  </div>
                </div>
                <div className="text-5xl">🏅</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/30 border border-green-500/30 p-6 rounded-lg shadow-lg hover:shadow-green-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Completion</div>
                  <div className="text-3xl font-bold text-green-400">
                    <CountUpNumber value={stats.completion_percentage} decimals={0} />%
                  </div>
                </div>
                <div className="text-5xl">✅</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 border border-purple-500/30 p-6 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Categories</div>
                  <div className="text-3xl font-bold text-purple-400">
                    <CountUpNumber value={categories.length - 1} />
                  </div>
                </div>
                <div className="text-5xl">📚</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide animate-slide-up">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
                filter === cat
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50 scale-105'
                  : 'bg-gray-800 hover:bg-gray-700 hover:scale-105'
              }`}
            >
              {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={`group bg-gradient-to-br ${
                  achievement.is_unlocked
                    ? 'from-yellow-900/30 to-orange-900/30 border-yellow-500/50 hover:border-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20'
                    : 'from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600'
                } border-2 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-6xl group-hover:scale-110 transition-transform ${achievement.is_unlocked ? 'animate-bounce-subtle' : ''}`}>
                    {achievement.icon}
                  </div>
                  {achievement.is_unlocked ? (
                    <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                      ✓ UNLOCKED
                    </div>
                  ) : (
                    <div className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">
                      🔒 LOCKED
                    </div>
                  )}
                </div>

                <h3 className={`text-xl font-bold mb-2 ${achievement.is_unlocked ? 'text-yellow-300' : 'text-white'} group-hover:text-purple-300 transition-colors`}>
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{achievement.description}</p>

                {!achievement.is_unlocked && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400 font-semibold">Progress</span>
                      <span className="font-bold text-purple-400">{achievement.progress.toFixed(0)}%</span>
                    </div>
                    <div className="relative bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, achievement.progress)}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  </div>
                )}

                {achievement.is_unlocked && achievement.unlocked_at && (
                  <div className="mb-4 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                    <span className="font-semibold">Unlocked:</span> {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-sm">
                  {achievement.reward_money > 0 && (
                    <span className="bg-green-900/30 border border-green-500/30 px-2.5 py-1 rounded-lg text-green-400 font-semibold">
                      💰 ${achievement.reward_money.toLocaleString()}
                    </span>
                  )}
                  {achievement.reward_xp > 0 && (
                    <span className="bg-blue-900/30 border border-blue-500/30 px-2.5 py-1 rounded-lg text-blue-400 font-semibold">
                      ⚡ {achievement.reward_xp} XP
                    </span>
                  )}
                  {achievement.reward_prestige_points > 0 && (
                    <span className="bg-purple-900/30 border border-purple-500/30 px-2.5 py-1 rounded-lg text-purple-400 font-semibold">
                      ✨ {achievement.reward_prestige_points} PP
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🏆"
            title="No Achievements Found"
            description={`No achievements in ${filter} category yet. Try selecting a different category!`}
            action={{
              label: "View All Achievements",
              onClick: () => setFilter('all')
            }}
          />
        )}
      </div>
    </div>
  );
}

