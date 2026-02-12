import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardPage() {
  return (
    <main className="container">
      <DashboardNav />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Dashboard da Portaria</h1>
        <p>Use os atalhos abaixo para gerenciar moradores e encomendas.</p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/dashboard/moradores" className="button button-primary">
            Gerenciar Moradores
          </Link>
          <Link href="/dashboard/encomendas" className="button button-secondary">
            Ver Encomendas
          </Link>
          <Link href="/dashboard/encomendas/new" className="button button-secondary">
            Cadastrar Encomenda
          </Link>
        </div>
      </div>
    </main>
  );
}
