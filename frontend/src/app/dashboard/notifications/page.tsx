"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import axios from "@/lib/axios";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    axios.get("/api/app/notifications").then(({ data }) => setNotifications(data.data.notifications)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function markAllRead() {
    await axios.post("/api/app/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="animate-scanza-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-scanza-text">Notifications</h1>
        <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm font-medium text-scanza-primary hover:underline">
          <CheckCheck size={15} /> Mark all read
        </button>
      </div>

      {!loading && notifications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-scanza-border p-12 text-center">
          <Bell size={30} className="mx-auto mb-3 text-scanza-text-muted" />
          <p className="text-scanza-text-muted">No notifications yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`rounded-xl border p-4 ${n.isRead ? "border-scanza-border bg-scanza-surface" : "border-scanza-primary bg-scanza-primary/5"}`}>
            <p className="font-medium text-scanza-text">{n.title}</p>
            <p className="text-sm text-scanza-text-muted">{n.message}</p>
            <p className="mt-1 text-xs text-scanza-text-muted">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
