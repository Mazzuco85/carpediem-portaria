import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portaria CarpeDiem",
  description: "Sistema de controle de moradores e encomendas",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
