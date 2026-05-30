'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  type: 'application' | 'interview' | 'message' | 'system' | 'ai';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export function useNotifications(userId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect via Caddy gateway with XTransformPort
    const newSocket = io('/?XTransformPort=3003', {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      if (userId) {
        newSocket.emit('authenticate', userId);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.close();
    };
  }, [userId]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}
