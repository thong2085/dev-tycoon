'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopAPI, gameAPI } from '@/lib/api';
import { ShopItem, GameState } from '@/types/game';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function ShopPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
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
    if (!gameState || gameState.money < item.price) {
      setToast({ message: 'Not enough money!', type: 'error' });
      return;
    }

    setConfirmModal({
      title: `🛒 Purchase ${item.name}`,
      message: `Buy ${item.name} for $${item.price}?`,
      onConfirm: async () => {
        try {
          const result = await shopAPI.purchase(item.id);
          setToast({ message: result.message || 'Purchased!', type: 'success' });
          setGameState(result.game_state);
          setConfirmModal(null);
        } catch (error: any) {
          setToast({ message: error.response?.data?.error || 'Purchase failed', type: 'error' });
        }
      }
    });
  };

  const categories = ['all', 'booster', 'special', 'permanent'];
  const filteredItems = filter === 'all' ? items : items.filter(i => i.category === filter);

  if (loading || !gameState) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center"><div className="text-2xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-4">← Back</button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🛒 Shop</h1>
            <p className="text-gray-400">Purchase boosters and special items!</p>
          </div>
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-600/50 px-6 py-3 rounded-lg">
            <div className="text-sm text-gray-300">Your Balance</div>
            <div className="text-2xl font-bold text-green-400">${Number(gameState.money).toFixed(2)}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-lg font-bold ${filter === cat ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-purple-500/50 rounded-lg p-6 transition-all">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{item.description}</p>
              
              {item.duration_minutes && (
                <div className="text-xs text-blue-400 mb-3">⏱️ Duration: {item.duration_minutes} min</div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-400">${Number(item.price).toFixed(2)}</div>
                <button onClick={() => handlePurchase(item)} disabled={gameState.money < item.price} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-bold">
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmModal && <ConfirmModal title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
    </div>
  );
}

