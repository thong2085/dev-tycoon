'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gameAPI } from '@/lib/api';
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

// Page unlock requirements based on level
const PAGE_UNLOCK_LEVELS = {
  'projects': 1,
  'skills': 1,
  'shop': 1,
  'achievements': 1,
  'leaderboard': 1,
  'research': 5, // Advanced feature
  'employees': 3, // Need company first
  'company': 2, // Create company
  'products': 4, // Need employees first
  'ai-generator': 8, // Premium feature
};

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
  const [notificationCounts, setNotificationCounts] = useState<{ projects: number; achievements: number; employees: number; products: number }>({ 
    projects: 0, 
    achievements: 0, 
    employees: 0,
    products: 0,
  });

  // Get user ID for private channel
  const [userId, setUserId] = useState<number | null>(null);

  // Helper function to check if a page is unlocked
  const isPageUnlocked = (pageKey: string): boolean => {
    // Pages that depend on gameState level (early game)
    if (['projects', 'skills', 'shop', 'achievements', 'leaderboard'].includes(pageKey)) {
      if (!gameState) return false;
      return gameState.level >= PAGE_UNLOCK_LEVELS[pageKey as keyof typeof PAGE_UNLOCK_LEVELS];
    }
    
    // Pages that depend on company level (advanced game)
    // Require both gameState and company for these pages
    if (!gameState || !company) return false;
    const requiredLevel = PAGE_UNLOCK_LEVELS[pageKey as keyof typeof PAGE_UNLOCK_LEVELS];
    
    // Use company_level for company-dependent pages
    if (['employees', 'company', 'products', 'research', 'ai-generator'].includes(pageKey)) {
      return company.company_level >= requiredLevel;
    }
    
    // Fallback to gameState level
    return gameState.level >= requiredLevel;
  };

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

    // Company bankrupted
    channel.bind('company.bankrupted', (data: any) => {
      console.log('💥 Company bankrupted (realtime):', data);
      setToast({ 
        message: data.message, 
        type: 'error' 
      });
      loadGameState(); // Refresh game state to show fired employees
      loadNotificationCounts();
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

        {/* Bankruptcy Warning */}
        {company && company.cash < -5000 && (
          <div className="bg-gradient-to-r from-red-900/80 to-orange-900/80 border-2 border-red-500 p-6 rounded-xl mb-6 animate-pulse">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-4xl">🚨</div>
              <div>
                <h2 className="text-2xl font-bold text-white">⚠️ Bankruptcy Warning!</h2>
                <p className="text-gray-200 text-sm mt-1">
                  Your company is in serious financial trouble! Cash: <span className="font-bold text-red-300">${Number(company.cash).toFixed(2)}</span>
                </p>
              </div>
            </div>
            {company.cash < -10000 && (
              <div className="mt-3 p-3 bg-red-950/50 rounded-lg border border-red-500/50">
                <p className="text-red-200 text-sm">
                  💥 <strong>CRITICAL:</strong> If cash drops below <span className="font-bold text-white">-$10,000</span>, all employees will be fired!
                </p>
              </div>
            )}
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
                value={company ? Number(company.cash) : 0} 
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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-xl mb-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">⬆️</span>
            <span>Upgrades</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              const baseCostClick = 50;
              const currentLevelClick = gameState.upgrades?.click_power || 0;
              const nextCostClick = baseCostClick * Math.pow(1.15, currentLevelClick);
              const canAffordClick = company ? Number(company.cash) >= nextCostClick : false;
              
              const baseCostAuto = 100;
              const currentLevelAuto = gameState.upgrades?.auto_income || 0;
              const nextCostAuto = baseCostAuto * Math.pow(1.15, currentLevelAuto);
              const canAffordAuto = company ? Number(company.cash) >= nextCostAuto : false;
              
              return (
                <>
                  {/* Click Power Upgrade */}
                  <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 p-5 rounded-xl hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                          <span className="text-2xl">🔨</span>
                          <span>Click Power</span>
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">Increases money per click</p>
                      </div>
                      <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-bold">
                        Lv.{currentLevelClick}
                      </div>
                    </div>
                    
                    {/* Next level effect */}
                    <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Next level:</p>
                      <p className="text-green-400 font-bold">+$1.00 per click</p>
                    </div>
                    
                    <button
                      onClick={() => handleBuyUpgrade('click_power')}
                      disabled={!canAffordClick}
                      className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                        canAffordClick
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {canAffordClick ? (
                        <span>Buy for <CountUpNumber value={nextCostClick} decimals={0} prefix="$" /></span>
                      ) : (
                        <span>Need <CountUpNumber value={company ? nextCostClick - Number(company.cash) : nextCostClick} decimals={0} prefix="$" /> more</span>
                      )}
                    </button>
                  </div>

                  {/* Auto Income Upgrade */}
                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 p-5 rounded-xl hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                          <span className="text-2xl">🤖</span>
                          <span>Auto Income</span>
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">Generates passive income</p>
                      </div>
                      <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-bold">
                        Lv.{currentLevelAuto}
                      </div>
                    </div>
                    
                    {/* Next level effect */}
                    <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Next level:</p>
                      <p className="text-green-400 font-bold">+$0.50 /second</p>
                    </div>
                    
                    <button
                      onClick={() => handleBuyUpgrade('auto_income')}
                      disabled={!canAffordAuto}
                      className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                        canAffordAuto
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {canAffordAuto ? (
                        <span>Buy for <CountUpNumber value={nextCostAuto} decimals={0} prefix="$" /></span>
                      ) : (
                        <span>Need <CountUpNumber value={company ? nextCostAuto - Number(company.cash) : nextCostAuto} decimals={0} prefix="$" /> more</span>
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-4">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-blue-500 p-6 rounded-xl text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
          >
            <NotificationBadge count={notificationCounts.projects} />
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">📋</div>
            <div className="font-bold text-white group-hover:text-blue-300 transition-colors">Projects</div>
            <div className="text-xs text-gray-400 mt-1">Find Jobs</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/skills')}
            className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-yellow-500 p-6 rounded-xl text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">💡</div>
            <div className="font-bold text-white group-hover:text-yellow-300 transition-colors">Skills</div>
            <div className="text-xs text-gray-400 mt-1">Level Up</div>
          </button>

          <button
            onClick={() => {
              if (!isPageUnlocked('research')) {
                setToast({ message: `🔒 Research unlocked at Level ${PAGE_UNLOCK_LEVELS['research']}`, type: 'info' });
                return;
              }
              router.push('/dashboard/research');
            }}
            className={`group relative p-6 rounded-xl text-center transform transition-all duration-200 ${
              isPageUnlocked('research') 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-purple-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20' 
                : 'bg-gray-900 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            {!isPageUnlocked('research') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-xl z-10">
                <div className="text-5xl mb-2">🔒</div>
                <div className="text-xs text-gray-400 font-bold">Level {PAGE_UNLOCK_LEVELS['research']}</div>
              </div>
            )}
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">🔬</div>
            <div className="font-bold text-white group-hover:text-purple-300 transition-colors">Research</div>
            <div className="text-xs text-gray-400 mt-1">
              {isPageUnlocked('research') ? 'Unlock Upgrades' : `Level ${PAGE_UNLOCK_LEVELS['research']}`}
            </div>
          </button>

          <button
            onClick={() => {
              if (!isPageUnlocked('employees')) {
                setToast({ message: `🔒 Employees unlocked at Level ${PAGE_UNLOCK_LEVELS['employees']}`, type: 'info' });
                return;
              }
              router.push('/dashboard/employees');
            }}
            className={`group relative p-6 rounded-xl text-center transform transition-all duration-200 ${
              isPageUnlocked('employees') 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-green-500 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20' 
                : 'bg-gray-900 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            {isPageUnlocked('employees') && <NotificationBadge count={notificationCounts.employees} />}
            {!isPageUnlocked('employees') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-xl z-10">
                <div className="text-5xl mb-2">🔒</div>
                <div className="text-xs text-gray-400 font-bold">Level {PAGE_UNLOCK_LEVELS['employees']}</div>
              </div>
            )}
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">👥</div>
            <div className="font-bold text-white group-hover:text-green-300 transition-colors">Employees</div>
            <div className="text-xs text-gray-400 mt-1">
              {isPageUnlocked('employees') ? 'Manage Team' : `Level ${PAGE_UNLOCK_LEVELS['employees']}`}
            </div>
          </button>

          <button
            onClick={() => {
              if (!isPageUnlocked('company')) {
                setToast({ message: `🔒 Company unlocked at Level ${PAGE_UNLOCK_LEVELS['company']}`, type: 'info' });
                return;
              }
              router.push('/dashboard/company');
            }}
            className={`group relative p-6 rounded-xl text-center transform transition-all duration-200 ${
              isPageUnlocked('company') 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-indigo-500 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20' 
                : 'bg-gray-900 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            {!isPageUnlocked('company') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-xl z-10">
                <div className="text-5xl mb-2">🔒</div>
                <div className="text-xs text-gray-400 font-bold">Level {PAGE_UNLOCK_LEVELS['company']}</div>
              </div>
            )}
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">🏢</div>
            <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">Company</div>
            <div className="text-xs text-gray-400 mt-1">
              {isPageUnlocked('company') ? 'Your Business' : `Level ${PAGE_UNLOCK_LEVELS['company']}`}
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/leaderboard')}
            className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-yellow-500 p-6 rounded-xl text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">🏆</div>
            <div className="font-bold text-white group-hover:text-yellow-300 transition-colors">Leaderboard</div>
            <div className="text-xs text-gray-400 mt-1">Top Players</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/achievements')}
            className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-orange-500 p-6 rounded-xl text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20"
          >
            <NotificationBadge count={notificationCounts.achievements} />
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">🏅</div>
            <div className="font-bold text-white group-hover:text-orange-300 transition-colors">Achievements</div>
            <div className="text-xs text-gray-400 mt-1">Unlock Rewards</div>
          </button>

          <button
            onClick={() => {
              if (!isPageUnlocked('products')) {
                setToast({ message: `🔒 Products unlocked at Level ${PAGE_UNLOCK_LEVELS['products']}`, type: 'info' });
                return;
              }
              router.push('/dashboard/products');
            }}
            className={`group relative p-6 rounded-xl text-center transform transition-all duration-200 ${
              isPageUnlocked('products') 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-cyan-500 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20' 
                : 'bg-gray-900 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            {isPageUnlocked('products') && <NotificationBadge count={notificationCounts.products} />}
            {!isPageUnlocked('products') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-xl z-10">
                <div className="text-5xl mb-2">🔒</div>
                <div className="text-xs text-gray-400 font-bold">Level {PAGE_UNLOCK_LEVELS['products']}</div>
              </div>
            )}
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">📦</div>
            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">Products</div>
            <div className="text-xs text-gray-400 mt-1">
              {isPageUnlocked('products') ? 'Revenue' : `Level ${PAGE_UNLOCK_LEVELS['products']}`}
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/shop')}
            className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-pink-500 p-6 rounded-xl text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">🛒</div>
            <div className="font-bold text-white group-hover:text-pink-300 transition-colors">Shop</div>
            <div className="text-xs text-gray-400 mt-1">Buy Items</div>
          </button>

          <button
            onClick={() => {
              if (!isPageUnlocked('ai-generator')) {
                setToast({ message: `🔒 AI Generator unlocked at Level ${PAGE_UNLOCK_LEVELS['ai-generator']}`, type: 'info' });
                return;
              }
              router.push('/dashboard/ai-generator');
            }}
            className={`group relative p-6 rounded-xl text-center transform transition-all duration-200 ${
              isPageUnlocked('ai-generator') 
                ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 hover:scale-105 animate-pulse-glow shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 border border-purple-500/50' 
                : 'bg-gray-900 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            {!isPageUnlocked('ai-generator') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-xl z-10">
                <div className="text-5xl mb-2">🔒</div>
                <div className="text-xs text-gray-400 font-bold">Level {PAGE_UNLOCK_LEVELS['ai-generator']}</div>
              </div>
            )}
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">🤖</div>
            <div className="font-bold text-white">AI Generator</div>
            <div className={`text-xs mt-1 ${isPageUnlocked('ai-generator') ? 'text-blue-100 font-semibold' : 'text-gray-400'}`}>
              {isPageUnlocked('ai-generator') ? '✨ Powered by Gemini' : `Level ${PAGE_UNLOCK_LEVELS['ai-generator']}`}
            </div>
          </button>
        </div>

        {/* Prestige Button (if eligible) */}
        {gameState && company && gameState.level >= 50 && company.cash >= 1000000 && (
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

