"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, UploadCloud, MessageCircleQuestion, Sparkles } from "lucide-react";
import Swal from "sweetalert2";
import "./floatingActionButton.css";

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const actions = [
    {
      label: "Upload Resume",
      icon: UploadCloud,
      onClick: () => {
        setOpen(false);
        router.push("/#upload");
      },
    },
    {
      label: "Give Feedback",
      icon: Sparkles,
      onClick: () => {
        setOpen(false);
        Swal.fire({
          title: "Share your feedback",
          input: "textarea",
          inputPlaceholder: "What can we improve?",
          confirmButtonText: "Send",
          confirmButtonColor: "#4f46e5",
          showCancelButton: true,
        });
      },
    },
    {
      label: "Contact Support",
      icon: MessageCircleQuestion,
      onClick: () => {
        setOpen(false);
        router.push("/contact");
      },
    },
  ];

  return (
    <div ref={ref} className="scanza-fab-root fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <div data-open={open} className="scanza-fab-actions flex flex-col items-end gap-3">
        {actions.map((action) => (
          <div key={action.label} className="scanza-fab-action-item flex items-center gap-3">
            <span className="scanza-fab-action-label rounded-lg border border-scanza-border bg-scanza-surface-raised px-3 py-1.5 text-xs font-medium text-scanza-text shadow-scanza-card">
              {action.label}
            </span>
            <button
              type="button"
              onClick={action.onClick}
              aria-label={action.label}
              className="scanza-fab-action-btn flex h-12 w-12 items-center justify-center rounded-full border border-scanza-border bg-scanza-surface-raised text-scanza-primary shadow-scanza-card"
            >
              <action.icon size={19} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        className="scanza-fab-main-btn relative flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gradient-to-br from-scanza-primary to-scanza-accent text-white shadow-scanza-elevated"
      >
        {!open && <span className="scanza-fab-pulse-ring" />}
        <Plus size={26} />
      </button>
    </div>
  );
}
