"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Morador } from "@/lib/types";

export default function NewEncomendaPage() {
  const router = useRouter();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loadingMoradores, setLoadingMoradores] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    fetch("/api/moradores", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMoradores)
      .catch(() => setToast({ message: "Não foi possível carregar moradores para seleção.", type: "error" }))
      .finally(() => setLoadingMoradores(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/encomendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        morador_id: formData.get("morador_id"),
        descricao: formData.get("descricao"),
        codigo_rastreio: formData.get("codigo_rastreio"),
        observacoes: formData.get("observacoes"),
      }),
    });

    if (!response.ok) return setToast({ message: "Não foi possível criar encomenda.", type: "error" });
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
          {!loadingMoradores && moradores.length === 0 ? <div className="empty-state">Nenhum morador cadastrado para vincular encomendas.</div> : null}

          <form onSubmit={submit} className="form-grid">
            <div>
              <label htmlFor="morador_id">Morador</label>
              <select name="morador_id" id="morador_id" required disabled={loadingMoradores || moradores.length === 0}>
                <option value="">Selecione...</option>
                {moradores.map((morador) => (
                  <option key={morador.id} value={morador.id}>
                    {morador.nome} - {morador.unidade ? `${morador.unidade} · ` : ""}Apt {morador.apto}/{morador.torre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="descricao">Descrição</label>
              <input id="descricao" name="descricao" required />
            </div>
            <div>
              <label htmlFor="codigo_rastreio">Código de rastreio</label>
              <input id="codigo_rastreio" name="codigo_rastreio" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div>
              <label htmlFor="observacoes">Observações</label>
              <textarea id="observacoes" name="observacoes" rows={4} />
            </div>
            <button className="button button-primary" type="submit" disabled={loadingMoradores || moradores.length === 0}>
              Salvar encomenda
            </button>
          </form>
        </div>
      </section>

      {scannerOpen ? (
        <div className="modal-backdrop">
          <div className="modal glass-panel">
            <h2>Scanner de rastreio</h2>
            <p className="page-intro">Use um leitor de código de barras conectado e cole o código abaixo.</p>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de rastreio" autoFocus />
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
