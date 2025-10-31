'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Toast from '@/components/Toast';

type ContentType = 'project' | 'skill' | 'achievement' | 'employee-name' | 'company-name';

interface GeneratedContent {
  projects?: any[];
  skills?: any[];
  achievements?: any[];
  names?: string[];
}

export default function AIGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('project');
  const [generated, setGenerated] = useState<GeneratedContent>({});
  const [count, setCount] = useState(1);
  const [category, setCategory] = useState('any');
  const [difficulty, setDifficulty] = useState('random');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const handleGenerate = async () => {
    setLoading(true);
    setMessage('');
    setGenerated({}); // Clear previous
    
    try {
      const token = localStorage.getItem('token');
      
      let endpoint = '';
      const params: any = { count };
      
      // Handle different content types
      if (contentType === 'employee-name') {
        endpoint = `${API_URL}/ai/generate/employee-names`;
        params.role = category !== 'any' ? category : 'Software Developer';
      } else if (contentType === 'company-name') {
        endpoint = `${API_URL}/ai/generate/company-names`;
        params.style = difficulty !== 'random' ? difficulty : 'modern';
      } else {
        endpoint = `${API_URL}/ai/generate/${contentType}s`;
        if (contentType === 'project') {
          params.difficulty = difficulty;
          params.category = category;
        } else if (contentType === 'skill' || contentType === 'achievement') {
          params.category = category;
        }
      }
      
      const response = await axios.post(endpoint, params, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Handle names differently
        if (contentType === 'employee-name' || contentType === 'company-name') {
          setGenerated({ names: response.data.names });
          const message = response.data.warning 
            ? `⚠️ ${response.data.warning}` 
            : `✅ Generated ${response.data.count} ${contentType.replace('-', ' ')}(s)!`;
          setToast({ message, type: response.data.warning ? 'info' : 'success' });
        } else {
          setGenerated({ [`${contentType}s`]: response.data[`${contentType}s`] });
          const message = response.data.warning 
            ? `⚠️ ${response.data.warning}` 
            : `✅ Generated ${response.data.count} ${contentType}(s)!`;
          setToast({ message, type: response.data.warning ? 'info' : 'success' });
        }
      }
    } catch (error: any) {
      setToast({ message: `❌ Error: ${error.response?.data?.message || error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (item: any, index: number) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = `${API_URL}/ai/create/${contentType}`;
      
      // Send ALL item data to backend
      const params: any = { ...item };
      
      const response = await axios.post(endpoint, params, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Remove from generated list
        const key = `${contentType}s` as keyof GeneratedContent;
        const updated = [...(generated[key] || [])];
        updated.splice(index, 1);
        setGenerated({ ...generated, [key]: updated });
        
        setMessage(`✅ Created ${contentType}: ${item.title || item.name}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleBulkSave = async () => {
    const key = `${contentType}s` as keyof GeneratedContent;
    const items = generated[key] || [];
    
    if (items.length === 0) {
      setMessage('❌ No items to save');
      return;
    }

    setBulkSaving(true);
    setMessage(`⏳ Saving ${items.length} ${contentType}(s)...`);

    let saved = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const token = localStorage.getItem('token');
        const endpoint = `${API_URL}/ai/create/${contentType}`;
        
        // Send ALL item data to backend
        const params: any = { ...item };
        
        await axios.post(endpoint, params, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        saved++;
      } catch (error) {
        failed++;
      }
    }

    // Clear all items after bulk save
    setGenerated({ ...generated, [key]: [] });
    
    setBulkSaving(false);
    
    if (failed === 0) {
      setMessage(`✅ Successfully saved all ${saved} ${contentType}(s)!`);
    } else {
      setMessage(`⚠️ Saved ${saved}, Failed ${failed} ${contentType}(s)`);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setMessage('Testing connection...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ai/test`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessage('✅ Gemini AI connected successfully!');
      }
    } catch (error: any) {
      setMessage(`❌ Connection failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: '📋 Copied to clipboard!', type: 'success' });
  };

  const renderContent = () => {
    // Handle name generation (employee/company)
    if (contentType === 'employee-name' || contentType === 'company-name') {
      const names = generated.names || [];
      if (names.length === 0) return null;

      return (
        <>
          {/* Names Header */}
          <div className="flex items-center justify-between mt-6 mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div>
              <h3 className="text-lg font-bold text-white">Generated {names.length} {contentType === 'employee-name' ? 'Employee Names' : 'Company Names'}</h3>
              <p className="text-sm text-gray-400">Click to copy • Use in your game</p>
            </div>
            <button
              onClick={() => setGenerated({ ...generated, names: [] })}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              🗑️ Clear All
            </button>
          </div>

          {/* Names Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {names.map((name: string, index: number) => (
              <div
                key={index}
                onClick={() => copyToClipboard(name)}
                className="bg-gradient-to-br from-gray-700 to-gray-800 p-5 rounded-xl border-2 border-transparent hover:border-purple-500/50 cursor-pointer transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{contentType === 'employee-name' ? '👤' : '🏢'}</span>
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {name}
                      </h4>
                      <p className="text-xs text-gray-500 group-hover:text-purple-400 transition-colors">
                        Click to copy
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    📋
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    // Handle game content (projects, skills, achievements)
    const key = `${contentType}s` as keyof GeneratedContent;
    const items = generated[key] || [];
    
    if (items.length === 0) return null;

    return (
      <>
        {/* Bulk Actions */}
        <div className="flex items-center justify-between mt-6 mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-white">Generated {items.length} {contentType}(s)</h3>
            <p className="text-sm text-gray-400">Review and save items to your game</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setGenerated({ ...generated, [key]: [] })}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              🗑️ Clear All
            </button>
            <button
              onClick={handleBulkSave}
              disabled={bulkSaving}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              {bulkSaving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save All ({items.length})
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
        {items.map((item: any, index: number) => (
          <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.title || item.name}</span>
                </h3>
                <p className="text-gray-400 mt-2">{item.description}</p>
              </div>
              <button
                onClick={() => handleCreate(item, index)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                💾 Save
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              {contentType === 'project' && (
                <>
                  <div>
                    <span className="text-gray-500">Difficulty:</span>
                    <span className="ml-2 text-white font-medium">{item.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reward:</span>
                    <span className="ml-2 text-green-400 font-medium">${item.base_reward?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 text-blue-400 font-medium">{item.duration_hours}h</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 text-purple-400 font-medium">{item.project_type}</span>
                  </div>
                  {item.required_skills && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Skills:</span>
                      <span className="ml-2 text-yellow-400">{item.required_skills.join(', ')}</span>
                    </div>
                  )}
                </>
              )}
              
              {contentType === 'skill' && (
                <>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 text-white font-medium">{item.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unlock Cost:</span>
                    <span className="ml-2 text-green-400 font-medium">${item.base_unlock_cost?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Level:</span>
                    <span className="ml-2 text-blue-400 font-medium">{item.max_level}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Efficiency:</span>
                    <span className="ml-2 text-purple-400 font-medium">+{(item.efficiency_bonus * 100).toFixed(0)}%</span>
                  </div>
                </>
              )}
              
              {contentType === 'achievement' && (
                <>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 text-white font-medium">{item.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 text-blue-400 font-medium">{item.requirement_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Requirement:</span>
                    <span className="ml-2 text-yellow-400 font-medium">{item.requirement_value}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reward:</span>
                    <span className="ml-2 text-green-400 font-medium">${item.reward_money} + {item.reward_reputation} rep</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        </div>
      </>
    );
  };

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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="text-5xl">🤖</span>
            AI Content Generator
          </h1>
          <p className="text-blue-100">
            Powered by Google Gemini AI - Generate projects, skills, achievements, employee names, and company names!
          </p>
        </div>

        {/* Test Connection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Connection Status</h2>
              <p className="text-gray-400">Test your Gemini API connection</p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              🔌 Test Connection
            </button>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Generate Content</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value as ContentType);
                  setGenerated({});
                }}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <optgroup label="Game Content">
                  <option value="project">🎮 Projects</option>
                  <option value="skill">⚡ Skills</option>
                  <option value="achievement">🏆 Achievements</option>
                </optgroup>
                <optgroup label="Names & Ideas">
                  <option value="employee-name">👤 Employee Names</option>
                  <option value="company-name">🏢 Company Names</option>
                </optgroup>
              </select>
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Count (max 10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Category/Role */}
            {contentType !== 'company-name' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {contentType === 'employee-name' ? 'Role' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="any">Any</option>
                  {contentType === 'project' && (
                    <>
                      <option value="web">Web</option>
                      <option value="mobile">Mobile</option>
                      <option value="ai">AI/ML</option>
                      <option value="blockchain">Blockchain</option>
                      <option value="e-commerce">E-commerce</option>
                    </>
                  )}
                  {contentType === 'skill' && (
                    <>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="mobile">Mobile</option>
                      <option value="devops">DevOps</option>
                      <option value="ai">AI/ML</option>
                      <option value="design">Design</option>
                    </>
                  )}
                  {contentType === 'achievement' && (
                    <>
                      <option value="money">Money</option>
                      <option value="projects">Projects</option>
                      <option value="skills">Skills</option>
                      <option value="employees">Employees</option>
                      <option value="prestige">Prestige</option>
                      <option value="special">Special</option>
                    </>
                  )}
                  {contentType === 'employee-name' && (
                    <>
                      <option value="Software Developer">Software Developer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="QA Engineer">QA Engineer</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Difficulty (Projects) or Style (Company Names) */}
            {(contentType === 'project' || contentType === 'company-name') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {contentType === 'project' ? 'Difficulty' : 'Style'}
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {contentType === 'project' ? (
                    <>
                      <option value="random">Random</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </>
                  ) : (
                    <>
                      <option value="modern">Modern</option>
                      <option value="professional">Professional</option>
                      <option value="creative">Creative</option>
                      <option value="fun">Fun & Playful</option>
                      <option value="tech">Tech-Focused</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/50"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block mr-2">🌀</span>
                Generating...
              </>
            ) : contentType === 'employee-name' ? (
              '👤 Generate Employee Names'
            ) : contentType === 'company-name' ? (
              '🏢 Generate Company Names'
            ) : (
              '✨ Generate with AI'
            )}
          </button>
        </div>

        {/* Generated Content */}
        {renderContent()}
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

