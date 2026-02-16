"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { MoradorV2 } from "@/lib/types";

const initialForm = { nome: "", apartamento: "", telefone: "", email: "" };

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<MoradorV2[]>([]);
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
    const response = await fetch("/api/moradores-v2", { cache: "no-store" });
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
    () => moradores.filter((m) => [m.nome, m.apartamento, m.telefone, m.email].join(" ").toLowerCase().includes(query.toLowerCase())),
    [moradores, query],
  );

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setOpenModal(true);
  };

  const startEdit = (morador: MoradorV2) => {
    setEditingId(morador.id);
    setForm({
      nome: morador.nome,
      apartamento: morador.apartamento,
      telefone: morador.telefone ?? "",
      email: morador.email ?? "",
    });
    setOpenModal(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch(editingId ? `/api/moradores-v2/${editingId}` : "/api/moradores-v2", {
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
    const response = await fetch(`/api/moradores-v2/${deletingId}`, { method: "DELETE" });
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
            <input placeholder="Buscar por nome, apartamento, telefone ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {error ? <div className="banner">{error}</div> : null}
          {loading ? <div className="loading-state">Carregando moradores...</div> : null}
          {!loading && !error && filtered.length === 0 ? <div className="empty-state">Nenhum morador encontrado.</div> : null}
          <div className="list-grid">
            {filtered.map((morador) => (
              <article key={morador.id} className="entity-card">
                <h3>{morador.nome}</h3>
                <p>Apto {morador.apartamento}</p>
                <p>{morador.telefone || "Sem telefone"}</p>
                <p>{morador.email || "Sem e-mail"}</p>
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
              <div><label>Apartamento</label><input value={form.apartamento} onChange={(e) => setForm({ ...form, apartamento: e.target.value })} required /></div>
              <div><label>Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><label>E-mail</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
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
