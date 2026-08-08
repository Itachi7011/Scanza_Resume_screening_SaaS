import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingActionButton from "@/components/layout/FloatingActionButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });

// NOTE: replace with your real production domain after first deployment.
const SITE_URL = "https://scanza.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Scanza — AI-Powered Resume Screening & ATS Integration",
    template: "%s | Scanza",
  },
  description:
    "Scanza parses and scores resumes with a categorized skills engine, contact/location extraction, and actionable improvement suggestions — free to try, and embeddable in your hiring pipeline via API.",
  keywords: [
    "resume screening", "ATS", "resume parser", "AI resume scoring",
    "applicant tracking system", "resume analysis", "hiring software", "skill extraction",
  ],
  authors: [{ name: "Scanza" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Scanza",
    title: "Scanza — AI-Powered Resume Screening",
    description: "Parse, score, and improve resumes with categorized skill intelligence.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Scanza" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scanza — AI-Powered Resume Screening",
    description: "Parse, score, and improve resumes with categorized skill intelligence.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a10" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <FloatingActionButton />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
