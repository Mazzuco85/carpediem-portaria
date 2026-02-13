"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Encomenda } from "@/lib/types";

export type Shortcut = { href: string; title: string; description: string };

export function DashboardOverview({ shortcuts }: { shortcuts: Shortcut[] }) {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/encomendas", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEncomendas)
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const hoje = new Date().toDateString();
    const pendentes = encomendas.filter((e) => e.status === "pendente").length;
    const entreguesHoje = encomendas.filter((e) => e.status === "entregue" && new Date(e.entregue_em ?? "").toDateString() === hoje).length;
    return { pendentes, entreguesHoje, total: encomendas.length };
  }, [encomendas]);

  return (
    <section className="dashboard-content">
      <div className="glass-panel card">
        <h2>Visão geral</h2>
        <p className="page-intro">Controle premium da operação de portaria.</p>
        {loading ? <div className="loading-state">Atualizando indicadores...</div> : null}
        <div className="kpi-grid">
          <article className="kpi-card luxury">
            <p className="kpi-label">Pendentes</p>
            <h3>{metrics.pendentes}</h3>
          </article>
          <article className="kpi-card luxury">
            <p className="kpi-label">Entregues hoje</p>
            <h3>{metrics.entreguesHoje}</h3>
          </article>
          <article className="kpi-card luxury">
            <p className="kpi-label">Total</p>
            <h3>{metrics.total}</h3>
          </article>
        </div>
      </div>

      <div className="glass-panel card">
        <h2>Ações rápidas</h2>
        <div className="kpi-grid shortcuts-grid">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href} className="kpi-card shortcut-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
