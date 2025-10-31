'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CountUpNumber from '@/components/CountUpNumber';
import { SkeletonCard } from '@/components/Skeleton';
import Toast from '@/components/Toast';

interface Company {
  id: number;
  user_id: number;
  name: string;
  company_level: number;
  cash: number | string;
  monthly_revenue: number | string;
  monthly_costs: number | string;
  employees?: any[];
  projects?: any[];
  products?: any[];
  created_at: string;
}

export default function CompanyPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCompany(response.data);
      setCompanyName(response.data.name);
      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Company not found - show create form
        setCreating(true);
        setLoading(false);
      } else {
        console.error('Failed to load company:', error);
        setToast({ message: 'Failed to load company', type: 'error' });
        setLoading(false);
      }
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setToast({ message: 'Company name is required', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/company`,
        { name: companyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCompany(response.data);
      setCreating(false);
      setToast({ message: '🎉 Company created successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to create company', type: 'error' });
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setToast({ message: 'Company name is required', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/company`,
        { name: companyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCompany(response.data);
      setEditing(false);
      setToast({ message: '✅ Company updated successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to update company', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <SkeletonCard />
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // Create Company Form
  if (creating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🏢</div>
              <h1 className="text-3xl font-bold text-white mb-2">Create Your Company</h1>
              <p className="text-gray-400">Start your software development empire!</p>
            </div>

            <form onSubmit={handleCreateCompany}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tech Innovators Inc."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02]"
              >
                🚀 Create Company
              </button>
            </form>
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  if (!company) {
    return null;
  }

  const employeeCount = company.employees?.length || 0;
  const projectCount = company.projects?.length || 0;
  const productCount = company.products?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 shadow-2xl animate-slide-in">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editing ? (
                <form onSubmit={handleUpdateCompany} className="flex gap-3">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:border-white focus:outline-none placeholder-white/60"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ✅ Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setCompanyName(company.name);
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ❌ Cancel
                  </button>
                </form>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    <span className="text-5xl">🏢</span>
                    {company.name}
                  </h1>
                  <p className="text-blue-100">
                    Level {company.company_level} Company
                  </p>
                </>
              )}
            </div>
            
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
              >
                ✏️ Edit Name
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Cash */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:shadow-2xl transition-shadow animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">💰</span>
              <span className="text-green-400 text-sm font-medium">Company Cash</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              $<CountUpNumber value={Number(company.cash)} />
            </div>
            <p className="text-gray-400 text-sm">Available funds</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:shadow-2xl transition-shadow animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">📈</span>
              <span className="text-blue-400 text-sm font-medium">Monthly Revenue</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              $<CountUpNumber value={Number(company.monthly_revenue)} />
            </div>
            <p className="text-gray-400 text-sm">Per month</p>
          </div>

          {/* Monthly Costs */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:shadow-2xl transition-shadow animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">📉</span>
              <span className="text-red-400 text-sm font-medium">Monthly Costs</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              $<CountUpNumber value={Number(company.monthly_costs)} />
            </div>
            <p className="text-gray-400 text-sm">Per month</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-r from-purple-800 to-blue-800 rounded-xl p-6 mb-6 border border-purple-600 shadow-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-200 font-medium mb-1">Net Monthly Profit</div>
              <div className="text-4xl font-bold text-white">
                $<CountUpNumber value={Number(company.monthly_revenue) - Number(company.monthly_costs)} />
              </div>
            </div>
            <div className="text-6xl">
              {Number(company.monthly_revenue) - Number(company.monthly_costs) >= 0 ? '💎' : '⚠️'}
            </div>
          </div>
        </div>

        {/* Counts Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Employees */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer animate-fade-in" style={{ animationDelay: '0.4s' }} onClick={() => router.push('/dashboard/employees')}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">👥</span>
              <span className="text-blue-400 text-sm font-medium">Employees</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              <CountUpNumber value={employeeCount} />
            </div>
            <p className="text-gray-400 text-sm">Team members</p>
          </div>

          {/* Projects */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer animate-fade-in" style={{ animationDelay: '0.5s' }} onClick={() => router.push('/dashboard/projects')}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">📋</span>
              <span className="text-purple-400 text-sm font-medium">Projects</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              <CountUpNumber value={projectCount} />
            </div>
            <p className="text-gray-400 text-sm">Active projects</p>
          </div>

          {/* Products */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors cursor-pointer animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">📦</span>
              <span className="text-green-400 text-sm font-medium">Products</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              <CountUpNumber value={productCount} />
            </div>
            <p className="text-gray-400 text-sm">Launched products</p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-gray-800 rounded-xl p-6 mt-6 border border-gray-700 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <h2 className="text-2xl font-bold text-white mb-4">📊 Company Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 text-sm mb-1">Company ID</div>
              <div className="text-white font-mono">#{company.id}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm mb-1">Company Level</div>
              <div className="text-white font-bold text-xl">Level {company.company_level}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm mb-1">Founded</div>
              <div className="text-white">{new Date(company.created_at).toLocaleDateString()}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm mb-1">Status</div>
              <div className="text-green-400 font-medium">✅ Active</div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

