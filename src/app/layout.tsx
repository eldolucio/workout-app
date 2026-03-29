import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { InstallBanner } from "@/components/InstallBanner";

const inter = Inter({ subsets: ["latin"] });
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: 'WorkoutApp — Seu treino, sua regra',
  description: 'App de treinos personalizados com importação de fichas por OCR',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'WorkoutApp',
    description: 'Seu treino, sua regra',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <InstallBanner />
        {children}
      </body>
    </html>
  );
}
