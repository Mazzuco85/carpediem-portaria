import { getEnv, hasSupabaseConfig } from "@/lib/env";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  prefer?: string;
};

export async function supabaseRest<T>(tablePath: string, options: RequestOptions = {}): Promise<T> {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase environment variables are missing.");
  }

  const url = new URL(`${getEnv("SUPABASE_URL")}/rest/v1/${tablePath}`);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      Authorization: `Bearer ${getEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
      Prefer: options.prefer ?? "return=representation",
    },
    cache: "no-store",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
