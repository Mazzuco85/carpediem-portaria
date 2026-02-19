"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CdMonogram } from "@/components/cd-monogram";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
    });

    setLoading(false);
    if (!response.ok) return setError("Usuário ou senha inválidos.");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="login-shell">
      <div className="card login-card glass-panel">
        <div className="login-logo">
          <CdMonogram size={90} />
          <div>
            <h1>CarpeDiem Residences | Portaria</h1>
            <p className="page-intro">Acesse a operação premium da portaria.</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="form-grid">
          <div>
            <label htmlFor="username">Usuário</label>
            <input id="username" name="username" placeholder="Digite seu usuário" required />
          </div>
          <div>
            <label htmlFor="password">Senha</label>
            <div className="password-row">
              <input id="password" type={showPassword ? "text" : "password"} name="password" placeholder="Digite sua senha" required />
              <button className="button button-secondary" type="button" onClick={() => setShowPassword((state) => !state)}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          {error ? <div className="banner">{error}</div> : null}
          <button disabled={loading} className="button button-primary" type="submit">{loading ? "Entrando..." : "Entrar"}</button>
        </form>
      </div>
    </main>
  );
}
