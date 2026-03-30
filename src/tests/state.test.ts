import { describe, expect, it } from "bun:test";
import { createMemoryPersistence, sanitizePersistedState } from "../state/persistence";
import { buildDefaultColumnDraft, buildRowDraft, buildRowPayload } from "../utils/schema";
import type { ColumnSummary } from "../app/types";

describe("persistence", () => {
  it("stores and restores session cookie and selection state", async () => {
    const persistence = createMemoryPersistence();

    await persistence.write({
      endpoint: "http://localhost:9501/v1",
      mode: "cloud",
      multiRegion: false,
      sessionCookie: "cookie=value",
      selectedOrganizationId: "org_1",
      selectedProjectId: "project_1",
      selectedService: "databases",
      selectedDatabaseId: "db_1",
      selectedTableId: "table_1",
    });

    const restored = await persistence.read();
    expect(restored.sessionCookie).toBe("cookie=value");
    expect(restored.selectedProjectId).toBe("project_1");
    expect(restored.selectedService).toBe("databases");
  });

  it("sanitizes malformed state payloads", () => {
    const restored = sanitizePersistedState({
      mode: "selfhosted",
      sessionCookie: 123,
      selectedService: "auth",
    });

    expect(restored.mode).toBe("selfhosted");
    expect(restored.sessionCookie).toBeNull();
    expect(restored.selectedService).toBe("auth");
  });
});

describe("schema helpers", () => {
  it("creates starter column drafts", () => {
    const draft = buildDefaultColumnDraft(0);
    expect(draft.key).toBe("title");
    expect(draft.required).toBe(true);
  });

  it("builds row payloads from schema-aware input", () => {
    const columns: ColumnSummary[] = [
      { key: "title", type: "string", required: true },
      { key: "done", type: "boolean" },
      { key: "priority", type: "integer" },
    ];

    const draft = buildRowDraft(columns);
    const payload = buildRowPayload(columns, {
      ...draft,
      title: "Ship TUI",
      done: true,
      priority: "3",
    });

    expect(payload).toEqual({
      title: "Ship TUI",
      done: true,
      priority: 3,
    });
  });
});
