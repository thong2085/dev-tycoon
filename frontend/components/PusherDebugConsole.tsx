'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

interface EventLog {
  id: number;
  timestamp: Date;
  event: string;
  channel: string;
  data: any;
}

export default function PusherDebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize Pusher with debug mode
    const newPusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap1',
    });

    setPusher(newPusher);

    // Connection logging
    newPusher.connection.bind('connected', () => {
      setIsConnected(true);
      addLog('System', 'connected', { message: 'Connected to Pusher' });
    });

    newPusher.connection.bind('disconnected', () => {
      setIsConnected(false);
      addLog('System', 'disconnected', { message: 'Disconnected from Pusher' });
    });

    newPusher.connection.bind('error', (err: any) => {
      setIsConnected(false);
      addLog('System', 'error', err);
    });

    // Subscribe to global-activities channel
    const channel = newPusher.subscribe('global-activities');

    // Listen to all events
    const eventNames = [
      'achievement.unlocked',
      'player.prestiged',
      'leaderboard.updated',
    ];

    eventNames.forEach((eventName) => {
      channel.bind(eventName, (data: any) => {
        addLog('global-activities', eventName, data);
      });
    });

    return () => {
      eventNames.forEach((eventName) => {
        channel.unbind(eventName);
      });
      newPusher.unsubscribe('global-activities');
      newPusher.disconnect();
    };
  }, []);

  const addLog = (channel: string, event: string, data: any) => {
    const newLog: EventLog = {
      id: Date.now(),
      timestamp: new Date(),
      channel,
      event,
      data,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testEvent = () => {
    addLog('test', 'manual-test', { message: 'This is a test event', timestamp: new Date() });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
      >
        <span>🐛</span>
        <span>Debug Console</span>
        {logs.length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {logs.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[600px] max-h-[600px] bg-gray-900 border-2 border-purple-500 rounded-lg shadow-2xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 flex items-center justify-between border-b border-purple-500">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐛</span>
          <div>
            <h3 className="font-bold text-white">Pusher Debug Console</h3>
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={testEvent}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition"
            title="Test Event"
          >
            🧪 Test
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-medium transition"
            title="Clear Logs"
          >
            🗑️ Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm font-medium transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="overflow-y-auto max-h-[500px] p-4 space-y-2 bg-black/50">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📡</div>
            <div>No events yet. Waiting for Pusher events...</div>
            <div className="text-xs mt-2">Click "Test" to send a test event</div>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-gray-800 border border-gray-700 rounded p-3 hover:border-purple-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-purple-900/50 px-2 py-1 rounded text-purple-300">
                    {log.channel}
                  </span>
                  <span className="text-xs font-mono bg-blue-900/50 px-2 py-1 rounded text-blue-300">
                    {log.event}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-auto bg-gray-900/50 p-2 rounded">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-purple-500 p-2 text-xs text-gray-400 flex items-center justify-between">
        <div>Total Events: {logs.length}</div>
        <div>Channel: global-activities</div>
      </div>
    </div>
  );
}

