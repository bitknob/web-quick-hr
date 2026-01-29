import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeInitializer } from "@/components/theme-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quick HR - Enterprise HR Management",
  description: "Modern enterprise-level HR management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme-storage');
                  const theme = stored ? JSON.parse(stored).state?.theme : 'light';
                  const html = document.documentElement;
                  html.classList.remove('light', 'dark');
                  if (theme === 'dark') {
                    html.classList.add('dark');
                  }
                } catch (e) {
                  const html = document.documentElement;
                  html.classList.remove('light', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <ThemeInitializer />
          <ToastProvider>
            {children}
          </ToastProvider>
      </body>
    </html>
  );
}
