"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/dashboard/moradores", label: "Moradores" },
  { href: "/dashboard/encomendas", label: "Encomendas" },
  { href: "/dashboard/encomendas/new", label: "Nova encomenda" },
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
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="button button-secondary"
            style={{ background: pathname === link.href ? "#bfdbfe" : undefined }}
          >
            {link.label}
          </Link>
        ))}
        <button onClick={logout} className="button button-danger" style={{ marginLeft: "auto" }}>
          Sair
        </button>
      </div>
    </div>
  );
}
