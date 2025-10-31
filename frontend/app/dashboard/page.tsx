'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gameAPI } from '@/lib/api';
import { GameState, Company, MarketEvent } from '@/types/game';

export default function Dashboard() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeEvents, setActiveEvents] = useState<MarketEvent[]>([]);
  const [offlineIncome, setOfflineIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameState();
    
    // Setup auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadGameState();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadGameState = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await gameAPI.getGameState();
      setGameState(data.game_state);
      setCompany(data.company);
      setActiveEvents(data.active_events || []);
      
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

  const handleClick = async () => {
    try {
      const data = await gameAPI.click();
      
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
        setGameState(data.game_state);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to buy upgrade');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl">Loading...</div>
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
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Money</h3>
            <p className="text-3xl font-bold text-green-400">
              ${Number(gameState.money).toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Level</h3>
            <p className="text-3xl font-bold text-blue-400">{gameState.level}</p>
            <p className="text-sm text-gray-400">XP: {gameState.xp}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Reputation</h3>
            <p className="text-3xl font-bold text-yellow-400">⭐ {gameState.reputation || 0}</p>
            <p className="text-sm text-gray-400">
              {gameState.completed_projects || 0} projects done
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Auto Income</h3>
            <p className="text-3xl font-bold text-purple-400">
              ${Number(gameState.auto_income).toFixed(2)}/s
            </p>
          </div>
        </div>

        {/* Click Button */}
        <div className="mb-8 text-center">
          <button
            onClick={handleClick}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-8 px-16 rounded-full text-2xl transform transition hover:scale-105 active:scale-95 shadow-2xl"
          >
            💻 Write Code
            <div className="text-sm mt-2">+${Number(gameState.click_power).toFixed(2)} per click</div>
          </button>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transform transition hover:scale-105"
          >
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
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center"
          >
            <div className="text-3xl mb-2">👥</div>
            <div>Employees</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/company')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center"
          >
            <div className="text-3xl mb-2">🏢</div>
            <div>Company</div>
          </button>

          <button
            onClick={() => router.push('/dashboard/leaderboard')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div>Leaderboard</div>
          </button>
        </div>
      </div>
    </div>
  );
}

