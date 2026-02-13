import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardOverview, type Shortcut } from "@/components/dashboard-overview";

function toTitle(segment: string) {
  return segment
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function loadShortcuts(): Promise<Shortcut[]> {
  const base = join(process.cwd(), "src/app/dashboard");
  const entries = await readdir(base, { withFileTypes: true });
  const shortcuts: Shortcut[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("[")) continue;
    const children = await readdir(join(base, entry.name));
    if (!children.includes("page.tsx")) continue;
    const href = `/dashboard/${entry.name}`;
    shortcuts.push({ href, title: toTitle(entry.name), description: `Gerenciar ${toTitle(entry.name).toLowerCase()}.` });
  }

  shortcuts.unshift({ href: "/dashboard/encomendas/new", title: "Nova Encomenda", description: "Registrar encomenda rapidamente." });
  return shortcuts;
}

export default async function DashboardPage() {
  const shortcuts = await loadShortcuts();

  return (
    <main className="container dashboard-layout">
      <DashboardNav />
      <DashboardOverview shortcuts={shortcuts} />
    </main>
  );
}
