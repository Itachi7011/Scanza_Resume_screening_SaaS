"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ScanSearch, ChevronUp, ArrowUp, Twitter, Linkedin, Github, Youtube,
  Mail, MapPin, Phone,
} from "lucide-react";
import "./footer.css";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Resume Analyzer", href: "/" },
      { label: "For Employers", href: "/for-employers" },
      { label: "Skill Categories", href: "/skills" },
      { label: "Pricing", href: "/pricing" },
      { label: "API & Integrations", href: "/docs" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs#api-reference" },
      { label: "Webhooks", href: "/docs#webhooks" },
      { label: "Status Page", href: "/status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Security", href: "/security" },
    ],
  },
];

const SOCIALS = [
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export default function Footer() {
  const [collapsed, setCollapsed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <footer className="scanza-footer-root relative">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 pb-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-scanza-primary to-scanza-accent text-white">
                <ScanSearch size={20} />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-scanza-text">Scanza</p>
                <p className="text-xs text-scanza-text-muted">AI-powered resume intelligence</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              data-collapsed={collapsed}
              aria-expanded={!collapsed}
              className="scanza-footer-toggle-btn scanza-focus-ring flex items-center gap-2 rounded-full border border-scanza-border bg-scanza-bg px-4 py-2 text-sm font-medium text-scanza-text hover:border-scanza-primary"
            >
              <ChevronUp size={16} />
              {collapsed ? "Expand footer" : "Collapse footer"}
            </button>
          </div>

          <div className="scanza-footer-columns grid grid-cols-2 gap-8 border-t border-scanza-border pt-8 sm:grid-cols-4" data-collapsed={collapsed}>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-scanza-text">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-scanza-text-muted transition-colors hover:text-scanza-primary">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-4 sm:mt-2 sm:border-t sm:border-scanza-border sm:pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 text-sm text-scanza-text-muted">
                  <p className="flex items-center gap-2"><Mail size={14} /> support@scanza.dev</p>
                  <p className="flex items-center gap-2"><MapPin size={14} /> Remote-first, worldwide</p>
                  <p className="flex items-center gap-2"><Phone size={14} /> +1 (555) 010-2024</p>
                </div>
                <div className="flex gap-2">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="scanza-footer-social-icon flex h-10 w-10 items-center justify-center rounded-full border border-scanza-border text-scanza-text hover:border-scanza-primary hover:text-scanza-primary"
                    >
                      <s.icon size={17} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-scanza-border pt-6 sm:flex-row">
            <p className="text-xs text-scanza-text-muted">© {new Date().getFullYear()} Scanza. All rights reserved.</p>
            <p className="text-xs text-scanza-text-muted">Built for job seekers and hiring teams alike.</p>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        className={`scanza-footer-scroll-top scanza-focus-ring fixed bottom-24 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-scanza-primary text-white shadow-scanza-elevated ${
          showScrollTop ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ArrowUp size={19} />
      </button>
    </>
  );
}
