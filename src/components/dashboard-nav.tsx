"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CdMonogram } from "@/components/cd-monogram";
import type { Encomenda, MoradorV2 } from "@/lib/types";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: "◈" },
  { href: "/dashboard/moradores", label: "Moradores", icon: "◉" },
  { href: "/dashboard/encomendas", label: "Encomendas", icon: "◫" },
  { href: "/dashboard/encomendas/new", label: "Nova encomenda", icon: "✦" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [moradoresCount, setMoradoresCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadCounters = async () => {
      try {
        const encomendasResponse = await fetch("/api/encomendas", { cache: "no-store", signal: controller.signal });
        if (encomendasResponse.ok) {
          const encomendas = (await encomendasResponse.json()) as Encomenda[];
          setPendingCount(Array.isArray(encomendas) ? encomendas.filter((item) => item.status === "pendente").length : 0);
        }
      } catch {
        // não bloqueia renderização caso contador falhe
      }

      try {
        const moradoresResponse = await fetch("/api/moradores-v2", { cache: "no-store", signal: controller.signal });
        if (moradoresResponse.ok) {
          const moradores = (await moradoresResponse.json()) as MoradorV2[];
          setMoradoresCount(Array.isArray(moradores) ? moradores.length : 0);
        }
      } catch {
        // não bloqueia renderização caso contador falhe
      }
    };

    void loadCounters();

    return () => controller.abort();
  }, []);

  const renderLabel = (label: string) => {
    if (label === "Encomendas" && pendingCount !== null) {
      return (
        <>
          {label}
          <span className="status-badge pendente" style={{ marginLeft: 8 }}>{pendingCount}</span>
        </>
      );
    }

    if (label === "Moradores" && moradoresCount !== null) {
      return (
        <>
          {label}
          <span className="status-badge" style={{ marginLeft: 8 }}>{moradoresCount}</span>
        </>
      );
    }

    return label;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="app-header glass-panel">
        <div className="brand-row">
          <CdMonogram size={42} />
          <div>
            <p className="app-subtitle">CarpeDiem Residences | Portaria</p>
            <h1 className="app-title">Operação Concierge</h1>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => setOpen(true)} className="button button-secondary menu-toggle" type="button" aria-label="Abrir menu">
            ☰
          </button>
          <button onClick={logout} className="button button-danger" type="button">
            Sair
          </button>
        </div>
      </header>

      <aside className="sidebar glass-panel desktop-sidebar">
        <p className="sidebar-title">Navegação</p>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-icon" aria-hidden="true">
                {link.icon}
              </span>
              {renderLabel(link.label)}
            </Link>
          );
        })}
      </aside>

      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`drawer ${open ? "open" : ""}`}>
        <p className="sidebar-title">Navegação</p>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`sidebar-link ${isActive ? "active" : ""}`} onClick={() => setOpen(false)}>
              <span className="sidebar-icon" aria-hidden="true">
                {link.icon}
              </span>
              {renderLabel(link.label)}
            </Link>
          );
        })}
      </aside>
    </>
  );
}
