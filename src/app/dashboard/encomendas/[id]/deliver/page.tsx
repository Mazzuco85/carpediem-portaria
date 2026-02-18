"use client";

import { FormEvent, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";

export default function DeliverEncomendaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [retiradoPor, setRetiradoPor] = useState("");
  const [observacoesEntrega, setObservacoesEntrega] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!retiradoPor.trim()) {
      setToast({ message: "Informe quem retirou a encomenda.", type: "error" });
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/encomendas/${id}/deliver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entregue_por: retiradoPor.trim(),
        observacoes_entrega: observacoesEntrega.trim() || null,
      }),
    });

    if (!response.ok) {
      setToast({ message: "Não foi possível confirmar entrega.", type: "error" });
      setLoading(false);
      return;
    }

    setToast({ message: "Entrega confirmada com sucesso.", type: "success" });

    setTimeout(() => {
      router.push("/dashboard/encomendas");
      router.refresh();
    }, 600);
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <Toast message={toast?.message ?? null} type={toast?.type} onClose={() => setToast(null)} />

        <div className="glass-panel card">
          <h2>Confirmar entrega</h2>
          <p className="page-intro">
            Registre quem retirou para manter histórico e reduzir risco de “sumiu e ninguém sabe”.
          </p>

          <form onSubmit={submit} className="form-grid">
            <div>
              <label>Retirado por *</label>
              <input
                value={retiradoPor}
                onChange={(e) => setRetiradoPor(e.target.value)}
                placeholder="Ex: João (filho), Maria (empregada), vizinho Carlos"
                required
              />
            </div>

            <div>
              <label>Observações</label>
              <textarea
                value={observacoesEntrega}
                onChange={(e) => setObservacoesEntrega(e.target.value)}
                placeholder="Ex: Deixado por fulano para beltrano / Retirado sem código de barras"
                rows={4}
              />
            </div>

            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? "Confirmando..." : "Confirmar entrega"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
