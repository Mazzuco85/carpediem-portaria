"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";

export default function WhatsappPage() {
  const params = useParams<{ id: string }>();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/encomendas/${params.id}/whatsapp`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Erro ao gerar link");
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
        <Toast message={error} type="error" onClose={() => setError(null)} />
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Notificação por WhatsApp</h2>
          {link ? (
            <a className="button button-primary" href={link} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          ) : (
            <p>Gerando link...</p>
          )}
        </div>
      </section>
    </main>
  );
}
