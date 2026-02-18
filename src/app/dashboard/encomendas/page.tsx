"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Encomenda } from "@/lib/types";

export default function EncomendasPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");

  const load = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/encomendas", { cache: "no-store" });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      setError(txt || "Não foi possível carregar encomendas.");
      setLoading(false);
      return;
    }

    setEncomendas(await response.json());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => encomendas.filter((item) => (statusFilter === "todos" ? true : item.status === statusFilter)),
    [encomendas, statusFilter],
  );

  const remove = async (id: string) => {
    const response = await fetch(`/api/encomendas/${id}`, { method: "DELETE" });
    setToast({
      message: response.ok ? "Encomenda removida." : "Falha ao remover encomenda.",
      type: response.ok ? "success" : "error",
    });
    void load();
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <Toast message={toast?.message ?? null} type={toast?.type} onClose={() => setToast(null)} />

        <div className="glass-panel card">
          <div className="section-header">
            <div>
              <h2>Encomendas</h2>
              <p className="page-intro">Filtros operacionais, status premium e ações rápidas.</p>
            </div>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="entregue">Entregues</option>
            </select>
          </div>

          {error ? <div className="banner">{error}</div> : null}
          {loading ? <div className="loading-state">Carregando encomendas...</div> : null}
          {!loading && !error && filtered.length === 0 ? <div className="empty-state">Nenhuma encomenda para o filtro selecionado.</div> : null}

          <div className="list-grid">
            {filtered.map((item) => (
              <article key={item.id} className="entity-card">
                <div className="section-header">
                  <h3>{item.moradores_v2?.nome ?? "Morador"}</h3>
                  <span className={`status-badge ${item.status}`}>{String(item.status).toUpperCase()}</span>
                </div>

                <p>{item.descricao ?? "Encomenda"}</p>

                <p>{item.recebido_em ? new Date(item.recebido_em).toLocaleString("pt-BR") : ""}</p>

                {/* Observações do recebimento */}
                {item.observacoes ? (
                  <p style={{ opacity: 0.9, marginTop: 8 }}>
                    <b>Obs:</b> {item.observacoes}
                  </p>
                ) : null}

                {/* Info da entrega */}
                {item.status === "entregue" ? (
                  <div style={{ marginTop: 10, opacity: 0.95 }}>
                    {item.entregue_por ? (
                      <p>
                        <b>Retirado por:</b> {item.entregue_por}
                      </p>
                    ) : null}
                    {item.observacoes_entrega ? (
                      <p>
                        <b>Obs entrega:</b> {item.observacoes_entrega}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="actions-row">
                  {item.status === "pendente" ? (
                    <Link href={`/dashboard/encomendas/${item.id}/deliver`} className="button button-primary">
                      Entregar
                    </Link>
                  ) : null}

                  <Link href={`/dashboard/encomendas/${item.id}/whatsapp`} className="button button-secondary">
                    WhatsApp
                  </Link>

                  <button className="button button-danger" onClick={() => remove(item.id)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
