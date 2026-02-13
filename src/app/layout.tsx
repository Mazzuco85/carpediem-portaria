import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarpeDiem Residences | Portaria",
  description: "SaaS premium para controle de moradores e encomendas",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
