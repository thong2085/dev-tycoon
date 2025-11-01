'use client';

import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';

interface PusherHookOptions {
  channel: string;
  events?: Record<string, (data: any) => void>;
}

export function usePusher({ channel, events }: PusherHookOptions) {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventsRef = useRef(events);

  // Update events ref without triggering re-render
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    // Initialize Pusher
    const newPusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap1',
    });

    setPusher(newPusher);

    // Connection events
    newPusher.connection.bind('connected', () => {
      console.log('🟢 Pusher Connected!');
      setIsConnected(true);
    });

    newPusher.connection.bind('disconnected', () => {
      console.log('🔴 Pusher Disconnected');
      setIsConnected(false);
    });

    newPusher.connection.bind('error', (err: any) => {
      console.error('❌ Pusher Error:', err);
      setIsConnected(false);
    });

    // Subscribe to channel
    const channelInstance = newPusher.subscribe(channel);

    // Bind events using ref
    if (eventsRef.current) {
      Object.entries(eventsRef.current).forEach(([eventName, handler]) => {
        channelInstance.bind(eventName, (data: any) => {
          console.log(`📡 Event received: ${eventName}`, data);
          // Use ref to get latest handler
          if (eventsRef.current && eventsRef.current[eventName]) {
            eventsRef.current[eventName](data);
          }
        });
      });
    }

    // Cleanup
    return () => {
      if (eventsRef.current) {
        Object.keys(eventsRef.current).forEach((eventName) => {
          channelInstance.unbind(eventName);
        });
      }
      newPusher.unsubscribe(channel);
      newPusher.disconnect();
    };
  }, [channel]); // Remove 'events' from dependencies

  return { pusher, isConnected };
}

