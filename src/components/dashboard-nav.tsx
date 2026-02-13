"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CdMonogram } from "@/components/cd-monogram";

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
              {link.label}
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
              {link.label}
            </Link>
          );
        })}
      </aside>
    </>
  );
}
