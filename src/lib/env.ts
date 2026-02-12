type Key = "ADMIN_USER" | "ADMIN_PASS" | "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY";

export function getEnv(key: Key): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
