"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import type { Morador } from "@/lib/types";

const initialForm = { nome: "", apartamento: "", bloco: "", telefone: "" };

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch("/api/moradores", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setMoradores(data);
    else setError(data.error ?? "Falha ao carregar moradores");
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
      const data = await response.json().catch(() => ({ error: "Falha ao salvar" }));
      setError(data.error);
      return;
    }

    setForm(initialForm);
    setEditingId(null);
    setError(null);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Deseja remover este morador?")) return;
    await fetch(`/api/moradores/${id}`, { method: "DELETE" });
    void load();
  };

  return (
    <main className="container">
      <DashboardNav />
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h1 style={{ marginTop: 0 }}>Moradores</h1>
        <form onSubmit={submit} style={{ display: "grid", gap: "0.6rem" }}>
          <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <input
            placeholder="Apartamento"
            value={form.apartamento}
            onChange={(e) => setForm({ ...form, apartamento: e.target.value })}
            required
          />
          <input placeholder="Bloco" value={form.bloco} onChange={(e) => setForm({ ...form, bloco: e.target.value })} required />
          <input
            placeholder="Telefone (WhatsApp)"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
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
        {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Apt/Bloco</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {moradores.map((morador) => (
              <tr key={morador.id}>
                <td>{morador.nome}</td>
                <td>
                  {morador.apartamento}/{morador.bloco}
                </td>
                <td>{morador.telefone ?? "-"}</td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      setEditingId(morador.id);
                      setForm({
                        nome: morador.nome,
                        apartamento: morador.apartamento,
                        bloco: morador.bloco,
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
    </main>
  );
}
