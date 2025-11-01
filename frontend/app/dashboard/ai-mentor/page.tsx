'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { chatAPI } from '@/lib/api';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Skeleton from '@/components/Skeleton';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export default function AIMentorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await chatAPI.getMessages();
      setMessages(response.messages || []);
    } catch (error: any) {
      setToast({ message: 'Failed to load conversation', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || sending) return;

    const messageToSend = inputMessage;
    setSending(true);
    setInputMessage('');

    try {
      const response = await chatAPI.sendMessage(messageToSend);
      
      if (response.success) {
        setMessages(prev => [...prev, response.user_message, response.ai_message]);
      } else {
        setToast({ message: 'Failed to send message', type: 'error' });
        setInputMessage(messageToSend); // Restore on error
      }
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to send message', type: 'error' });
      setInputMessage(messageToSend); // Restore on error
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setConfirmModal({
      title: '🗑️ Clear Conversation',
      message: 'Are you sure you want to clear all chat history? This cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await chatAPI.clearChat();
          setMessages([]);
          setToast({ message: 'Conversation cleared', type: 'success' });
        } catch (error: any) {
          setToast({ message: 'Failed to clear conversation', type: 'error' });
        }
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton width="250px" height="40px" className="mb-8" />
          <div className="space-y-4">
            <Skeleton height="80px" />
            <Skeleton height="80px" />
            <Skeleton height="80px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                🤖 AI Mentor
              </h1>
              <p className="text-gray-400">
                Get expert advice on coding, career, and team management!
              </p>
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

        {/* Chat Messages */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-xl mb-4 h-[60vh] overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-8xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold mb-2">Start a Conversation</h2>
              <p className="text-gray-400 mb-6 max-w-md">
                Ask me anything about coding, career development, team management, or game strategy!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setInputMessage("How do I scale my team?")}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm transition-colors"
                >
                  💼 Scale my team?
                </button>
                <button
                  onClick={() => setInputMessage("Best practices for hiring?")}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm transition-colors"
                >
                  🎯 Hiring tips?
                </button>
                <button
                  onClick={() => setInputMessage("How to manage burnout?")}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm transition-colors"
                >
                  ⚡ Avoid burnout?
                </button>
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
                      <span className="text-xl">{msg.role === 'user' ? '👤' : '🤖'}</span>
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
                      <span className="text-xl">🤖</span>
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
            placeholder="Ask AI Mentor anything..."
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

