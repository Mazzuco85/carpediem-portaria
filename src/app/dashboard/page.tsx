import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";

const kpis = [
  {
    icon: "👥",
    label: "Cadastro",
    title: "Moradores",
    description: "Atualize moradores e informações de contato.",
    href: "/dashboard/moradores",
    cta: "Gerenciar Moradores",
  },
  {
    icon: "📦",
    label: "Operação",
    title: "Encomendas",
    description: "Acompanhe recebimentos e entregas pendentes.",
    href: "/dashboard/encomendas",
    cta: "Ver Encomendas",
  },
  {
    icon: "⚡",
    label: "Atalho",
    title: "Nova entrada",
    description: "Registre rapidamente uma nova encomenda.",
    href: "/dashboard/nova-encomenda",
    cta: "Cadastrar Encomenda",
  },
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
              <Link
                href={item.href}
                key={item.title}
                className="kpi-card"
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
                aria-label={item.cta}
              >
                <p className="kpi-label">
                  <span>{item.icon}</span> {item.label}
                </p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
