"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Waves, Sunset as SunsetIcon, Check } from "lucide-react";
import { useTheme, ScanzaTheme } from "@/context/ThemeContext";

const THEME_META: Record<ScanzaTheme, { label: string; icon: typeof Sun }> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  ocean: { label: "Ocean", icon: Waves },
  sunset: { label: "Sunset", icon: SunsetIcon },
};

export default function ThemeSwitcher() {
  const { theme, setTheme, allThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ActiveIcon = THEME_META[theme].icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="scanza-theme-switcher relative" ref={ref}>
      <button
        type="button"
        aria-label="Change theme"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="scanza-theme-switcher-trigger scanza-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-scanza-border bg-scanza-surface text-scanza-text transition-all duration-200 hover:scale-110 hover:border-scanza-primary hover:text-scanza-primary hover:shadow-scanza-card"
      >
        <ActiveIcon size={18} className="transition-transform duration-300" />
      </button>

      {open && (
        <div
          role="menu"
          className="scanza-theme-switcher-menu animate-scanza-scale-in absolute right-0 top-12 z-50 w-44 origin-top-right rounded-xl border border-scanza-border bg-scanza-surface-raised p-1.5 shadow-scanza-elevated"
        >
          {allThemes.map((t) => {
            const Meta = THEME_META[t];
            const Icon = Meta.icon;
            const isActive = t === theme;
            return (
              <button
                key={t}
                role="menuitem"
                onClick={() => {
                  setTheme(t);
                  setOpen(false);
                }}
                className={`scanza-theme-option flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 hover:bg-scanza-bg ${
                  isActive ? "text-scanza-primary font-medium" : "text-scanza-text"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{Meta.label}</span>
                {isActive && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
