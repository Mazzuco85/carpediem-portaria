"use client";

import { useParams, useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DeliverPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const confirmDelivery = async () => {
    const response = await fetch(`/api/encomendas/${params.id}/deliver`, { method: "POST" });
    if (!response.ok) return;
    router.push("/dashboard/encomendas");
    router.refresh();
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Confirmar entrega</h2>
          <p>Deseja marcar esta encomenda como entregue?</p>
          <button className="button button-primary" onClick={confirmDelivery}>
            Confirmar entrega
          </button>
        </div>
      </section>
    </main>
  );
}
