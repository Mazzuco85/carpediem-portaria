"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Falha no login" }));
      setError(data.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="container" style={{ maxWidth: 420, marginTop: "12vh" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Portaria CarpeDiem</h1>
        <p>Faça login para continuar.</p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.8rem" }}>
          <div>
            <label htmlFor="username">Usuário</label>
            <input id="username" name="username" required />
          </div>
          <div>
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" name="password" required />
          </div>
          {error ? <p style={{ color: "#dc2626", margin: 0 }}>{error}</p> : null}
          <button disabled={loading} className="button button-primary" type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
