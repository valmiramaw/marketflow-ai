import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'MarketFlow AI',
    template: '%s | MarketFlow AI',
  },
  description: 'KI-gesteuerte Marketing & Sales Suite – Ads, SEO, Sales Intelligence, Multi-KI',
  openGraph: {
    title: 'MarketFlow AI',
    description: 'KI-gesteuerte Marketing & Sales Suite – Ads, SEO, Sales Intelligence, Multi-KI',
    type: 'website',
    siteName: 'MarketFlow AI',
  },
  twitter: {
    card: 'summary',
    title: 'MarketFlow AI',
    description: 'KI-gesteuerte Marketing & Sales Suite',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  other: {
    'theme-color': '#3b82f6',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
