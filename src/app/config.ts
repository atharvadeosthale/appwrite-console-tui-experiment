import type { RuntimeConfig } from "./types";

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (trimmed.endsWith("/v1")) return trimmed;
  return `${trimmed.replace(/\/+$/, "")}/v1`;
}

export function readRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const endpoint = normalizeEndpoint(
    env.APPWRITE_ENDPOINT ?? env.PUBLIC_APPWRITE_ENDPOINT ?? "http://localhost:9501/v1",
  );
  const mode = (env.APPWRITE_CONSOLE_MODE ??
    env.PUBLIC_CONSOLE_MODE ??
    "cloud") as RuntimeConfig["mode"];

  return {
    endpoint,
    mode: mode === "selfhosted" ? "selfhosted" : "cloud",
    multiRegion: readBoolean(
      env.APPWRITE_MULTI_REGION ?? env.PUBLIC_APPWRITE_MULTI_REGION,
      false,
    ),
  };
}
