"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DeliverPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);

  const confirmDelivery = async () => {
    const response = await fetch(`/api/encomendas/${params.id}/deliver`, { method: "POST" });
    if (!response.ok) {
      setError("Não foi possível confirmar a entrega.");
      return;
    }
    router.push("/dashboard/encomendas");
    router.refresh();
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <div className="card">
          <h2>Confirmar entrega</h2>
          <p className="page-intro">Deseja marcar esta encomenda como entregue?</p>
          {error ? <div className="banner" style={{ marginBottom: "0.75rem" }}>{error}</div> : null}
          <button className="button button-primary" onClick={confirmDelivery}>
            Confirmar entrega
          </button>
        </div>
      </section>
    </main>
  );
}
