import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkoutApp - Sua Ficha Online",
  description: "Treinos personalizados com precisão e estilo de alta performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
