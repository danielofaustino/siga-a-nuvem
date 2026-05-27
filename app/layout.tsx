import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siga a Nuvem · Regional 78",
  description: "Eventos dos jovens da Regional 78 - AD Madureira",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Siga a Nuvem",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f3ef5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-100">
          <div className="mx-auto max-w-5xl px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group rounded-lg"
              aria-label="Página inicial"
            >
              <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-sm transition-transform group-hover:scale-105">
                ☁
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900">Siga a Nuvem</p>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Regional 78 · AD Madureira
                </p>
              </div>
            </Link>
            <Link
              href="/admin"
              className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              admin
            </Link>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-5 sm:py-6 fade-in">
          {children}
        </main>

        <footer className="border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-slate-500 text-center">
            Feito com fé pelos jovens da Regional 78 ✝
          </div>
        </footer>

        {/* registra service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
