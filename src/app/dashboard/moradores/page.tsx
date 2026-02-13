"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { Morador } from "@/lib/types";

const initialForm = { nome: "", unidade: "", torre: "", apto: "", telefone: "" };

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const filtered = useMemo(
    () => moradores.filter((m) => [m.nome, m.unidade, m.torre, m.apto, m.telefone].join(" ").toLowerCase().includes(query.toLowerCase())),
    [moradores, query],
  );

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setOpenModal(true);
  };

  const startEdit = (morador: Morador) => {
    setEditingId(morador.id);
    setForm({ nome: morador.nome, unidade: morador.unidade ?? "", torre: morador.torre, apto: morador.apto, telefone: morador.telefone ?? "" });
    setOpenModal(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch(editingId ? `/api/moradores/${editingId}` : "/api/moradores", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) return setToast({ message: "Não foi possível salvar este morador.", type: "error" });
    setOpenModal(false);
    setToast({ message: editingId ? "Morador atualizado com sucesso." : "Morador cadastrado com sucesso.", type: "success" });
    void load();
  };

  const remove = async () => {
    if (!deletingId) return;
    const response = await fetch(`/api/moradores/${deletingId}`, { method: "DELETE" });
    setDeletingId(null);
    setToast({ message: response.ok ? "Morador removido." : "Não foi possível remover este morador.", type: response.ok ? "success" : "error" });
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
              <h2>Moradores</h2>
              <p className="page-intro">Busca rápida, gestão completa e atualização de contatos.</p>
            </div>
            <button className="button button-primary" onClick={startCreate}>Novo morador</button>
          </div>
          <div className="search-row">
            <input placeholder="Buscar por nome, apto, torre ou telefone" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {error ? <div className="banner">{error}</div> : null}
          {loading ? <div className="loading-state">Carregando moradores...</div> : null}
          {!loading && !error && filtered.length === 0 ? <div className="empty-state">Nenhum morador encontrado.</div> : null}
          <div className="list-grid">
            {filtered.map((morador) => (
              <article key={morador.id} className="entity-card">
                <h3>{morador.nome}</h3>
                <p>{morador.unidade ? `${morador.unidade} · ` : ""}Apto {morador.apto}/{morador.torre}</p>
                <p>{morador.telefone || "Sem telefone"}</p>
                <div className="actions-row">
                  <button className="button button-secondary" onClick={() => startEdit(morador)}>Editar</button>
                  <button className="button button-danger" onClick={() => setDeletingId(morador.id)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {openModal ? (
        <div className="modal-backdrop">
          <div className="modal glass-panel">
            <h2>{editingId ? "Editar morador" : "Cadastrar morador"}</h2>
            <form onSubmit={submit} className="form-grid">
              <div><label>Nome completo</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
              <div><label>Unidade</label><input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></div>
              <div className="form-row">
                <div><label>Torre</label><input value={form.torre} onChange={(e) => setForm({ ...form, torre: e.target.value })} required /></div>
                <div><label>Apto</label><input value={form.apto} onChange={(e) => setForm({ ...form, apto: e.target.value })} required /></div>
              </div>
              <div><label>Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div className="actions-row">
                <button className="button button-primary" type="submit">Salvar</button>
                <button className="button button-secondary" type="button" onClick={() => setOpenModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingId ? (
        <div className="modal-backdrop">
          <div className="modal glass-panel">
            <h2>Confirmar exclusão</h2>
            <p className="page-intro">Deseja remover este morador?</p>
            <div className="actions-row">
              <button className="button button-danger" onClick={remove}>Confirmar exclusão</button>
              <button className="button button-secondary" onClick={() => setDeletingId(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
