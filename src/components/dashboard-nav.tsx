"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: "◻" },
  { href: "/dashboard/moradores", label: "Moradores", icon: "◉" },
  { href: "/dashboard/encomendas", label: "Encomendas", icon: "▣" },
  { href: "/dashboard/encomendas/new", label: "Nova encomenda", icon: "✦" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="app-header card">
        <div className="brand-row">
          <Image src="/logo.png" alt="Logo CarpeDiem" width={34} height={34} className="brand-logo" priority />
          <div>
            <p className="app-subtitle">Portaria CarpeDiem</p>
            <h1 className="app-title">Painel administrativo</h1>
          </div>
        </div>
        <button onClick={logout} className="button button-danger" type="button">
          Sair
        </button>
      </header>
      <aside className="sidebar card">
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
    </>
  );
}
