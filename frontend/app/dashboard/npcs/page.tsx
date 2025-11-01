'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { npcAPI } from '@/lib/api';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton from '@/components/Skeleton';

interface NPC {
  id: number;
  name: string;
  role: string;
  description: string;
  personality: string;
  background: string;
  required_company_level: number;
  icon: string;
}

interface ConversationMessage {
  id: number;
  role: 'user' | 'npc';
  message: string;
  created_at: string;
}

interface NPCQuest {
  id: number;
  npc_id: number;
  quest_type: string;
  title: string;
  description: string;
  requirements: any;
  current_progress: number;
  target_progress: number;
  rewards: any;
  status: 'active' | 'completed' | 'expired';
  expires_at: string | null;
  completed_at: string | null;
  required_project?: {
    id: number;
    title: string;
    description: string;
    status: string;
    progress?: number;
  } | null;
}

export default function NPCsPage() {
  const router = useRouter();
  const [npcs, setNPCs] = useState<NPC[]>([]);
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeQuests, setActiveQuests] = useState<NPCQuest[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [requestingQuest, setRequestingQuest] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNPCs();
  }, []);

  useEffect(() => {
    if (selectedNPC) {
      loadConversation(selectedNPC.id);
      
      // Auto-refresh quest progress every 3 seconds
      const interval = setInterval(() => {
        loadConversation(selectedNPC.id);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedNPC]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadNPCs = async () => {
    setLoading(true);
    try {
      const response = await npcAPI.getNPCs();
      setNPCs(response.npcs || []);
    } catch (error: any) {
      setToast({ message: 'Failed to load NPCs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (npcId: number) => {
    setLoading(true);
    try {
      const response = await npcAPI.getConversation(npcId);
      setMessages(response.messages || []);
      setActiveQuests(response.active_quests || []);
    } catch (error: any) {
      setToast({ message: 'Failed to load conversation', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || sending || !selectedNPC) return;

    const messageToSend = inputMessage;
    setSending(true);
    setInputMessage('');

    try {
      const response = await npcAPI.sendMessage(selectedNPC.id, messageToSend);
      
      if (response.success) {
        setMessages(prev => [...prev, response.user_message, response.npc_message]);
      } else {
        setToast({ message: 'Failed to send message', type: 'error' });
        setInputMessage(messageToSend);
      }
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to send message', type: 'error' });
      setInputMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    if (!selectedNPC) return;
    
    setConfirmModal({
      title: '🗑️ Clear Conversation',
      message: `Are you sure you want to clear conversation with ${selectedNPC.name}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await npcAPI.clearConversation(selectedNPC.id);
          setMessages([]);
          setToast({ message: 'Conversation cleared', type: 'success' });
        } catch (error: any) {
          setToast({ message: 'Failed to clear conversation', type: 'error' });
        }
      }
    });
  };

  const handleRequestQuest = async () => {
    if (!selectedNPC || requestingQuest) return;
    
    setRequestingQuest(true);
    try {
      const response = await npcAPI.requestQuest(selectedNPC.id);
      
      if (response.success) {
        setToast({ message: response.message || 'Quest received!', type: 'success' });
        loadConversation(selectedNPC.id); // Reload to show quest
      } else {
        setToast({ message: response.message || 'Failed to request quest', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to request quest', type: 'error' });
    } finally {
      setRequestingQuest(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPersonalityColor = (personality: string): string => {
    switch (personality) {
      case 'friendly':
        return 'from-green-500 to-blue-500';
      case 'serious':
        return 'from-gray-600 to-gray-800';
      case 'funny':
        return 'from-yellow-500 to-orange-500';
      case 'strict':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-purple-500 to-blue-500';
    }
  };

  if (loading && !selectedNPC) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton width="250px" height="40px" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height="200px" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedNPC) {
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

            <h1 className="text-4xl font-bold text-white mb-2">👥 NPCs</h1>
            <p className="text-gray-400">
              Chat with clients, investors, mentors, and competitors!
            </p>
          </div>

          {/* NPC List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {npcs.map((npc) => (
              <button
                key={npc.id}
                onClick={() => setSelectedNPC(npc)}
                className={`bg-gradient-to-br ${getPersonalityColor(npc.personality)} rounded-xl border border-white/20 p-6 text-left hover:scale-105 transition-all group`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-6xl group-hover:scale-110 transition-transform">
                    {npc.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{npc.name}</h3>
                    <div className="text-sm opacity-80 mb-2 capitalize">
                      {npc.role}
                    </div>
                    <p className="text-sm opacity-90 line-clamp-3">
                      {npc.description}
                    </p>
                    <div className="mt-3 text-xs opacity-70">
                      Level {npc.required_company_level}+
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chat view with selected NPC
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <button
            onClick={() => setSelectedNPC(null)}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to NPCs
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{selectedNPC.icon}</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {selectedNPC.name}
                </h1>
                <p className="text-gray-400 capitalize">{selectedNPC.role} • {selectedNPC.personality}</p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Quests */}
        {activeQuests.length > 0 && (
          <div className="mb-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl border border-amber-500/50 p-4 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Active Quests
            </h3>
            <div className="space-y-3">
              {activeQuests.map((quest) => {
                const progressPercent = Math.min((quest.current_progress / quest.target_progress) * 100, 100);
                const isCompleted = quest.current_progress >= quest.target_progress;
                const questTypeIcons: { [key: string]: string } = {
                  'complete_project': '📋',
                  'hire_employee': '👥',
                  'launch_product': '🚀',
                  'reach_level': '📈',
                  'earn_money': '💰',
                  'gain_reputation': '⭐',
                };
                const questTypeIcon = questTypeIcons[quest.quest_type] || '🎯';
                
                return (
                  <div 
                    key={quest.id} 
                    className={`bg-gray-800/70 rounded-lg p-4 border-2 transition-all ${
                      isCompleted 
                        ? 'border-green-500/50 bg-green-900/20 shadow-lg shadow-green-500/20' 
                        : 'border-gray-700 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{questTypeIcon}</span>
                          <h4 className={`font-bold text-lg ${isCompleted ? 'text-green-400' : 'text-amber-400'}`}>
                            {quest.title}
                          </h4>
                          {isCompleted && (
                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full font-bold">
                              READY!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">{quest.description}</p>
                        
                        {/* Show message if quest needs project but doesn't have one */}
                        {!quest.required_project && (quest.quest_type === 'complete_project' || quest.quest_type === 'launch_product') && (
                          <div className="mb-3 p-3 bg-red-900/30 rounded-lg border border-red-700/50">
                            <p className="text-sm text-red-300 font-semibold mb-2">
                              ⚠️ Project Missing
                            </p>
                            <p className="text-xs text-red-200 mb-2">
                              This quest requires a project but one wasn't created. Click the button below to create it.
                            </p>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await npcAPI.fixQuest(quest.id);
                                  if (response.success) {
                                    setToast({ 
                                      message: response.message || 'Quest fixed! Project created.', 
                                      type: 'success' 
                                    });
                                    loadConversation(selectedNPC.id);
                                  }
                                } catch (error: any) {
                                  setToast({ 
                                    message: error.response?.data?.message || 'Failed to fix quest', 
                                    type: 'error' 
                                  });
                                }
                              }}
                              className="w-full text-xs px-3 py-2 bg-red-600/50 hover:bg-red-600 rounded-lg text-red-200 font-semibold transition-all"
                            >
                              🔧 Create Project for Quest
                            </button>
                          </div>
                        )}
                        
                        {/* Show specific project if quest requires one */}
                        {quest.required_project && (quest.quest_type === 'complete_project' || quest.quest_type === 'launch_product') && (
                          <div className="mb-3 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
                            <p className="text-sm text-blue-300 font-semibold mb-2 flex items-center gap-2">
                              <span>📋</span>
                              <span>Required Project:</span>
                            </p>
                            <p className="text-sm text-blue-200 font-bold mb-1">{quest.required_project.title}</p>
                            <p className="text-xs text-blue-400 mb-2 line-clamp-2">{quest.required_project.description}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                quest.required_project.status === 'completed'
                                  ? 'bg-green-500/20 text-green-300'
                                  : quest.required_project.status === 'in_progress'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-gray-500/20 text-gray-300'
                              }`}>
                                {quest.required_project.status === 'completed' ? '✅ Completed' : 
                                 quest.required_project.status === 'in_progress' ? '🔄 In Progress' : 
                                 '⏸️ Queued'}
                              </span>
                              {quest.required_project.progress !== undefined && (
                                <span className="text-xs text-gray-400">
                                  Progress: {Math.round(quest.required_project.progress)}%
                                </span>
                              )}
                            </div>
                            {quest.quest_type === 'launch_product' && (
                              <p className="text-xs text-yellow-300 mb-2 p-2 bg-yellow-900/20 rounded border border-yellow-700/50">
                                💡 <strong>Quest Note:</strong> Complete this project first, then launch it as a product to fulfill the quest.
                              </p>
                            )}
                            <button
                              onClick={() => window.location.href = '/dashboard/projects'}
                              className="w-full text-xs px-3 py-2 bg-blue-600/50 hover:bg-blue-600 rounded-lg text-blue-200 font-semibold transition-all"
                            >
                              🎯 Go to Projects Page →
                            </button>
                          </div>
                        )}
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-400">Progress</span>
                            <span className={`text-xs font-bold ${isCompleted ? 'text-green-400' : 'text-amber-400'}`}>
                              {quest.current_progress}/{quest.target_progress}
                            </span>
                          </div>
                          <div className="relative bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                isCompleted 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse' 
                                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                            {!isCompleted && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white drop-shadow-lg">
                                  {Math.round(progressPercent)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Rewards */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-xs font-semibold text-gray-400">Rewards:</span>
                          {quest.rewards.money && (
                            <span className="text-sm font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">
                              💰 ${Number(quest.rewards.money).toLocaleString()}
                            </span>
                          )}
                          {quest.rewards.reputation && (
                            <span className="text-sm font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                              ⭐ +{quest.rewards.reputation}
                            </span>
                          )}
                          {quest.rewards.xp && (
                            <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                              📈 +{quest.rewards.xp} XP
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const response = await npcAPI.completeQuest(quest.id);
                              if (response.success) {
                                setToast({ 
                                  message: response.message || 'Quest completed! Rewards granted! 🎉', 
                                  type: 'success' 
                                });
                                loadConversation(selectedNPC.id);
                              }
                            } catch (error: any) {
                              setToast({ 
                                message: error.response?.data?.message || 'Failed to complete quest', 
                                type: 'error' 
                              });
                            }
                          }}
                          disabled={!isCompleted}
                          className={`px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${
                            isCompleted
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 animate-pulse-glow cursor-pointer'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isCompleted ? '✅ Complete' : '⏳ In Progress'}
                        </button>
                        
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to reject this quest? You will lose the quest and its rewards.')) {
                              return;
                            }
                            try {
                              const response = await npcAPI.rejectQuest(quest.id);
                              if (response.success) {
                                setToast({ 
                                  message: response.message || 'Quest rejected.', 
                                  type: 'info' 
                                });
                                loadConversation(selectedNPC.id);
                              }
                            } catch (error: any) {
                              setToast({ 
                                message: error.response?.data?.message || 'Failed to reject quest', 
                                type: 'error' 
                              });
                            }
                          }}
                          disabled={isCompleted}
                          className={`px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${
                            !isCompleted
                              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:scale-105 cursor-pointer'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Request Quest Button */}
        {activeQuests.length === 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleRequestQuest}
              disabled={requestingQuest}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg font-bold transition-all shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {requestingQuest ? '⏳ Generating...' : '🎯 Request Quest'}
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-xl mb-4 h-[60vh] overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-8xl mb-4">{selectedNPC.icon}</div>
              <h2 className="text-2xl font-bold mb-2">Chat with {selectedNPC.name}</h2>
              <p className="text-gray-400 mb-6 max-w-md">
                {selectedNPC.description}
              </p>
              <div className="bg-gray-700/50 rounded-lg p-4 max-w-lg">
                <p className="text-sm text-gray-300 italic">"{selectedNPC.background}"</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xl">{msg.role === 'user' ? '👤' : selectedNPC.icon}</span>
                      <span className="text-xs opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedNPC.icon}</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Talk to ${selectedNPC.name}...`}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || sending}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              !inputMessage.trim() || sending
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/50'
            }`}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>

        {/* Toast & Modal */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {confirmModal && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </div>
    </div>
  );
}

