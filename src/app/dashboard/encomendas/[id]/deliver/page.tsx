"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Encomenda } from "@/lib/types";

async function extractErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const message = payload?.error;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  const text = await response.text().catch(() => "");
  return text.trim();
}

export default function DeliverEncomendaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [retiradoPor, setRetiradoPor] = useState("");
  const [observacoesEntrega, setObservacoesEntrega] = useState("");
  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadEncomenda = async () => {
      try {
        const response = await fetch(`/api/encomendas/${id}`, { cache: "no-store", signal: controller.signal });

        if (!response.ok) {
          setToast({ message: "Não foi possível carregar os dados da encomenda.", type: "error" });
          return;
        }

        const data = (await response.json()) as Encomenda;
        setEncomenda(data);
      } catch {
        if (!controller.signal.aborted) {
          setToast({ message: "Não foi possível carregar os dados da encomenda.", type: "error" });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingInfo(false);
        }
      }
    };

    if (id) {
      void loadEncomenda();
    }

    return () => controller.abort();
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const retiradoPorLimpo = retiradoPor.trim();
    const observacoesEntregaLimpa = observacoesEntrega.trim();

    if (!retiradoPorLimpo) {
      setToast({ message: "Informe quem retirou a encomenda.", type: "error" });
      return;
    }

    setLoading(true);

    const deliverResponse = await fetch(`/api/encomendas/${id}/deliver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entregue_por: retiradoPorLimpo,
        observacoes_entrega: observacoesEntregaLimpa || null,
      }),
    });

    if (!deliverResponse.ok) {
      const deliverError = await extractErrorMessage(deliverResponse);
      const message = deliverError ? `Falha: ${deliverError}` : "Não foi possível confirmar entrega.";
      setToast({ message, type: "error" });
      setLoading(false);
      return;
    }

    const whatsappResponse = await fetch(`/api/encomendas/${id}/whatsapp`, { method: "POST" });

    if (!whatsappResponse.ok) {
      setToast({ message: "Entrega confirmada, mas não foi possível abrir o WhatsApp.", type: "error" });
      setLoading(false);
      return;
    }

    const whatsappData = (await whatsappResponse.json()) as { phone?: string; message?: string };
    const telefone = whatsappData.phone ?? "";
    const mensagemBase = whatsappData.message ?? "";

    if (!telefone || !mensagemBase) {
      setToast({ message: "Entrega confirmada, mas faltam dados para abrir o WhatsApp.", type: "error" });
      setLoading(false);
      return;
    }

    const mensagemEntrega = observacoesEntregaLimpa
      ? ` Retirado por: ${retiradoPorLimpo}. Obs: ${observacoesEntregaLimpa}`
      : ` Retirado por: ${retiradoPorLimpo}.`;

    const whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(`${mensagemBase}${mensagemEntrega}`)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

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

          {loadingInfo ? <div className="loading-state">Carregando dados da encomenda...</div> : null}

          {encomenda ? (
            <div className="entity-card" style={{ marginBottom: 14 }}>
              <h3>Resumo da encomenda</h3>
              <div className="form-grid">
                <div><b>Morador:</b> {encomenda.moradores_v2?.nome ?? "-"}</div>
                <div><b>Apartamento:</b> {encomenda.moradores_v2?.apartamento ?? "-"}</div>
                <div><b>Tipo:</b> {encomenda.tipo ?? "-"}</div>
                <div><b>Código retirada:</b> {encomenda.codigo_retirada ?? "-"}</div>
                <div><b>Código barras:</b> {encomenda.codigo_barras ?? "-"}</div>
                <div><b>Descrição:</b> {encomenda.descricao ?? "-"}</div>
                <div><b>Observações:</b> {encomenda.observacoes ?? "-"}</div>
              </div>
            </div>
          ) : null}

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
              {loading ? "Confirmando..." : "Confirmar entrega e abrir WhatsApp"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
