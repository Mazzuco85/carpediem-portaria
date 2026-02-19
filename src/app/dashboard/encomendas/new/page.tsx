"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { MoradorV2 } from "@/lib/types";

const TIPOS_ENCOMENDA = ["Caixa", "Bag", "Padrão", "Envelope", "Outro"] as const;

function normalizePhone(rawPhone: string) {
  const onlyDigits = (rawPhone ?? "").replace(/\D/g, "");
  if (!onlyDigits) return "";
  return onlyDigits.startsWith("55") ? onlyDigits : `55${onlyDigits}`;
}

export default function NewEncomendaPage() {
  const router = useRouter();

  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const tipoSelectRef = useRef<HTMLSelectElement>(null);

  const [moradores, setMoradores] = useState<MoradorV2[]>([]);
  const [selectedMoradorId, setSelectedMoradorId] = useState("");
  const [moradorSearch, setMoradorSearch] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loadingMoradores, setLoadingMoradores] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS_ENCOMENDA)[number]>("Padrão");
  const [observacoes, setObservacoes] = useState("");

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
        if (!controller.signal.aborted) {
          setLoadingMoradores(false);
        }
      }
    };

    void loadMoradores();
    return () => controller.abort();
  }, []);

  const filteredMoradores = useMemo(() => {
    const raw = moradorSearch.trim().toLocaleLowerCase("pt-BR");
    if (!raw) return moradores;

    const terms = raw.split(/\s+/).map((t) => t.trim()).filter(Boolean);

    return moradores.filter((m) => {
      const searchable = `${m.nome ?? ""} ${m.apartamento ?? ""} ${(m.telefone ?? "").replace(/\D/g, "")}`
        .toLocaleLowerCase("pt-BR");
      return terms.every((t) => searchable.includes(t));
    });
  }, [moradorSearch, moradores]);

  // Auto-seleciona no dropdown quando o filtro deixa só 1 resultado
  useEffect(() => {
    if (!moradorSearch.trim()) return;
    if (filteredMoradores.length === 1) {
      const only = filteredMoradores[0];
      if (only?.id && only.id !== selectedMoradorId) {
        setSelectedMoradorId(only.id);
        window.setTimeout(() => barcodeInputRef.current?.focus(), 50);
      }
    }
  }, [filteredMoradores, moradorSearch, selectedMoradorId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMoradorId) {
      setToast({ message: "Selecione um morador.", type: "error" });
      searchRef.current?.focus();
      return;
    }

    const response = await fetch("/api/encomendas-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        morador_id: selectedMoradorId,
        tipo,
        descricao: `Encomenda (${tipo})`,
        codigo_barras: codigo.trim() || null,
        observacoes: observacoes.trim() || null,
      }),
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      setToast({ message: txt || "Não foi possível criar encomenda.", type: "error" });
      return;
    }

    const created = (await response.json()) as { codigo_retirada?: string };
    const moradorSelecionado = moradores.find((m) => m.id === selectedMoradorId);
    const telefone = normalizePhone(moradorSelecionado?.telefone ?? "");

    // Se tiver WhatsApp, abre mensagem; se não, só salva e volta
    if (moradorSelecionado && telefone && created.codigo_retirada) {
      const msg = encodeURIComponent(
        [
          `Olá ${moradorSelecionado.nome ?? "morador"}!`,
          `Sua encomenda chegou na portaria ✅`,
          ``,
          `🏠 Apto: ${moradorSelecionado.apartamento ?? "-"}`,
          `📦 Tipo: ${tipo}`,
          codigo.trim() ? `🏷️ Código de barras: ${codigo.trim()}` : null,
          created.codigo_retirada ? `🔎 Código de retirada: ${created.codigo_retirada}` : null,
          observacoes.trim() ? `📝 Observações: ${observacoes.trim()}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );

      window.open(`https://wa.me/${telefone}?text=${msg}`, "_blank", "noopener,noreferrer");
    }

    setToast({ message: "Encomenda cadastrada com sucesso.", type: "success" });

    setTimeout(() => {
      router.push("/dashboard/encomendas");
      router.refresh();
    }, 400);
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
                Use <b>Observações</b> quando não houver código de barras e para registrar contexto de recebimento (ex: “deixado por X para Y”).
              </p>
            </div>
            <button className="button button-secondary" onClick={() => setScannerOpen(true)}>
              Abrir scanner
            </button>
          </div>

          {loadingMoradores ? <div className="loading-state">Carregando moradores...</div> : null}
          {!loadingMoradores && filteredMoradores.length === 0 ? (
            <div className="empty-state">Nenhum morador encontrado para o filtro informado.</div>
          ) : null}

          <form onSubmit={submit} className="form-grid">
            <div>
              <label htmlFor="morador_search">Buscar morador</label>
              <input
                ref={searchRef}
                id="morador_search"
                value={moradorSearch}
                onChange={(e) => setMoradorSearch(e.target.value)}
                placeholder="Digite nome, apto ou telefone"
              />

              <select
                name="morador_id"
                id="morador_id"
                required
                value={selectedMoradorId}
                onChange={(e) => {
                  setSelectedMoradorId(e.target.value);
                  barcodeInputRef.current?.focus();
                }}
                disabled={loadingMoradores || filteredMoradores.length === 0}
                style={{ marginTop: "0.75rem" }}
              >
                <option value="">Selecione...</option>
                {filteredMoradores.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display ?? `${m.apartamento ?? "-"} - ${m.nome ?? "Morador"}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="codigo_barras">Código de barras (opcional)</label>
              <input
                id="codigo_barras"
                ref={barcodeInputRef}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    tipoSelectRef.current?.focus();
                  }
                }}
                placeholder="Escaneie ou digite"
              />
            </div>

            <div>
              <label htmlFor="tipo">Tipo de encomenda</label>
              <select
                id="tipo"
                required
                ref={tipoSelectRef}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as (typeof TIPOS_ENCOMENDA)[number])}
              >
                {TIPOS_ENCOMENDA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="observacoes">Observações / Comentários (opcional)</label>
              <p className="helper-text">
                Dica: sem código de barras, descreva aqui como identificar a encomenda e quem deixou.
              </p>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder='Ex: "Deixado por fulano para beltrano" / "Retirado pelo filho"'
                rows={4}
              />
            </div>

            <button className="button button-primary" type="submit" disabled={loadingMoradores || filteredMoradores.length === 0}>
              Salvar e Notificar WhatsApp
            </button>
          </form>
        </div>
      </section>

      {scannerOpen ? (
        <div className="modal-backdrop">
          <div className="modal glass-panel">
            <h2>Scanner de rastreio</h2>
            <p className="page-intro">Cole o código abaixo (leitor de código de barras também funciona aqui).</p>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de barras" autoFocus />
            <div className="actions-row">
              <button className="button button-primary" onClick={() => setScannerOpen(false)}>
                Aplicar código
              </button>
              <button className="button button-secondary" onClick={() => setScannerOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
