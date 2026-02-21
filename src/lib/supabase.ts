import { getEnv, hasSupabaseConfig } from “@/lib/env”;

type RequestOptions = {
method?: “GET” | “POST” | “PATCH” | “DELETE”;
query?: Record<string, string | number | boolean | undefined>;
body?: unknown;
prefer?: string;
/**

- Controla o cache do fetch (Next.js).
- - “no-store”  → sem cache, sempre busca do banco (padrão para mutações e listas dinâmicas)
- - “force-cache” → cache agressivo (bom para dados estáticos/raramente alterados)
- - { revalidate: N } → ISR-style, revalida a cada N segundos
    */
    cache?: RequestCache | { revalidate: number };
    };

export class SupabaseError extends Error {
constructor(
message: string,
public readonly status: number,
public readonly body: string
) {
super(message);
this.name = “SupabaseError”;
}
}

export async function supabaseRest<T>(
tablePath: string,
options: RequestOptions = {}
): Promise<T> {
if (!hasSupabaseConfig()) {
throw new Error(“Supabase environment variables are missing.”);
}

const url = new URL(`${getEnv("SUPABASE_URL")}/rest/v1/${tablePath}`);

if (options.query) {
for (const [key, value] of Object.entries(options.query)) {
if (value !== undefined) {
url.searchParams.set(key, String(value));
}
}
}

// Resolve a opção de cache para o formato esperado pelo fetch
const cacheOption =
options.cache === undefined
? { cache: “no-store” as RequestCache }
: typeof options.cache === “object” && “revalidate” in options.cache
? { next: options.cache }
: { cache: options.cache as RequestCache };

const response = await fetch(url.toString(), {
method: options.method ?? “GET”,
headers: {
“Content-Type”: “application/json”,
apikey: getEnv(“SUPABASE_SERVICE_ROLE_KEY”),
Authorization: `Bearer ${getEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
Prefer: options.prefer ?? “return=representation”,
},
body: options.body ? JSON.stringify(options.body) : undefined,
…cacheOption,
});

if (!response.ok) {
const errorBody = await response.text();
throw new SupabaseError(
`Supabase request failed (${response.status}): ${errorBody}`,
response.status,
errorBody
);
}

if (response.status === 204) {
return null as T;
}

return (await response.json()) as T;
}
