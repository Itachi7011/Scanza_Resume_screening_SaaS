"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";

interface PlatformSettings {
  maintenanceMode: boolean;
  allowNewSignups: boolean;
  freeMonthlyQuota: number;
  maxUploadSizeMb: number;
  announcementBanner: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get("/api/app/admin/settings").then(({ data }) => setSettings(data.data));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await axios.patch("/api/app/admin/settings", settings);
      Swal.fire({ icon: "success", title: "Settings saved", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Couldn't save settings" });
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>;
  }

  return (
    <div className="animate-scanza-fade-in max-w-xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-scanza-text">Platform Settings</h1>

      <div className="space-y-5 rounded-2xl border border-scanza-border bg-scanza-surface p-6">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-scanza-text">Maintenance Mode</span>
          <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} className="h-5 w-5 accent-scanza-primary" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-scanza-text">Allow New Signups</span>
          <input type="checkbox" checked={settings.allowNewSignups} onChange={(e) => setSettings({ ...settings, allowNewSignups: e.target.checked })} className="h-5 w-5 accent-scanza-primary" />
        </label>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-scanza-text">Free Plan Monthly Quota</label>
          <input
            type="number"
            value={settings.freeMonthlyQuota}
            onChange={(e) => setSettings({ ...settings, freeMonthlyQuota: Number(e.target.value) })}
            className="w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-2.5 text-sm text-scanza-text outline-none focus:border-scanza-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-scanza-text">Max Upload Size (MB)</label>
          <input
            type="number"
            value={settings.maxUploadSizeMb}
            onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: Number(e.target.value) })}
            className="w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-2.5 text-sm text-scanza-text outline-none focus:border-scanza-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-scanza-text">Announcement Banner</label>
          <textarea
            value={settings.announcementBanner ?? ""}
            onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
            placeholder="Leave blank to hide the banner"
            rows={2}
            className="w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-2.5 text-sm text-scanza-text outline-none focus:border-scanza-primary"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="scanza-focus-ring flex items-center gap-2 rounded-xl bg-scanza-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
