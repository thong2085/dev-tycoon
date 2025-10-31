'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gameAPI, achievementAPI } from '@/lib/api';
import { GameState, Company, MarketEvent } from '@/types/game';
import CountUpNumber from '@/components/CountUpNumber';
import { SkeletonCard } from '@/components/Skeleton';
import ParticleEffect from '@/components/ParticleEffect';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import PusherDebugConsole from '@/components/PusherDebugConsole';
import NotificationBadge from '@/components/NotificationBadge';
import axios from 'axios';
import Pusher from 'pusher-js';

export default function Dashboard() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeEvents, setActiveEvents] = useState<MarketEvent[]>([]);
  const [offlineIncome, setOfflineIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [skillBonuses, setSkillBonuses] = useState<any>(null);
  const [clickParticle, setClickParticle] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [notificationCounts, setNotificationCounts] = useState<{ projects: number; achievements: number; employees: number }>({ 
    projects: 0, 
    achievements: 0, 
    employees: 0 
  });

  // Get user ID for private channel
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    loadGameState();
    loadNotificationCounts();
    
    // Setup auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadGameState();
      loadNotificationCounts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Get user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await axios.get(`${API_URL}/auth/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserId(response.data.id);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  // Listen for realtime notification events
  useEffect(() => {
    if (!userId) return;

    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap1',
    });

    // Subscribe to private channel (for this it's public channel for simplicity)
    const channelName = `user.${userId}`;
    const channel = pusher.subscribe(channelName);

    console.log(`📡 Subscribed to notifications channel: ${channelName}`);

    // Project completed
    channel.bind('project.completed', (data: any) => {
      console.log('🎉 Project completed (realtime):', data);
      setToast({ 
        message: `🎉 ${data.message}`, 
        type: 'success' 
      });
      loadNotificationCounts(); // Refresh counts
    });

    // Notification count updated
    channel.bind('notification.updated', (data: any) => {
      console.log('🔔 Notification updated (realtime):', data);
      setNotificationCounts(data.counts);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userId]);

  const loadGameState = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await gameAPI.getGameState();
      setGameState(data.data);
      setCompany(data.company);
      setActiveEvents(data.active_events || []);
      setSkillBonuses(data.skill_bonuses || null);
      
      if (data.offline_income > 0) {
        setOfflineIncome(data.offline_income);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load game state:', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  const loadNotificationCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${API_URL}/notifications/counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotificationCounts(response.data.counts);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleClick = async () => {
    try {
      const data = await gameAPI.click();
      
      // Trigger particle effect
      setClickParticle(prev => prev + 1);
      
      // Update game state with new values
      if (gameState) {
        setGameState({
          ...gameState,
          money: data.money,
          click_power: data.click_power,
          xp: data.xp,
          level: data.level,
        });
      }
    } catch (error) {
      console.error('Click failed:', error);
    }
  };

  const handleBuyUpgrade = async (upgradeType: string) => {
    try {
      const data = await gameAPI.buyUpgrade(upgradeType);
      
      if (data.success) {
        setGameState(data.data);
      }
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.error || 'Failed to buy upgrade', 
        type: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 space-y-4">
            <div className="h-12 w-64 bg-gray-700 rounded animate-skeleton"></div>
            <div className="h-6 w-96 bg-gray-700 rounded animate-skeleton"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl">Game state not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🧑‍💻 Dev Tycoon</h1>
          <p className="text-gray-300">{company?.name || 'Your Startup'}</p>
        </header>

        {/* Offline Income Notice */}
        {offlineIncome > 0 && (
          <div className="bg-green-600 p-4 rounded-lg mb-6">
            <p className="text-xl">
              💰 Welcome back! You earned ${Number(offlineIncome).toFixed(2)} while you were away!
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 animate-slide-up">
            <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              💰 Money
            </h3>
            <p className="text-3xl font-bold text-green-400">
              <CountUpNumber 
                value={Number(gameState.money)} 
                decimals={2} 
                prefix="$" 
              />
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              📈 Level
            </h3>
            <p className="text-3xl font-bold text-blue-400">
              <CountUpNumber value={gameState.level} />
            </p>
            <p className="text-sm text-gray-400">
              XP: <CountUpNumber value={gameState.xp} />
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              ⭐ Reputation
            </h3>
            <p className="text-3xl font-bold text-yellow-400">
              <CountUpNumber value={gameState.reputation || 0} />
            </p>
            <p className="text-sm text-gray-400">
              <CountUpNumber value={gameState.completed_projects || 0} /> projects done
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              🤖 Auto Income
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              <CountUpNumber 
                value={Number(gameState.auto_income)} 
                decimals={2} 
                prefix="$" 
                suffix="/s" 
              />
            </p>
            {skillBonuses && skillBonuses.passive_income > 0 && (
              <p className="text-sm text-green-400 mt-1">
                +<CountUpNumber 
                  value={Number(skillBonuses.passive_income)} 
                  decimals={2} 
                  prefix="$" 
                  suffix="/s from skills" 
                />
              </p>
            )}
          </div>
        </div>

        {/* Skill Bonuses Summary */}
        {skillBonuses && skillBonuses.total_skill_levels > 0 && (
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-600/50 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ⚡ Skill Bonuses Active
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Total Skill Levels</div>
                <div className="text-2xl font-bold text-yellow-400">{skillBonuses.total_skill_levels}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Click Power Bonus</div>
                <div className="text-2xl font-bold text-green-400">
                  +{(skillBonuses.click_power_bonus * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Maxed Skills</div>
                <div className="text-2xl font-bold text-purple-400">{skillBonuses.maxed_skills}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Effective Auto Income</div>
                <div className="text-2xl font-bold text-blue-400">
                  ${Number(skillBonuses.effective_auto_income).toFixed(2)}/s
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Click Button */}
        <div className="mb-8 text-center relative">
          <button
            onClick={handleClick}
            className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-10 px-20 rounded-full text-3xl transform transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl hover:shadow-purple-500/50 animate-pulse-glow group"
          >
            <span className="relative z-10 flex flex-col items-center">
              <span className="text-5xl mb-2 group-hover:animate-bounce-subtle">💻</span>
              <span>Write Code</span>
              <span className="text-sm mt-2 opacity-90">
                +<CountUpNumber 
                  value={Number(gameState.click_power)} 
                  decimals={2} 
                  prefix="$" 
                  suffix=" per click" 
                />
              </span>
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl group-hover:blur-2xl transition-all duration-200"></div>
          </button>
          <ParticleEffect 
            trigger={clickParticle} 
            text={`+$${Number(gameState.click_power).toFixed(2)}`} 
            color="text-green-400" 
          />
        </div>

        {/* Upgrades */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">⬆️ Upgrades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">🔨 Click Power</h3>
              <p className="text-sm text-gray-300 mb-3">
                Level: {gameState.upgrades?.click_power || 0}
              </p>
              <button
                onClick={() => handleBuyUpgrade('click_power')}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
              >
                Buy for $50
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">🤖 Auto Income</h3>
              <p className="text-sm text-gray-300 mb-3">
                Level: {gameState.upgrades?.auto_income || 0}
              </p>
              <button
                onClick={() => handleBuyUpgrade('auto_income')}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-medium"
              >
                Buy for $100
              </button>
            </div>
          </div>
        </div>

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <div className="bg-yellow-600 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">🎉 Active Events</h2>
            {activeEvents.map((event) => (
              <div key={event.id} className="mb-2">
                <p className="font-bold">{event.event_type}</p>
                <p className="text-sm">{event.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105 relative"
          >
            <NotificationBadge count={notificationCounts.projects} />
            <div className="text-3xl mb-2">📋</div>
            <div className="font-bold">Projects</div>
            <div className="text-xs text-gray-400 mt-1">Find Jobs</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/skills')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105"
          >
            <div className="text-3xl mb-2">💡</div>
            <div className="font-bold">Skills</div>
            <div className="text-xs text-gray-400 mt-1">Level Up</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/employees')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105 relative"
          >
            <NotificationBadge count={notificationCounts.employees} />
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold">Employees</div>
            <div className="text-xs text-gray-400 mt-1">Manage Team</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/company')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105"
          >
            <div className="text-3xl mb-2">🏢</div>
            <div className="font-bold">Company</div>
            <div className="text-xs text-gray-400 mt-1">Your Business</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/leaderboard')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-bold">Leaderboard</div>
            <div className="text-xs text-gray-400 mt-1">Top Players</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/achievements')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105 relative"
          >
            <NotificationBadge count={notificationCounts.achievements} />
            <div className="text-3xl mb-2">🏅</div>
            <div className="font-bold">Achievements</div>
            <div className="text-xs text-gray-400 mt-1">Unlock Rewards</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/products')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105"
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="font-bold">Products</div>
            <div className="text-xs text-gray-400 mt-1">Revenue</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/shop')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105"
          >
            <div className="text-3xl mb-2">🛒</div>
            <div className="font-bold">Shop</div>
            <div className="text-xs text-gray-400 mt-1">Buy Items</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/ai-generator')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 p-6 rounded-lg text-center transform transition hover:scale-105 animate-pulse-glow"
          >
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-bold">AI Generator</div>
            <div className="text-xs text-blue-100 mt-1">✨ Powered by Gemini</div>
          </button>
        </div>

        {/* Test Notification Button (for testing only) */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              // Manually check achievements to trigger notifications
              achievementAPI.checkAchievements().then((result) => {
                if (result.count > 0) {
                  setToast({ 
                    message: `🎉 Unlocked ${result.count} achievements! Check other tab for realtime notification!`, 
                    type: 'success' 
                  });
                } else {
                  setToast({ 
                    message: '💡 No new achievements yet. Play more to unlock!', 
                    type: 'info' 
                  });
                }
              }).catch(() => {
                setToast({ message: 'Failed to check achievements', type: 'error' });
              });
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-bold"
          >
            🧪 Test: Check Achievements (Realtime)
          </button>
        </div>

        {/* Prestige Button (if eligible) */}
        {gameState && gameState.level >= 50 && gameState.money >= 1000000 && (
          <div className="mt-8 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500 rounded-lg p-6 text-center animate-pulse-glow">
            <h2 className="text-2xl font-bold mb-2">✨ Prestige Available!</h2>
            <p className="text-gray-300 mb-4">Reset your progress for permanent bonuses!</p>
            <button
              onClick={() => {
                setConfirmModal({
                  title: '✨ Prestige Confirmation',
                  message: 'Are you sure? This will reset most of your progress but grant permanent bonuses!',
                  onConfirm: () => {
                    gameAPI.prestige().then(() => {
                      setToast({ message: '✨ Prestiged! Enjoy your bonuses!', type: 'success' });
                      loadGameState();
                    }).catch((err) => {
                      setToast({ 
                        message: err.response?.data?.error || 'Failed to prestige', 
                        type: 'error' 
                      });
                    });
                  }
                });
              }}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 px-8 py-3 rounded-lg font-bold text-xl shadow-lg"
            >
              ✨ PRESTIGE NOW ✨
            </button>
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

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
          type="warning"
        />
      )}

      {/* Pusher Debug Console (DEV ONLY) */}
      {process.env.NODE_ENV === 'development' && <PusherDebugConsole />}
    </div>
  );
}

