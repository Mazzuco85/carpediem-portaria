"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export default function WhatsappPage() {
  const params = useParams<{ id: string }>();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/encomendas/${params.id}/whatsapp`, { method: "POST" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError("Não foi possível gerar o link de WhatsApp.");
        return;
      }

      setLink(data.link);
    };

    void load();
  }, [params.id]);

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <div className="card glass-panel">
          <h2>Notificação por WhatsApp</h2>
          <p className="page-intro">Gere um link com mensagem pronta para avisar o morador.</p>
          {error ? <div className="banner">{error}</div> : null}
          {link ? (
            <a className="button button-primary" href={link} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          ) : (
            <div className="loading-state">Gerando link...</div>
          )}
        </div>
      </section>
    </main>
  );
}
