"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { MoradorV2 } from "@/lib/types";

const TIPOS_ENCOMENDA = ["Caixa", "Bag", "Padrão", "Envelope", "Outro"] as const;

function onlyDigits(raw: string) {
  return (raw ?? "").replace(/\D/g, "");
}

function normalizePhone(rawPhone: string) {
  const d = onlyDigits(rawPhone);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export default function NewEncomendaPage() {
  const router = useRouter();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const moradorSelectRef = useRef<HTMLSelectElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const tipoSelectRef = useRef<HTMLSelectElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

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
        setMoradores(Array.isArray(data) ? data : []);
      } catch {
        if (!controller.signal.aborted) {
          setToast({ message: "Não foi possível carregar moradores para seleção.", type: "error" });
        }
      } finally {
        if (!controller.signal.aborted) setLoadingMoradores(false);
      }
    };

    void loadMoradores();
    return () => controller.abort();
  }, []);

  const filteredMoradores = useMemo(() => {
    const q = moradorSearch.trim().toLocaleLowerCase("pt-BR");
    if (!q) return moradores;

    const terms = q
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const qDigits = onlyDigits(q);

    return moradores.filter((morador) => {
      const nome = (morador.nome ?? "").toLocaleLowerCase("pt-BR");
      const apto = (morador.apartamento ?? "").toLocaleLowerCase("pt-BR");
      const telDigits = onlyDigits(morador.telefone ?? "");
      const display = (morador.display ?? "").toLocaleLowerCase("pt-BR");

      const searchableText = `${nome} ${apto} ${display}`.trim();
      const okText = terms.every((t) => searchableText.includes(t));

      const okDigits = qDigits ? telDigits.includes(qDigits) || onlyDigits(apto).includes(qDigits) : true;

      return okText && okDigits;
    });
  }, [moradorSearch, moradores]);

  // ✅ Auto-seleção quando houver 1 match (com busca preenchida)
  useEffect(() => {
    if (loadingMoradores) return;
    if (!moradorSearch.trim()) return;

    if (filteredMoradores.length === 1) {
      const only = filteredMoradores[0]!;
      if (selectedMoradorId !== only.id) {
        setSelectedMoradorId(only.id);
        window.setTimeout(() => barcodeInputRef.current?.focus(), 60);
      }
    } else {
      // Se selecionado não está mais no filtro, limpa
      if (selectedMoradorId && !filteredMoradores.some((m) => m.id === selectedMoradorId)) {
        setSelectedMoradorId("");
      }
    }
  }, [filteredMoradores, loadingMoradores, moradorSearch, selectedMoradorId]);

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
        codigo_barras: codigoBarras || null,
        tipo,
      }),
    });

    if (!response.ok) {
      setToast({ message: "Não foi possível criar encomenda.", type: "error" });
      return;
    }

    const created = (await response.json()) as { codigo_retirada?: string };

    const moradorSelecionado = moradores.find((m) => m.id === moradorId);
    const telefone = normalizePhone(moradorSelecionado?.telefone ?? "");

    if (!moradorSelecionado || !telefone || !created.codigo_retirada) {
      setToast({ message: "Encomenda cadastrada, mas não foi possível abrir o WhatsApp.", type: "error" });
      return;
    }

    const message = encodeURIComponent(
      `Olá ${moradorSelecionado.nome ?? "morador"}, chegou uma encomenda para o apto ${
        moradorSelecionado.apartamento ?? ""
      }. Código de retirada: ${created.codigo_retirada}. Favor retirar na portaria.`,
    );

    window.open(`https://wa.me/${telefone}?text=${message}`, "_blank", "noopener,noreferrer");

    setToast({ message: "Encomenda cadastrada com sucesso.", type: "success" });

    // Limpa campos (mantém busca e seleção se você quiser, mas aqui limpo busca pra próxima)
    setCodigo("");
    setMoradorSearch("");
    setSelectedMoradorId("");

    // Foco volta pra busca (fluxo portaria)
    window.setTimeout(() => searchInputRef.current?.focus(), 150);

    setTimeout(() => {
      router.push("/dashboard/encomendas");
      router.refresh();
    }, 500);
  };

  // ✅ Atalhos do “modo turbo” na busca
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // se tiver 1 match, seleciona e vai pro código de barras
      if (filteredMoradores.length === 1) {
        setSelectedMoradorId(filteredMoradores[0]!.id);
        window.setTimeout(() => barcodeInputRef.current?.focus(), 60);
      } else {
        // se tiver vários, pula pro dropdown pra escolher
        moradorSelectRef.current?.focus();
      }
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moradorSelectRef.current?.focus();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setMoradorSearch("");
      setSelectedMoradorId("");
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  };

  const handleBarcodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      tipoSelectRef.current?.focus();
    }
  };

  const handleTipoKeyDown = (event: React.KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // tenta salvar
      submitBtnRef.current?.click();
    }
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
              <p className="page-intro">
                Fluxo turbo: <b>Buscar</b> → <b>Auto-seleciona</b> → <b>Código de barras</b> → <b>Tipo</b> → <b>Salvar</b>.
              </p>
            </div>
            <button className="button button-secondary" type="button" onClick={() => setScannerOpen(true)}>
              Abrir scanner
            </button>
          </div>

          {loadingMoradores ? <div className="loading-state">Carregando moradores...</div> : null}

          {!loadingMoradores && moradorSearch.trim() && filteredMoradores.length === 0 ? (
            <div className="empty-state">Nenhum morador encontrado para o filtro informado.</div>
          ) : null}

          <form onSubmit={submit} className="form-grid">
            <div>
              <label htmlFor="morador_search">Buscar morador</label>
              <input
                ref={searchInputRef}
                id="morador_search"
                name="morador_search"
                value={moradorSearch}
                onChange={(event) => setMoradorSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Ex: 215 | Alekson | 551199..."
                autoComplete="off"
              />

              <select
                ref={moradorSelectRef}
                name="morador_id"
                id="morador_id"
                required
                value={selectedMoradorId}
                onChange={(event) => {
                  setSelectedMoradorId(event.target.value);
                  window.setTimeout(() => barcodeInputRef.current?.focus(), 40);
                }}
                disabled={loadingMoradores || filteredMoradores.length === 0}
                style={{ marginTop: "0.75rem" }}
              >
                <option value="">Selecione...</option>
                {filteredMoradores.map((morador) => (
                  <option key={morador.id} value={morador.id}>
                    {morador.display ?? `${morador.apartamento ?? ""} - ${morador.nome ?? ""}`}
                  </option>
                ))}
              </select>

              {moradorSearch.trim() ? (
                <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
                  {filteredMoradores.length} encontrado(s)
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="codigo_barras">Código de barras</label>
              <input
                id="codigo_barras"
                name="codigo_barras"
                ref={barcodeInputRef}
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Escaneie ou digite e aperte Enter"
              />
            </div>

            <div>
              <label htmlFor="tipo">Tipo de encomenda</label>
              <select id="tipo" name="tipo" required defaultValue="" ref={tipoSelectRef} onKeyDown={handleTipoKeyDown}>
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

            <button
              ref={submitBtnRef}
              className="button button-primary"
              type="submit"
              disabled={loadingMoradores || filteredMoradores.length === 0}
            >
              Salvar e Notificar WhatsApp
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
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  setScannerOpen(false);
                  window.setTimeout(() => tipoSelectRef.current?.focus(), 100);
                }}
              >
                Aplicar código
              </button>
              <button className="button button-secondary" type="button" onClick={() => setScannerOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
