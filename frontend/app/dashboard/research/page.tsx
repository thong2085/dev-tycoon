'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gameAPI, researchAPI } from '@/lib/api';
import { GameState, Company } from '@/types/game';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import CountUpNumber from '@/components/CountUpNumber';

interface Research {
  id: number;
  key: string;
  name: string;
  description: string | null;
  category: string;
  cost: number;
  required_level: number;
  effects: Record<string, number> | null;
  icon: string;
  is_unlocked: boolean;
  can_afford: boolean;
  meets_level: boolean;
  can_unlock: boolean;
  unlocked_at: string | null;
}

export default function ResearchPage() {
  const router = useRouter();
  const [researches, setResearches] = useState<Research[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyLevel, setCompanyLevel] = useState(1);
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
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [researchData, gameData] = await Promise.all([
        researchAPI.getResearches(),
        gameAPI.getGameState()
      ]);

      setResearches(researchData.items || researchData.data?.items || []);
      setCompanyLevel(researchData.company_level || researchData.data?.company_level || 1);
      setGameState(gameData.data || gameData);
      setCompany(gameData.company);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load research:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
      setLoading(false);
    }
  };

  const handleUnlock = async (research: Research) => {
    if (!research.can_unlock) return;

      setConfirmModal({
      title: `Unlock: ${research.name}`,
      message: `Spend $${Number(research.cost).toLocaleString()} to unlock this research?`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const response = await researchAPI.unlockResearch(research.id);

          if (response.success) {
            setToast({ message: response.message, type: 'success' });
            loadData(); // Refresh data
          } else {
            setToast({ message: response.message || 'Failed to unlock research', type: 'error' });
          }
        } catch (error: any) {
          console.error('Failed to unlock research:', error);
          setToast({ 
            message: error.response?.data?.message || 'Failed to unlock research', 
            type: 'error' 
          });
        }
      }
    });
  };

  const categories = ['All', 'product', 'employee', 'project', 'company'];
  const filteredResearches = selectedCategory === 'All' 
    ? researches 
    : researches.filter(r => r.category === selectedCategory);

  const unlockedCount = researches.filter(r => r.is_unlocked).length;
  const totalCount = researches.length;

  const getEffectText = (effects: Record<string, number> | null): string => {
    if (!effects) return '';
    const parts: string[] = [];
    for (const [key, value] of Object.entries(effects)) {
      if (key.includes('multiplier')) {
        parts.push(`+${(value * 100).toFixed(0)}% ${key.replace('_multiplier', '').replace('_', ' ')}`);
      } else if (key.includes('reduction')) {
        parts.push(`-${(value * 100).toFixed(0)}% ${key.replace('_reduction', '').replace('_', ' ')}`);
      } else if (key.includes('bonus')) {
        parts.push(`+${value} ${key.replace('_bonus', '').replace('_', ' ')}`);
      } else {
        parts.push(`${value > 0 ? '+' : ''}${value} ${key.replace('_', ' ')}`);
      }
    }
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
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
          <h1 className="text-4xl font-bold text-white mb-2">🔬 Research Tree</h1>
          <p className="text-gray-400">
            Unlock permanent upgrades for your company
            {unlockedCount > 0 && (
              <span className="ml-2 text-green-400">
                ({unlockedCount}/{totalCount} unlocked)
              </span>
            )}
          </p>
        </div>

        {/* Stats Bar */}
        {gameState && company && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Money:</span>
              <span className="text-yellow-400 font-bold text-xl">
                $<CountUpNumber value={Number(company.cash)} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Company Level:</span>
              <span className="text-blue-400 font-bold text-xl">
                Level {companyLevel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Unlocked:</span>
              <span className="text-green-400 font-bold text-xl">
                {unlockedCount}/{totalCount}
              </span>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Research Grid */}
        {filteredResearches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No researches available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResearches.map(research => (
              <div
                key={research.id}
                className={`bg-gray-800 rounded-lg p-6 border-2 transition-all ${
                  research.is_unlocked
                    ? 'border-green-500 bg-gray-800/50'
                    : research.can_unlock
                    ? 'border-blue-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20'
                    : 'border-gray-700 opacity-60'
                }`}
              >
                {/* Icon & Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{research.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{research.name}</h3>
                      {research.is_unlocked && (
                        <span className="text-xs text-green-400">✓ Unlocked</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {research.description && (
                  <p className="text-gray-400 mb-4 text-sm">{research.description}</p>
                )}

                {/* Effects */}
                {research.effects && Object.keys(research.effects).length > 0 && (
                  <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-green-400 text-sm font-medium">
                      {getEffectText(research.effects)}
                    </p>
                  </div>
                )}

                {/* Requirements & Cost */}
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Cost:</span>
                    <span className={`font-bold ${
                      research.can_afford ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      ${Number(research.cost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Required Level:</span>
                    <span className={`font-bold ${
                      research.meets_level ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      Level {research.required_level}
                    </span>
                  </div>
                  {research.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-purple-400 font-medium capitalize">
                        {research.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Unlock Button */}
                {!research.is_unlocked && (
                  <button
                    onClick={() => handleUnlock(research)}
                    disabled={!research.can_unlock}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      research.can_unlock
                        ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/30'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {!research.meets_level
                      ? `Requires Level ${research.required_level}`
                      : !research.can_afford
                      ? `Need $${(Number(research.cost) - Number(gameState?.money || 0)).toLocaleString()} more`
                      : 'Unlock Research'}
                  </button>
                )}

                {/* Unlocked Badge */}
                {research.is_unlocked && research.unlocked_at && (
                  <div className="text-center text-green-400 text-sm py-2">
                    Unlocked {new Date(research.unlocked_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

