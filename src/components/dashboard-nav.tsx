"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: "🏠" },
  { href: "/dashboard/moradores", label: "Moradores", icon: "👥" },
  { href: "/dashboard/encomendas", label: "Encomendas", icon: "📦" },
  { href: "/dashboard/encomendas/new", label: "Nova encomenda", icon: "➕" },
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
        <div>
          <p className="app-subtitle">Portaria CarpeDiem</p>
          <h1 className="app-title">Painel administrativo</h1>
        </div>
        <button onClick={logout} className="button button-danger" type="button">
          ⎋ Logout
        </button>
      </header>
      <aside className="sidebar card">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`sidebar-link ${isActive ? "active" : ""}`}>
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </aside>
    </>
  );
}
