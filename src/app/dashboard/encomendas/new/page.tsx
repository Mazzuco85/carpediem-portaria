"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { MoradorV2 } from "@/lib/types";

const TIPOS_ENCOMENDA = ["Caixa", "Bag", "Padrão", "Envelope", "Outro"] as const;

export default function NewEncomendaPage() {
  const router = useRouter();
  const [moradores, setMoradores] = useState<MoradorV2[]>([]);
  const [moradorSearch, setMoradorSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loadingMoradores, setLoadingMoradores] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadMoradores = async () => {
      setLoadingMoradores(true);

      const query = moradorSearch.trim();
      const url = query ? `/api/moradores-v2?q=${encodeURIComponent(query)}` : "/api/moradores-v2";

      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Falha ao carregar moradores");

        const data = (await response.json()) as MoradorV2[];
        setMoradores(data);
      } catch {
        if (!controller.signal.aborted) {
          setToast({ message: "Não foi possível carregar moradores para seleção.", type: "error" });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMoradores(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      void loadMoradores();
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [moradorSearch]);

  const moradoresById = useMemo(() => new Map(moradores.map((morador) => [morador.id, morador])), [moradores]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const moradorId = String(formData.get("morador_id") ?? "");
    const descricao = String(formData.get("descricao") ?? "");
    const tipo = String(formData.get("tipo") ?? "");
    const codigoBarras = String(formData.get("codigo_barras") ?? "").trim();
    const observacoes = String(formData.get("observacoes") ?? "").trim();

    const response = await fetch("/api/encomendas-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        morador_id: moradorId,
        descricao,
        codigo_barras: codigoBarras || null,
        tipo,
        observacoes: observacoes || null,
      }),
    });

    if (!response.ok) {
      return setToast({ message: "Não foi possível criar encomenda.", type: "error" });
    }

    const created = (await response.json()) as { codigo_retirada?: string };
    const moradorSelecionado = moradoresById.get(moradorId);
    const telefone = moradorSelecionado?.telefone?.replace(/\D/g, "");

    if (moradorSelecionado && telefone) {
      const messageLines = [
        `Olá, ${moradorSelecionado.nome}.`,
        `Sua encomenda chegou na portaria.`,
        `Apartamento: ${moradorSelecionado.apartamento}`,
        `Tipo de encomenda: ${tipo}`,
      ];

      if (codigoBarras) {
        messageLines.push(`Código de barras: ${codigoBarras}`);
      }

      if (created.codigo_retirada) {
        messageLines.push(`Código de retirada: ${created.codigo_retirada}`);
      }

      const message = encodeURIComponent(messageLines.join("\n"));
      window.open(`https://wa.me/${telefone}?text=${message}`, "_blank", "noopener,noreferrer");
    }

    setToast({ message: "Encomenda cadastrada com sucesso.", type: "success" });
    setTimeout(() => {
      router.push("/dashboard/encomendas");
      router.refresh();
    }, 500);
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <Toast message={toast?.message ?? null} type={toast?.type} onClose={() => setToast(null)} />
        <div className="glass-panel card">
          <div className="section-header">
            <div>
              <h2>Nova encomenda</h2>
              <p className="page-intro">Registro rápido com leitura assistida de rastreio.</p>
            </div>
            <button className="button button-secondary" onClick={() => setScannerOpen(true)}>Abrir scanner</button>
          </div>

          {loadingMoradores ? <div className="loading-state">Carregando moradores...</div> : null}
          {!loadingMoradores && moradores.length === 0 ? <div className="empty-state">Nenhum morador encontrado para o filtro informado.</div> : null}

          <form onSubmit={submit} className="form-grid">
            <div>
              <label htmlFor="morador_search">Morador</label>
              <input
                id="morador_search"
                name="morador_search"
                value={moradorSearch}
                onChange={(event) => setMoradorSearch(event.target.value)}
                placeholder="Buscar por nome ou apartamento"
              />
              <select name="morador_id" id="morador_id" required disabled={loadingMoradores || moradores.length === 0} style={{ marginTop: "0.75rem" }}>
                <option value="">Selecione...</option>
                {moradores.map((morador) => (
                  <option key={morador.id} value={morador.id}>
                    {morador.nome} - Apt {morador.apartamento}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="codigo_barras">Código de barras</label>
              <input id="codigo_barras" name="codigo_barras" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div>
              <label htmlFor="tipo">Tipo de encomenda</label>
              <select id="tipo" name="tipo" required defaultValue="">
                <option value="" disabled>
                  Selecione...
                </option>
                {TIPOS_ENCOMENDA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="descricao">Descrição</label>
              <input id="descricao" name="descricao" required />
            </div>
            <div>
              <label htmlFor="observacoes">Observações</label>
              <textarea id="observacoes" name="observacoes" rows={4} />
            </div>
            <button className="button button-primary" type="submit" disabled={loadingMoradores || moradores.length === 0}>
              Salvar
            </button>
          </form>
        </div>
      </section>

      {scannerOpen ? (
        <div className="modal-backdrop">
          <div className="modal glass-panel">
            <h2>Scanner de rastreio</h2>
            <p className="page-intro">Use um leitor de código de barras conectado e cole o código abaixo.</p>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de barras" autoFocus />
            <div className="actions-row" style={{ marginTop: "1rem" }}>
              <button className="button button-primary" onClick={() => setScannerOpen(false)}>Aplicar código</button>
              <button className="button button-secondary" onClick={() => setScannerOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
