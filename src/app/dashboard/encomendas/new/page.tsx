"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { MoradorV2 } from "@/lib/types";

const TIPOS_ENCOMENDA = ["Caixa", "Bag", "Padrão", "Envelope", "Outro"] as const;

function normalizePhone(rawPhone: string) {
  const onlyDigits = rawPhone.replace(/\D/g, "");

  if (!onlyDigits) {
    return "";
  }

  if (onlyDigits.startsWith("55")) {
    return onlyDigits;
  }

  return `55${onlyDigits}`;
}

export default function NewEncomendaPage() {
  const router = useRouter();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const tipoSelectRef = useRef<HTMLSelectElement>(null);

  const [moradores, setMoradores] = useState<MoradorV2[]>([]);
  const [selectedMoradorId, setSelectedMoradorId] = useState("");
  const [moradorSearch, setMoradorSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loadingMoradores, setLoadingMoradores] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadMoradores = async () => {
      setLoadingMoradores(true);

      try {
        const response = await fetch("/api/moradores-v2", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Falha ao carregar moradores");

        const data = (await response.json()) as MoradorV2[];
        setMoradores(data);
      } catch {
        if (!controller.signal.aborted) {
          setToast({ message: "Não foi possível carregar moradores para seleção.", type: "error" });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMoradores(false);
        }
      }
    };

    void loadMoradores();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredMoradores = useMemo(() => {
    const searchTerms = moradorSearch
      .toLocaleLowerCase("pt-BR")
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);

    if (searchTerms.length === 0) {
      return moradores;
    }

    return moradores.filter((morador) => {
      const searchable = [morador.nome, morador.apartamento, morador.telefone ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchTerms.every((term) => searchable.includes(term));
    });
  }, [moradorSearch, moradores]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const moradorId = String(formData.get("morador_id") ?? "");
    const tipo = String(formData.get("tipo") ?? "");
    const codigoBarras = String(formData.get("codigo_barras") ?? "").trim();

    if (!moradorId || !tipo) {
      setToast({ message: "Selecione morador e tipo para continuar.", type: "error" });
      return;
    }

    const response = await fetch("/api/encomendas-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        morador_id: moradorId,
        descricao: `Encomenda (${tipo})`,
        codigo_barras: codigoBarras || null,
        tipo,
      }),
    });

    if (!response.ok) {
      return setToast({ message: "Não foi possível criar encomenda.", type: "error" });
    }

    const created = (await response.json()) as { codigo_retirada?: string };
    const moradorSelecionado = moradores.find((morador) => morador.id === moradorId);
    const telefone = normalizePhone(moradorSelecionado?.telefone ?? "");

    if (!moradorSelecionado || !telefone || !created.codigo_retirada) {
      setToast({ message: "Encomenda cadastrada, mas não foi possível abrir o WhatsApp.", type: "error" });
      return;
    }

    const message = encodeURIComponent(
      `Olá ${moradorSelecionado.nome}, chegou uma encomenda para o apto ${moradorSelecionado.apartamento}. Código de retirada: ${created.codigo_retirada}. Favor retirar na portaria.`,
    );

    window.open(`https://wa.me/${telefone}?text=${message}`, "_blank", "noopener,noreferrer");

    setToast({ message: "Encomenda cadastrada com sucesso.", type: "success" });
    setTimeout(() => {
      router.push("/dashboard/encomendas");
      router.refresh();
    }, 500);
  };

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <section className="dashboard-content">
        <Toast message={toast?.message ?? null} type={toast?.type} onClose={() => setToast(null)} />
        <div className="glass-panel card">
          <div className="section-header">
            <div>
              <h2>Nova encomenda</h2>
              <p className="page-intro">Registro rápido com leitura assistida de rastreio.</p>
            </div>
            <button className="button button-secondary" onClick={() => setScannerOpen(true)}>Abrir scanner</button>
          </div>

          {loadingMoradores ? <div className="loading-state">Carregando moradores...</div> : null}
          {!loadingMoradores && filteredMoradores.length === 0 ? (
            <div className="empty-state">Nenhum morador encontrado para o filtro informado.</div>
          ) : null}

          <form onSubmit={submit} className="form-grid">
            <div>
              <label htmlFor="morador_search">Morador</label>
              <input
                id="morador_search"
                name="morador_search"
                value={moradorSearch}
                onChange={(event) => setMoradorSearch(event.target.value)}
                placeholder="Buscar por nome, apartamento ou telefone"
              />
              <select
                name="morador_id"
                id="morador_id"
                required
                value={selectedMoradorId}
                onChange={(event) => {
                  setSelectedMoradorId(event.target.value);
                  barcodeInputRef.current?.focus();
                }}
                disabled={loadingMoradores || filteredMoradores.length === 0}
                style={{ marginTop: "0.75rem" }}
              >
                <option value="">Selecione...</option>
                {filteredMoradores.map((morador) => (
                  <option key={morador.id} value={morador.id}>
                    {morador.display ?? `${morador.apartamento} - ${morador.nome}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="codigo_barras">Código de barras</label>
              <input
                id="codigo_barras"
                name="codigo_barras"
                ref={barcodeInputRef}
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    tipoSelectRef.current?.focus();
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="tipo">Tipo de encomenda</label>
              <select id="tipo" name="tipo" required defaultValue="" ref={tipoSelectRef}>
                <option value="" disabled>
                  Selecione...
                </option>
                {TIPOS_ENCOMENDA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <button className="button button-primary" type="submit" disabled={loadingMoradores || filteredMoradores.length === 0}>
              Salvar e notificar via WhatsApp
            </button>
          </form>
        </div>
      </section>

      {scannerOpen ? (
        <div className="modal-backdrop">
          <div className="modal glass-panel">
            <h2>Scanner de rastreio</h2>
            <p className="page-intro">Use um leitor de código de barras conectado e cole o código abaixo.</p>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de barras" autoFocus />
            <div className="actions-row" style={{ marginTop: "1rem" }}>
              <button className="button button-primary" onClick={() => setScannerOpen(false)}>Aplicar código</button>
              <button className="button button-secondary" onClick={() => setScannerOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
