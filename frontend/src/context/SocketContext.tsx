"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

export interface ScanzaNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface SocketContextValue {
  socket: Socket | null;
  notifications: ScanzaNotification[];
  unreadCount: number;
  markAllRead: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  notifications: [],
  unreadCount: 0,
  markAllRead: () => void 0,
});

export function useSocket() {
  return useContext(SocketContext);
}

// Socket.IO needs a real WebSocket connection to main-service directly —
// Next.js rewrites only proxy plain HTTP requests, not the WS upgrade.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5002";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<ScanzaNotification[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // The access token cookie is httpOnly (not readable from JS by design),
    // so we fetch a fresh one specifically for the socket handshake.
    let cancelled = false;
    fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then(({ data }) => {
        if (cancelled || !data?.accessToken) return;
        const socket = io(SOCKET_URL, { auth: { token: data.accessToken }, withCredentials: true });
        socket.on("notification:new", (notification: ScanzaNotification) => {
          setNotifications((prev) => [notification, ...prev]);
        });
        socketRef.current = socket;
      })
      .catch(() => void 0);

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, unreadCount, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}
