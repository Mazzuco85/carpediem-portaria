"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Morador } from "@/lib/types";

export default function NewEncomendaPage() {
  const router = useRouter();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMoradores, setLoadingMoradores] = useState(true);

  useEffect(() => {
    fetch("/api/moradores", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMoradores)
      .catch(() => setError("Não foi possível carregar moradores para seleção."))
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

    if (!response.ok) {
      setError("Não foi possível criar encomenda.");
      return;
    }

    router.push("/dashboard/encomendas");
    router.refresh();
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <Toast message={error} type="error" onClose={() => setError(null)} />
        <div className="card">
          <h2>Nova encomenda</h2>
          <p className="page-intro">Registre encomendas recebidas para controle da portaria.</p>
          {loadingMoradores ? <div className="loading-state">Carregando moradores...</div> : null}
          {!loadingMoradores && moradores.length === 0 ? (
            <div className="empty-state">Nenhum morador cadastrado para vincular encomendas.</div>
          ) : null}

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
              <input id="codigo_rastreio" name="codigo_rastreio" />
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
    </main>
  );
}
