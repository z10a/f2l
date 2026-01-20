import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'منصة البث المباشر - شاهد أفضل القنوات',
  description: 'استمتع بمشاهدة أفضل القنوات والبث المباشر بجودة عالية على منصة البث المباشر العربية. قنوات إخبارية، رياضية، ترفيهية وثائقية.',
  keywords: [
    'بث مباشر',
    'لايف',
    'استرامينج',
    'قنوات عربية',
    'مشاهدة مباشرة',
    'بث حي',
    'قناة',
    'أخبار',
    'رياضة',
    'ترفيه',
    'وثائقي',
    'أفلام',
    'مسلسلات',
    'HD',
    '4K',
  ],
  openGraph: {
    title: 'منصة البث المباشر - شاهد أفضل القنوات',
    description: 'استمتع بمشاهدة أفضل القنوات والبث المباشر بجودة عالية',
    type: 'website',
    locale: 'ar_AR',
    siteName: 'منصة البث المباشر',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'منصة البث المباشر - شاهد أفضل القنوات',
    description: 'استمتع بمشاهدة أفضل القنوات والبث المباشر بجودة عالية',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
