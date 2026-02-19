"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Encomenda } from "@/lib/types";

type EncomendaListItem = Encomenda & {
  entregue_por?: string | null;
  observacoes_entrega?: string | null;
};

function formatDatePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="meta-badge">{children}</span>;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="meta-row">
      <div className="meta-label">{label}</div>
      <div className="meta-value">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="soft-divider" />;
}

export default function EncomendasPage() {
  const [encomendas, setEncomendas] = useState<EncomendaListItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [quickFilter, setQuickFilter] = useState<"todos" | "pendente" | "entregue" | "hoje">("todos");
  const [search, setSearch] = useState("");

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

    setEncomendas((await response.json()) as EncomendaListItem[]);
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filtered = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const query = search.trim().toLocaleLowerCase("pt-BR");

    return encomendas.filter((item) => {
      const byDropdown = statusFilter === "todos" ? true : item.status === statusFilter;

      const byQuickFilter =
        quickFilter === "todos"
          ? true
          : quickFilter === "hoje"
            ? (() => {
                const recebido = new Date(item.recebido_em);
                return !Number.isNaN(recebido.getTime()) && recebido >= start && recebido < end;
              })()
            : item.status === quickFilter;

      if (!query) return byDropdown && byQuickFilter;

      const searchable = [
        item.moradores_v2?.nome,
        item.moradores_v2?.apartamento,
        item.codigo_retirada,
        item.codigo_barras,
        item.descricao,
        item.observacoes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return byDropdown && byQuickFilter && searchable.includes(query);
    });
  }, [encomendas, quickFilter, search, statusFilter]);

  const exportCsv = () => {
    const columns = [
      "recebido_em",
      "status",
      "morador_nome",
      "apartamento",
      "tipo",
      "codigo_retirada",
      "codigo_barras",
      "descricao",
      "observacoes",
      "entregue_em",
      "entregue_por",
      "observacoes_entrega",
    ];

    const escape = (value: unknown) => {
      if (value == null) return "";
      const text = String(value);
      if (text.includes(",") || text.includes("\n") || text.includes('"')) {
        return `"${text.replaceAll('"', '""')}"`;
      }
      return text;
    };

    const rows = filtered.map((item) => [
      item.recebido_em ?? "",
      item.status ?? "",
      item.moradores_v2?.nome ?? "",
      item.moradores_v2?.apartamento ?? "",
      item.tipo ?? "",
      item.codigo_retirada ?? "",
      item.codigo_barras ?? "",
      item.descricao ?? "",
      item.observacoes ?? "",
      item.entregue_em ?? "",
      item.entregue_por ?? "",
      item.observacoes_entrega ?? "",
    ]);

    const csv = [columns.join(","), ...rows.map((row) => row.map((cell) => escape(cell)).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `encomendas-filtradas-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

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

          <div className="filter-tools">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por morador, apto, código retirada, código barras, descrição ou observações"
            />

            <div className="quick-filter-row">
              <button type="button" className={`button button-pill ${quickFilter === "pendente" ? "active" : ""}`} onClick={() => setQuickFilter("pendente")}>
                Pendentes
              </button>
              <button type="button" className={`button button-pill ${quickFilter === "entregue" ? "active" : ""}`} onClick={() => setQuickFilter("entregue")}>
                Entregues
              </button>
              <button type="button" className={`button button-pill ${quickFilter === "hoje" ? "active" : ""}`} onClick={() => setQuickFilter("hoje")}>
                Hoje
              </button>
              <button type="button" className={`button button-pill ${quickFilter === "todos" ? "active" : ""}`} onClick={() => setQuickFilter("todos")}>
                Limpar rápido
              </button>
              <button type="button" className="button button-primary button-pill" onClick={exportCsv}>
                Exportar CSV
              </button>
            </div>
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

              const codigoRetirada = item.codigo_retirada;
              const codigoBarras = item.codigo_barras;

              return (
                <article key={item.id} className="entity-card">
                  <div className="section-header">
                    <div style={{ minWidth: 0 }}>
                      <h3>{nome}</h3>
                      <div className="actions-row" style={{ marginTop: 0 }}>
                        {apto ? <Badge>🏠 Apto {apto}</Badge> : null}
                        {tipo ? <Badge>📦 {tipo}</Badge> : null}
                        {codigoRetirada ? <Badge>🔎 Retirada {codigoRetirada}</Badge> : null}
                        {codigoBarras ? <Badge>🏷️ {codigoBarras}</Badge> : null}
                      </div>
                    </div>

                    <span className={`status-badge ${status || "default"}`} style={{ alignSelf: "flex-start" }}>
                      {statusText}
                    </span>
                  </div>

                  <Row label="Descrição" value={item.descricao ?? "Encomenda"} />
                  <Row label="Recebido em" value={formatDatePtBR(item.recebido_em)} />

                  {item.observacoes ? (
                    <>
                      <Divider />
                      <div className="helper-text">Observações (recebimento)</div>
                      <div className="note-box">
                        {item.observacoes}
                      </div>
                    </>
                  ) : null}

                  {status === "entregue" ? (
                    <>
                      <Divider />
                      <div className="helper-text">Entrega</div>
                      <Row label="Entregue em" value={formatDatePtBR(item.entregue_em)} />
                      <Row label="Retirado por" value={item.entregue_por ?? null} />
                      {item.observacoes_entrega ? (
                        <div className="note-box" style={{ marginTop: 10 }}>
                          <b>Obs entrega:</b> {item.observacoes_entrega}
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  <div className="actions-row">
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
