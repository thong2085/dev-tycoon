'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { leaderboardAPI } from '@/lib/api';
import { LeaderboardEntry } from '@/types/game';

type Category = 'money' | 'level' | 'reputation' | 'projects';

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [category, setCategory] = useState<Category>('money');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadLeaderboard();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 10000);

    return () => clearInterval(interval);
  }, [category]);

  const loadLeaderboard = async () => {
    try {
      const data = await leaderboardAPI.getLeaderboard(category);
      setLeaderboard(data.leaderboard || []);
      setCurrentUserRank(data.current_user_rank || null);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'money': return '💰';
      case 'level': return '📈';
      case 'reputation': return '⭐';
      case 'projects': return '🎯';
    }
  };

  const getCategoryLabel = (cat: Category) => {
    switch (cat) {
      case 'money': return 'Money';
      case 'level': return 'Level';
      case 'reputation': return 'Reputation';
      case 'projects': return 'Projects Completed';
    }
  };

  const getCategoryValue = (entry: LeaderboardEntry) => {
    switch (category) {
      case 'money': return `$${Number(entry.money).toFixed(2)}`;
      case 'level': return `Level ${entry.level}`;
      case 'reputation': return `${entry.reputation} ⭐`;
      case 'projects': return `${entry.projects_completed} projects`;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500';
      case 2: return 'from-gray-400/20 to-gray-500/20 border-gray-400';
      case 3: return 'from-orange-600/20 to-orange-700/20 border-orange-600';
      default: return 'from-gray-800/50 to-gray-900/50 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🏆 Global Leaderboard</h1>
              <p className="text-gray-400">Compete with developers worldwide!</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>Last updated:</div>
              <div>{lastUpdate.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['money', 'level', 'reputation', 'projects'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                category === cat
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {getCategoryIcon(cat)} {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Current User Rank (if not in top 100) */}
        {currentUserRank && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-2 border-blue-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Your Rank</div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-blue-400">#{currentUserRank.rank}</span>
                  <div>
                    <div className="font-bold">{currentUserRank.name} (You)</div>
                    <div className="text-sm text-gray-300">{getCategoryValue(currentUserRank)}</div>
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div>💰 ${Number(currentUserRank.money).toFixed(2)}</div>
                <div>📈 Level {currentUserRank.level}</div>
                <div>⭐ {currentUserRank.reputation}</div>
                <div>🎯 {currentUserRank.projects_completed} projects</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-gray-700 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b-2 border-purple-500/50 p-4">
            <div className="grid grid-cols-12 gap-4 font-bold">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-3 text-center">{getCategoryLabel(category)}</div>
              <div className="col-span-4 text-right">Stats</div>
            </div>
          </div>

          {/* Entries */}
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="text-6xl mb-4">🏆</div>
              <div className="text-xl">No players yet!</div>
              <div className="text-sm mt-2">Be the first to climb the ranks!</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`grid grid-cols-12 gap-4 p-4 transition-all ${
                    entry.is_current_user
                      ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-l-4 border-blue-500'
                      : entry.rank <= 3
                      ? `bg-gradient-to-r ${getRankColor(entry.rank)} border-l-4`
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${
                      entry.rank <= 3 ? 'text-3xl' : 'text-gray-400'
                    }`}>
                      {getRankBadge(entry.rank)}
                    </span>
                  </div>

                  {/* Player Name */}
                  <div className="col-span-4 flex items-center">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {entry.name}
                        {entry.is_current_user && (
                          <span className="text-xs bg-blue-500/30 border border-blue-500/50 px-2 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">User #{entry.user_id}</div>
                    </div>
                  </div>

                  {/* Category Value */}
                  <div className="col-span-3 flex items-center justify-center">
                    <span className={`font-bold text-lg ${
                      entry.rank <= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {getCategoryValue(entry)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="col-span-4 flex items-center justify-end gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-gray-400">💰 ${Number(entry.money).toFixed(0)}</div>
                      <div className="text-gray-400">📈 Lv.{entry.level}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400">⭐ {entry.reputation}</div>
                      <div className="text-gray-400">🎯 {entry.projects_completed}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Rankings update in real-time as players progress</p>
          <p className="mt-1">Keep grinding to climb the ladder! 🚀</p>
        </div>
      </div>
    </div>
  );
}

