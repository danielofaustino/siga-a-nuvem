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
        <header className="bg-white border-b border-slate-100">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                ☁
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900">Siga a Nuvem</p>
                <p className="text-xs text-slate-500">Regional 78 · AD Madureira</p>
              </div>
            </Link>
            <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-800">
              admin
            </Link>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
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
