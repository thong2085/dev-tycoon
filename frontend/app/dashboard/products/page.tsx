'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import CountUpNumber from '@/components/CountUpNumber';
import EmptyState from '@/components/EmptyState';

interface Product {
  id: number;
  name: string;
  description: string;
  base_monthly_revenue: number;
  upkeep: number;
  growth_rate: number;
  active: boolean;
  launched_at: string;
  stats?: {
    months_since_launch: number;
    current_monthly_revenue: number;
    net_monthly_revenue: number;
    total_upkeep: number;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; type?: 'info' | 'warning' | 'danger' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    loadProducts();
    const interval = setInterval(loadProducts, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load products:', error);
      setLoading(false);
    }
  };

  const handlePause = async (productId: number, productName: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/products/${productId}/pause`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Product paused successfully', type: 'success' });
      loadProducts();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to pause product', type: 'error' });
    }
  };

  const handleResume = async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/products/${productId}/resume`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Product resumed successfully', type: 'success' });
      loadProducts();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to resume product', type: 'error' });
    }
  };

  const handleRetire = (productId: number, productName: string) => {
    setConfirmModal({
      title: '🗑️ Retire Product',
      message: `Are you sure you want to retire "${productName}"? This action cannot be undone and will stop all revenue from this product.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.delete(`${API_URL}/products/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: res.data.message || 'Product retired successfully', type: 'success' });
          setConfirmModal(null);
          loadProducts();
        } catch (error: any) {
          setToast({ message: error.response?.data?.message || 'Failed to retire product', type: 'error' });
        }
      }
    });
  };

  const totalProjectedRevenue = products
    .filter(p => p.active && p.stats)
    .reduce((sum, p) => sum + (p.stats?.net_monthly_revenue || 0), 0);

  const totalUpkeep = products
    .filter(p => p.active)
    .reduce((sum, p) => sum + Number(p.upkeep), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton width="200px" height="40px" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="mb-8">
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
                📦 Products
              </h1>
              <p className="text-gray-400">Manage your launched products and recurring revenue</p>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/30 border border-green-500/30 px-4 py-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Projected Net/Month</div>
                <div className="text-2xl font-bold text-green-400">
                  $<CountUpNumber value={totalProjectedRevenue} decimals={0} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-900/50 to-orange-900/30 border border-red-500/30 px-4 py-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Total Upkeep</div>
                <div className="text-2xl font-bold text-red-400">
                  $<CountUpNumber value={totalUpkeep} decimals={0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                className={`bg-gradient-to-br from-gray-800 to-gray-900 border-2 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  product.active 
                    ? 'border-green-500/50 hover:border-green-500 hover:shadow-xl hover:shadow-green-500/20' 
                    : 'border-gray-700/50 opacity-75'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex-1">{product.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.active 
                      ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                      : 'bg-gray-700 text-gray-300 border border-gray-600/30'
                  }`}>
                    {product.active ? 'Active' : 'Paused'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{product.description || 'No description'}</p>

                {/* Stats */}
                {product.stats && (
                  <div className="space-y-2 mb-4 p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Monthly Revenue:</span>
                      <span className="text-green-400 font-bold">
                        $<CountUpNumber value={product.stats.current_monthly_revenue} decimals={0} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Upkeep:</span>
                      <span className="text-red-400">
                        $<CountUpNumber value={product.stats.total_upkeep} decimals={0} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Net Monthly:</span>
                      <span className={`font-bold ${
                        product.stats.net_monthly_revenue >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        $<CountUpNumber value={product.stats.net_monthly_revenue} decimals={0} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Growth:</span>
                      <span className="text-blue-400">
                        {Math.round((product.growth_rate || 0) * 100)}%/mo
                      </span>
                    </div>
                    {product.stats.months_since_launch > 0 && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
                        Running for {product.stats.months_since_launch} month{product.stats.months_since_launch !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {product.active ? (
                    <button
                      onClick={() => handlePause(product.id, product.name)}
                      className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-all hover:scale-105"
                    >
                      ⏸️ Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResume(product.id)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all hover:scale-105"
                    >
                      ▶️ Resume
                    </button>
                  )}
                  <button
                    onClick={() => handleRetire(product.id, product.name)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all hover:scale-105"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📦"
            title="No Products Launched"
            description="Convert completed projects into products to generate recurring revenue!"
            action={{
              label: "Go to Projects",
              onClick: () => router.push('/dashboard/projects')
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

