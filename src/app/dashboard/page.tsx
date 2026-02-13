import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";

const MORADORES_ROUTE = "/dashboard/moradores";
const ENCOMENDAS_ROUTE = "/dashboard/encomendas";
const NOVA_ENCOMENDA_ROUTE = "/dashboard/encomendas/new";

const kpis = [
  { icon: "👥", label: "Cadastro", title: "Moradores", description: "Atualize moradores e informações de contato." },
  { icon: "📦", label: "Operação", title: "Encomendas", description: "Acompanhe recebimentos e entregas pendentes." },
  { icon: "⚡", label: "Atalho", title: "Nova entrada", description: "Registre rapidamente uma nova encomenda." },
];

export default function DashboardPage() {
  return (
    <main className="container dashboard-layout">
      <DashboardNav />

      <section className="dashboard-content">
        <div className="card">
          <h2>Dashboard da Portaria</h2>
          <p className="page-intro">Use os atalhos abaixo para gerenciar moradores e encomendas.</p>
          <div className="kpi-grid">
            {kpis.map((item) => (
              <article className="kpi-card" key={item.title}>
                <p className="kpi-label">
                  <span>{item.icon}</span> {item.label}
                </p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <div className="actions-row" style={{ marginTop: "1.25rem" }}>
            <Link href={MORADORES_ROUTE} className="button button-primary">
              Gerenciar Moradores
            </Link>
            <Link href={ENCOMENDAS_ROUTE} className="button button-secondary">
              Ver Encomendas
            </Link>
            <Link href={NOVA_ENCOMENDA_ROUTE} className="button button-secondary">
              Cadastrar Encomenda
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
