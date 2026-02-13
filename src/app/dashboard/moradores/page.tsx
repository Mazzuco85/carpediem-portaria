"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Morador } from "@/lib/types";

const initialForm = { nome: "", unidade: "", apto: "", torre: "", telefone: "" };

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  actionLabel?: string;
  onAction?: () => void;
};

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/moradores", { cache: "no-store" });
    const data = await response.json().catch(() => []);
    if (response.ok) setMoradores(data);
    else setError("Não foi possível carregar moradores no momento.");
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const url = editingId ? `/api/moradores/${editingId}` : "/api/moradores";
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setToast({ message: "Não foi possível salvar este morador.", type: "error" });
      return;
    }

    setForm(initialForm);
    setEditingId(null);
    setToast({ message: editingId ? "Morador atualizado com sucesso." : "Morador cadastrado com sucesso.", type: "success" });
    void load();
  };

  const remove = async (id: string) => {
    setToast({
      message: "Confirmar exclusão deste morador?",
      type: "info",
      actionLabel: "Confirmar",
      onAction: () => {
        void (async () => {
          const response = await fetch(`/api/moradores/${id}`, { method: "DELETE" });
          setToast({ message: response.ok ? "Morador removido." : "Não foi possível remover este morador.", type: response.ok ? "success" : "error" });
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
          <h2>Moradores</h2>
          <p className="page-intro">Cadastre e atualize dados de contato dos moradores.</p>
          <form onSubmit={submit} className="form-grid">
            <div>
              <label htmlFor="nome">Nome completo</label>
              <input id="nome" placeholder="Ex: Ana Souza" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="unidade">Unidade (opcional)</label>
              <input id="unidade" placeholder="Ex: Residencial Azul" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
            </div>
            <div className="form-row">
              <div>
                <label htmlFor="apto">Apto</label>
                <input id="apto" placeholder="Ex: 101" value={form.apto} onChange={(e) => setForm({ ...form, apto: e.target.value })} required />
              </div>
              <div>
                <label htmlFor="torre">Torre</label>
                <input id="torre" placeholder="Ex: A" value={form.torre} onChange={(e) => setForm({ ...form, torre: e.target.value })} required />
              </div>
            </div>
            <div>
              <label htmlFor="telefone">Telefone (WhatsApp)</label>
              <input id="telefone" placeholder="Ex: (11) 98888-7777" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="actions-row">
              <button className="button button-primary" type="submit">
                {editingId ? "Atualizar" : "Cadastrar"}
              </button>
              {editingId ? (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Lista de moradores</h2>
          {error ? <div className="banner">{error}</div> : null}
          {loading ? <div className="loading-state">Carregando moradores...</div> : null}
          {!loading && !error && moradores.length === 0 ? <div className="empty-state">Nenhum morador cadastrado ainda.</div> : null}

          {!loading && !error && moradores.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Unidade</th>
                    <th>Apto/Torre</th>
                    <th>Telefone</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {moradores.map((morador) => (
                    <tr key={morador.id}>
                      <td>{morador.nome}</td>
                      <td>{morador.unidade ?? "-"}</td>
                      <td>{morador.apto}/{morador.torre}</td>
                      <td>{morador.telefone ?? "-"}</td>
                      <td className="actions-row">
                        <button
                          className="button button-secondary"
                          onClick={() => {
                            setEditingId(morador.id);
                            setForm({
                              nome: morador.nome,
                              unidade: morador.unidade ?? "",
                              apto: morador.apto,
                              torre: morador.torre,
                              telefone: morador.telefone ?? "",
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button className="button button-danger" onClick={() => remove(morador.id)}>
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
