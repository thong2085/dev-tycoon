'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopAPI, gameAPI } from '@/lib/api';
import { ShopItem, GameState } from '@/types/game';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import CountUpNumber from '@/components/CountUpNumber';
import EmptyState from '@/components/EmptyState';

export default function ShopPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; type?: 'info' | 'warning' | 'danger' } | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, gameData] = await Promise.all([
        shopAPI.getItems(),
        gameAPI.getGameState()
      ]);
      setItems(itemsData.items || []);
      setGameState(gameData.data);
    } catch (error) {
      console.error('Failed to load shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    console.log('💰 Purchase Debug:', {
      money: gameState?.money,
      moneyType: typeof gameState?.money,
      price: item.price,
      priceType: typeof item.price,
      canAfford: Number(gameState?.money) >= Number(item.price)
    });

    if (!gameState || Number(gameState.money) < Number(item.price)) {
      setToast({ message: 'Not enough money!', type: 'error' });
      return;
    }

    setConfirmModal({
      title: `🛒 Purchase ${item.name}`,
      message: `Buy ${item.name} for $${item.price}?`,
      type: 'info',
      onConfirm: async () => {
        try {
          const result = await shopAPI.purchase(item.id);
          setToast({ message: result.message || 'Purchased successfully!', type: 'success' });
          setGameState(result.game_state);
          setConfirmModal(null);
          loadData(); // Reload items
        } catch (error: any) {
          setToast({ message: error.response?.data?.error || 'Purchase failed', type: 'error' });
        }
      }
    });
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      all: '🛒', booster: '⚡', special: '✨', permanent: '🏛️'
    };
    return icons[cat] || '🛒';
  };

  const categories = ['all', 'booster', 'special', 'permanent'];
  const filteredItems = filter === 'all' ? items : items.filter(i => i.category === filter);

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton width="200px" height="40px" className="mb-8" />
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

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                🛒 Shop
              </h1>
              <p className="text-gray-400">Purchase boosters and special items to accelerate your progress!</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/30 border border-green-500/30 px-6 py-4 rounded-lg shadow-lg hover:shadow-green-500/30 transition-all">
              <div className="text-sm text-gray-400 mb-1">Your Balance</div>
              <div className="text-3xl font-bold text-green-400">
                $<CountUpNumber value={Number(gameState.money)} />
              </div>
            </div>
          </div>
        </div>

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

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => {
              const canAfford = Number(gameState.money) >= Number(item.price);
              
              // Debug first item only
              if (index === 0) {
                console.log('🛒 Shop Item Debug:', {
                  itemName: item.name,
                  money: gameState.money,
                  moneyNumber: Number(gameState.money),
                  price: item.price,
                  priceNumber: Number(item.price),
                  canAfford
                });
              }
              
              return (
                <div 
                  key={item.id} 
                  className={`group bg-gradient-to-br from-gray-800 to-gray-900 border-2 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 animate-fade-in ${
                    canAfford 
                      ? 'border-purple-500/50 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20' 
                      : 'border-gray-700/50 opacity-75'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-300 transition-colors">{item.name}</h3>
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">{item.description}</p>
                  
                  {item.duration_minutes && (
                    <div className="mb-4 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-400">
                      ⏱️ Duration: <span className="font-bold">{item.duration_minutes} min</span>
                    </div>
                  )}

                  {!canAfford && (
                    <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
                      💰 Need ${(Number(item.price) - Number(gameState.money)).toLocaleString()} more
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="text-3xl font-bold text-green-400">
                      $<CountUpNumber value={Number(item.price)} decimals={0} />
                    </div>
                    <button 
                      onClick={() => handlePurchase(item)} 
                      disabled={!canAfford} 
                      className={`px-6 py-3 rounded-lg font-bold transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? '🛒 Buy' : '🔒 Locked'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="🛒"
            title="No Items Found"
            description={`No items available in ${filter} category. Try selecting a different category!`}
            action={{
              label: "View All Items",
              onClick: () => setFilter('all')
            }}
          />
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmModal && (
        <ConfirmModal 
          title={confirmModal.title} 
          message={confirmModal.message} 
          onConfirm={confirmModal.onConfirm} 
          onCancel={() => setConfirmModal(null)}
          type={confirmModal.type}
        />
      )}
    </div>
  );
}

