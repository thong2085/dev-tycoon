'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import CountUpNumber from '@/components/CountUpNumber';
import EmptyState from '@/components/EmptyState';
import { productBugAPI } from '@/lib/api';

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

interface ProductBug {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  revenue_penalty: number;
  fix_cost: number;
  fix_time_minutes: number;
  status: 'active' | 'fixing' | 'fixed';
  discovered_at: string;
  fix_started_at: string | null;
  fixed_at: string | null;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [bugs, setBugs] = useState<Record<number, ProductBug[]>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; type?: 'info' | 'warning' | 'danger' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    loadProducts();
    const interval = setInterval(() => {
      loadProducts();
    }, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      loadBugs();
      const bugsInterval = setInterval(loadBugs, 5000);
      return () => clearInterval(bugsInterval);
    }
  }, [products.length]);

  const loadBugs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || products.length === 0) return;

      const bugsMap: Record<number, ProductBug[]> = {};
      for (const product of products) {
        try {
          const bugsData = await productBugAPI.getBugs(product.id);
          bugsMap[product.id] = Array.isArray(bugsData.data) ? bugsData.data : bugsData;
        } catch (error) {
          console.error(`Failed to load bugs for product ${product.id}:`, error);
        }
      }
      setBugs(bugsMap);
    } catch (error) {
      console.error('Failed to load bugs:', error);
    }
  };

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

  const launchCampaign = async (
    productId: number,
    pkg: { name: string; duration_minutes: number; revenue_multiplier: number; cost: number }
  ) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/products/${productId}/campaigns`,
        pkg,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: `📈 Launched: ${pkg.name}`, type: 'success' });
      loadProducts();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to launch campaign', type: 'error' });
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

  const handleFixBug = (bug: ProductBug) => {
    setConfirmModal({
      title: '🔧 Fix Bug',
      message: `Fix "${bug.title}"?\n\nCost: $${bug.fix_cost}\nTime: ${bug.fix_time_minutes} minutes\n\nThis will restore ${bug.revenue_penalty}% of revenue.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const result = await productBugAPI.startFix(bug.id);
          setToast({ message: result.message || 'Started fixing bug', type: 'success' });
          setConfirmModal(null);
          loadBugs();
        } catch (error: any) {
          setToast({ 
            message: error.response?.data?.message || error.response?.data?.error || 'Failed to start bug fix', 
            type: 'error' 
          });
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

                {/* Bugs Section */}
                {bugs[product.id] && bugs[product.id].length > 0 && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-red-400">🐛 Active Bugs</h4>
                      <span className="text-xs text-red-400">
                        {bugs[product.id].filter(b => b.status === 'active').length} active
                      </span>
                    </div>
                    <div className="space-y-2">
                      {bugs[product.id]
                        .filter(bug => bug.status !== 'fixed')
                        .map((bug) => (
                          <div key={bug.id} className="bg-gray-900/50 rounded p-2 border border-red-500/20">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                                    bug.severity === 'critical' ? 'bg-red-600 text-white' :
                                    bug.severity === 'high' ? 'bg-orange-600 text-white' :
                                    bug.severity === 'medium' ? 'bg-yellow-600 text-white' :
                                    'bg-blue-600 text-white'
                                  }`}>
                                    {bug.severity.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-white font-semibold">{bug.title}</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">{bug.description}</p>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-red-400">
                                    -{bug.revenue_penalty}% revenue
                                  </span>
                                  {bug.status === 'fixing' && bug.fix_started_at && (
                                    <span className="text-yellow-400">
                                      Fixing... ({Math.max(0, bug.fix_time_minutes - Math.floor((new Date().getTime() - new Date(bug.fix_started_at).getTime()) / 60000))}m left)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {bug.status === 'active' && (
                              <button
                                onClick={() => handleFixBug(bug)}
                                className="w-full mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold transition-all"
                              >
                                🔧 Fix (${bug.fix_cost} - {bug.fix_time_minutes}m)
                              </button>
                            )}
                            {bug.status === 'fixing' && (
                              <div className="mt-2 px-3 py-1.5 bg-yellow-900/30 text-yellow-400 text-xs rounded text-center">
                                Fixing in progress...
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  {/* Quick Campaigns */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => launchCampaign(product.id, { name: 'Quick Boost', duration_minutes: 60, revenue_multiplier: 1.5, cost: 500 })}
                      className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                    >
                      ⚡ 1h +50%
                    </button>
                    <button
                      onClick={() => launchCampaign(product.id, { name: 'Brand Push', duration_minutes: 240, revenue_multiplier: 1.3, cost: 1200 })}
                      className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                    >
                      📣 4h +30%
                    </button>
                    <button
                      onClick={() => launchCampaign(product.id, { name: 'Viral Attempt', duration_minutes: 1440, revenue_multiplier: 2.0, cost: 10000 })}
                      className="px-3 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                    >
                      🚀 24h x2
                    </button>
                  </div>

                  {/* Product state actions */}
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

