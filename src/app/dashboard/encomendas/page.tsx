"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import type { Encomenda } from "@/lib/types";

export default function EncomendasPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);

  const load = async () => {
    const response = await fetch("/api/encomendas", { cache: "no-store" });
    if (!response.ok) return;
    setEncomendas(await response.json());
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Remover encomenda?")) return;
    await fetch(`/api/encomendas/${id}`, { method: "DELETE" });
    void load();
  };

  return (
    <main className="container">
      <DashboardNav />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Encomendas</h1>
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
                <td>{item.moradores ? `${item.moradores.nome} (${item.moradores.apartamento}/${item.moradores.bloco})` : item.morador_id}</td>
                <td>{item.descricao}</td>
                <td>{item.status}</td>
                <td>{new Date(item.recebido_em).toLocaleString("pt-BR")}</td>
                <td style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
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
    </main>
  );
}
