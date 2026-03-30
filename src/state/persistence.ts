import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { PersistedState } from "../app/types";

export interface PersistenceAdapter {
  read(): Promise<PersistedState>;
  write(state: PersistedState): Promise<void>;
  clear(): Promise<void>;
}

export function defaultPersistedState(): PersistedState {
  return {
    endpoint: "http://localhost:9501/v1",
    mode: "cloud",
    multiRegion: false,
    sessionCookie: null,
    selectedOrganizationId: null,
    selectedProjectId: null,
    selectedService: "auth",
    selectedDatabaseId: null,
    selectedTableId: null,
  };
}

export function sanitizePersistedState(input: unknown): PersistedState {
  const fallback = defaultPersistedState();
  if (!input || typeof input !== "object") return fallback;

  const candidate = input as Partial<PersistedState>;

  return {
    endpoint: typeof candidate.endpoint === "string" ? candidate.endpoint : fallback.endpoint,
    mode: candidate.mode === "selfhosted" ? "selfhosted" : "cloud",
    multiRegion: Boolean(candidate.multiRegion),
    sessionCookie: typeof candidate.sessionCookie === "string" ? candidate.sessionCookie : null,
    selectedOrganizationId:
      typeof candidate.selectedOrganizationId === "string" ? candidate.selectedOrganizationId : null,
    selectedProjectId:
      typeof candidate.selectedProjectId === "string" ? candidate.selectedProjectId : null,
    selectedService:
      typeof candidate.selectedService === "string"
        ? (candidate.selectedService as PersistedState["selectedService"])
        : fallback.selectedService,
    selectedDatabaseId:
      typeof candidate.selectedDatabaseId === "string" ? candidate.selectedDatabaseId : null,
    selectedTableId: typeof candidate.selectedTableId === "string" ? candidate.selectedTableId : null,
  };
}

export function createMemoryPersistence(seed?: Partial<PersistedState>): PersistenceAdapter {
  let state = { ...defaultPersistedState(), ...seed };

  return {
    async read() {
      return state;
    },
    async write(next) {
      state = next;
    },
    async clear() {
      state = defaultPersistedState();
    },
  };
}

export function createFilePersistence(customPath?: string): PersistenceAdapter {
  const filePath =
    customPath ??
    path.join(os.homedir(), ".config", "appwrite-console-tui", "state.json");

  return {
    async read() {
      try {
        const raw = await fs.readFile(filePath, "utf8");
        return sanitizePersistedState(JSON.parse(raw));
      } catch {
        return defaultPersistedState();
      }
    },
    async write(state) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    },
    async clear() {
      await this.write(defaultPersistedState());
    },
  };
}
