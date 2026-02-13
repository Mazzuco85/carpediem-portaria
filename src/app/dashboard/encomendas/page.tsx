"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Encomenda } from "@/lib/types";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  actionLabel?: string;
  onAction?: () => void;
};

export default function EncomendasPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/encomendas", { cache: "no-store" });
    if (!response.ok) {
      setError("Não foi possível carregar encomendas.");
      setLoading(false);
      return;
    }
    setEncomendas(await response.json());
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const remove = async (id: string) => {
    setToast({
      message: "Confirmar remoção desta encomenda?",
      type: "info",
      actionLabel: "Confirmar",
      onAction: () => {
        void (async () => {
          const response = await fetch(`/api/encomendas/${id}`, { method: "DELETE" });
          setToast({ message: response.ok ? "Encomenda removida." : "Falha ao remover encomenda.", type: response.ok ? "success" : "error" });
          void load();
        })();
      },
    });
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <Toast
          message={toast?.message ?? null}
          type={toast?.type}
          actionLabel={toast?.actionLabel}
          onAction={toast?.onAction}
          onClose={() => setToast(null)}
        />

        <div className="card">
          <h2>Encomendas</h2>
          <p className="page-intro">Acompanhe status, entrega e notificações por WhatsApp.</p>
          {error ? <div className="banner">{error}</div> : null}
          {loading ? <div className="loading-state">Carregando encomendas...</div> : null}
          {!loading && !error && encomendas.length === 0 ? <div className="empty-state">Nenhuma encomenda registrada.</div> : null}

          {!loading && !error && encomendas.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Morador</th>
                    <th>Descrição</th>
                    <th>Status</th>
                    <th>Recebimento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {encomendas.map((item) => (
                    <tr key={item.id}>
                      <td>{item.moradores ? `${item.moradores.nome} (${item.moradores.unidade ? `${item.moradores.unidade} · ` : ""}${item.moradores.apto}/${item.moradores.torre})` : item.morador_id}</td>
                      <td>{item.descricao}</td>
                      <td>{item.status}</td>
                      <td>{new Date(item.recebido_em).toLocaleString("pt-BR")}</td>
                      <td className="actions-row">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
