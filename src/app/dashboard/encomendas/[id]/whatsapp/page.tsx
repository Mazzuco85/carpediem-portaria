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
    <main className="container">
      <DashboardNav />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Notificação por WhatsApp</h1>
        {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}
        {link ? (
          <a className="button button-primary" href={link} target="_blank" rel="noreferrer">
            Abrir WhatsApp
          </a>
        ) : (
          <p>Gerando link...</p>
        )}
      </div>
    </main>
  );
}
