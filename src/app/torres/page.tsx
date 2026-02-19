type Torre = {
  codigo: string;
  nome: string;
};

async function getTorres(): Promise<Torre[]> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const response = await fetch(
    `${url}/rest/v1/torres?select=codigo,nome&order=codigo.asc`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as Torre[];
}

export default async function TorresPage() {
  const { torres, error } = await getTorres()
    .then((data) => ({ torres: data, error: null }))
    .catch((err: unknown) => ({
      torres: [] as Torre[],
      error: err instanceof Error ? err.message : "Erro ao carregar torres.",
    }));

  return (
    <main className="simple-page">
      <section className="card glass-panel simple-page-card">
        <h1>Torres</h1>
        <p className="page-intro">Consulta de torres cadastradas no condomínio.</p>
        {error ? (
          <p className="banner">{error}</p>
        ) : (
          <ul className="form-grid">
            {torres.map((torre) => (
              <li key={torre.codigo} className="entity-card">
                {torre.codigo} - {torre.nome}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
