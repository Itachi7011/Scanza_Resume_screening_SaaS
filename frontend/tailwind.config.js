/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // All colors resolve through CSS custom properties defined per-theme
        // in globals.css (light / dark / ocean / sunset), so every component
        // that uses these tokens is automatically theme-aware — no per-theme
        // conditional classNames needed anywhere in the app.
        "scanza-bg": "rgb(var(--scanza-bg) / <alpha-value>)",
        "scanza-surface": "rgb(var(--scanza-surface) / <alpha-value>)",
        "scanza-surface-raised": "rgb(var(--scanza-surface-raised) / <alpha-value>)",
        "scanza-border": "rgb(var(--scanza-border) / <alpha-value>)",
        "scanza-text": "rgb(var(--scanza-text) / <alpha-value>)",
        "scanza-text-muted": "rgb(var(--scanza-text-muted) / <alpha-value>)",
        "scanza-primary": "rgb(var(--scanza-primary) / <alpha-value>)",
        "scanza-primary-hover": "rgb(var(--scanza-primary-hover) / <alpha-value>)",
        "scanza-accent": "rgb(var(--scanza-accent) / <alpha-value>)",
        "scanza-success": "rgb(var(--scanza-success) / <alpha-value>)",
        "scanza-warning": "rgb(var(--scanza-warning) / <alpha-value>)",
        "scanza-danger": "rgb(var(--scanza-danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "scanza-card": "1rem",
      },
      boxShadow: {
        "scanza-card": "0 4px 24px -4px rgb(var(--scanza-shadow) / 0.12)",
        "scanza-elevated": "0 12px 40px -8px rgb(var(--scanza-shadow) / 0.22)",
      },
      keyframes: {
        "scanza-fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "scanza-slide-up": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        "scanza-scale-in": { from: { opacity: 0, transform: "scale(0.95)" }, to: { opacity: 1, transform: "scale(1)" } },
      },
      animation: {
        "scanza-fade-in": "scanza-fade-in 0.4s ease-out",
        "scanza-slide-up": "scanza-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "scanza-scale-in": "scanza-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
