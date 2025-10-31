'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

export function initPusher() {
  if (!pusherInstance) {
    pusherInstance = new Pusher('642a5ff6eee4d82268ec', {
      cluster: 'ap1',
      forceTLS: true,
    });
  }
  return pusherInstance;
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const pusher = initPusher();
    
    pusher.connection.bind('connected', () => {
      console.log('🔴 Pusher Connected!');
      setConnected(true);
    });

    const globalChannel = pusher.subscribe('global-activities');
    
    globalChannel.bind('achievement.unlocked', (data: any) => {
      console.log('🏅 Achievement Unlocked:', data);
      setNotifications(prev => [...prev, {
        type: 'achievement',
        message: `${data.user_name} unlocked ${data.achievement_icon} ${data.achievement_name}!`,
        timestamp: data.timestamp,
      }]);
      setTimeout(() => setNotifications(prev => prev.slice(1)), 5000);
    });

    globalChannel.bind('player.prestiged', (data: any) => {
      console.log('✨ Player Prestiged:', data);
      setNotifications(prev => [...prev, {
        type: 'prestige',
        message: `✨ ${data.user_name} prestiged to Level ${data.prestige_level}!`,
        timestamp: data.timestamp,
      }]);
      setTimeout(() => setNotifications(prev => prev.slice(1)), 5000);
    });

    return () => {
      globalChannel.unbind_all();
      pusher.unsubscribe('global-activities');
    };
  }, []);

  return (
    <>
      {children}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notif, i) => (
            <div key={i} className="bg-gradient-to-r from-purple-900 to-pink-900 border-2 border-purple-500 px-6 py-3 rounded-lg shadow-lg animate-slide-in">
              <div className="text-sm font-bold text-white">{notif.message}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

