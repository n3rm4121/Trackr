const SPEC = {
  VITE_API_URL: "where the API lives",
  VITE_SITE_NAME: "the product's name",
} as const;

type EnvKey = keyof typeof SPEC;

function readEnv(): Record<EnvKey, string> {
  const raw: Record<string, string | undefined> = import.meta.env;
  const values = {} as Record<EnvKey, string>;
  const missing: string[] = [];

  for (const [key, purpose] of Object.entries(SPEC)) {
    const value = raw[key]?.trim();
    if (value) {
      values[key as EnvKey] = value;
    } else {
      missing.push(`${key} (${purpose})`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing environment ${missing.length === 1 ? "variable" : "variables"}: ` +
        `${missing.join(", ")}. Copy apps/web/.env.example to apps/web/.env ` +
        "and fill it in.",
    );
  }

  return values;
}

const env = readEnv();

function apiBaseUrl(value: string): string {
  // Same-origin in production: the web app and the API share one domain and
  // Vercel routes /api/* to the api service (see vercel.json). A relative
  // base keeps preview deployments working without knowing their URL upfront.
  if (value.startsWith("/")) {
    if (/\s/.test(value)) {
      throw new Error(`VITE_API_URL must not contain whitespace, got "${value}"`);
    }
    return value.replace(/\/+$/, "") || "/";
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `VITE_API_URL must be an absolute URL such as http://localhost:3000/api or a same-origin path such as /api, got "${value}"`,
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`VITE_API_URL must be http or https, got "${value}"`);
  }
  return value.replace(/\/+$/, "");
}

export const config = {
  apiUrl: apiBaseUrl(env.VITE_API_URL),

  site: {
    name: env.VITE_SITE_NAME,
  },
  themeStorageKey: "trackr-theme",
} as const;
