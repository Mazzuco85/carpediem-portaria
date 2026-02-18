"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Encomenda } from "@/lib/types";

function formatDatePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.14)",
        background: "rgba(0,0,0,.18)",
        fontSize: 12,
        lineHeight: 1,
        opacity: 0.95,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginTop: 6 }}>
      <div style={{ width: 110, opacity: 0.75, fontSize: 12 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13 }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,.10)", marginTop: 12, marginBottom: 12 }} />;
}

export default function EncomendasPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");

  const load = async () => {
    setLoading(true);
    setError(null);

    // IMPORTANTE: mantenho como você estava ("/api/encomendas")
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
          {!loading && !error && filtered.length === 0 ? (
            <div className="empty-state">Nenhuma encomenda para o filtro selecionado.</div>
          ) : null}

          <div className="list-grid">
            {filtered.map((item) => {
              const nome = item.moradores_v2?.nome ?? "Morador";
              const apto = item.moradores_v2?.apartamento ?? "";
              const tipo = item.tipo ?? "";
              const status = String(item.status ?? "").toLowerCase();
              const statusText = status ? status.toUpperCase() : "STATUS";

              // Esses campos podem ou não existir no seu type,
              // por isso uso "as any" para não travar o build.
              const codigoRetirada = (item as any).codigo_retirada as string | null | undefined;
              const codigoBarras = (item as any).codigo_barras as string | null | undefined;

              return (
                <article key={item.id} className="entity-card" style={{ padding: 16 }}>
                  <div className="section-header" style={{ marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ marginBottom: 4 }}>{nome}</h3>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {apto ? <Badge>🏠 Apto {apto}</Badge> : null}
                        {tipo ? <Badge>📦 {tipo}</Badge> : null}
                        {codigoRetirada ? <Badge>🔎 Retirada {codigoRetirada}</Badge> : null}
                        {codigoBarras ? <Badge>🏷️ {codigoBarras}</Badge> : null}
                      </div>
                    </div>

                    <span className={`status-badge ${status}`} style={{ alignSelf: "flex-start" }}>
                      {statusText}
                    </span>
                  </div>

                  <Row label="Descrição" value={item.descricao ?? "Encomenda"} />
                  <Row label="Recebido em" value={formatDatePtBR(item.recebido_em)} />

                  {item.observacoes ? (
                    <>
                      <Divider />
                      <div style={{ opacity: 0.9, fontSize: 12, marginBottom: 4 }}>Observações (recebimento)</div>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,.12)",
                          background: "rgba(0,0,0,.16)",
                          fontSize: 13,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {item.observacoes}
                      </div>
                    </>
                  ) : null}

                  {status === "entregue" ? (
                    <>
                      <Divider />
                      <div style={{ opacity: 0.9, fontSize: 12, marginBottom: 6 }}>Entrega</div>
                      <Row label="Entregue em" value={formatDatePtBR(item.entregue_em)} />
                      <Row label="Retirado por" value={(item as any).entregue_por ?? null} />
                      {(item as any).observacoes_entrega ? (
                        <div
                          style={{
                            marginTop: 10,
                            padding: 12,
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,.12)",
                            background: "rgba(0,0,0,.12)",
                            fontSize: 13,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <b style={{ opacity: 0.9 }}>Obs entrega:</b> {(item as any).observacoes_entrega}
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  <div className="actions-row" style={{ marginTop: 14 }}>
                    {status === "pendente" ? (
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
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
