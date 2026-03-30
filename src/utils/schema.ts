import type { ColumnKind, ColumnSummary, RowSummary, TableColumnDraft } from "../app/types";

export const COLUMN_TYPES: ColumnKind[] = [
  "string",
  "integer",
  "float",
  "boolean",
  "datetime",
];

export function buildDefaultColumnDraft(index = 0): TableColumnDraft {
  return {
    key: index === 0 ? "title" : `field_${index + 1}`,
    type: "string",
    required: index === 0,
    defaultValue: "",
    size: "255",
    min: "",
    max: "",
    array: false,
  };
}

export function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/-+/g, "-")
    .slice(0, 36);
}

export function normalizeProjectIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+/g, "-")
    .slice(0, 36);
}

function parseSingleValue(type: string, value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  switch (type) {
    case "integer":
      return Number.parseInt(trimmed, 10);
    case "float":
      return Number.parseFloat(trimmed);
    case "boolean":
      return trimmed === "true";
    case "datetime":
      return new Date(trimmed).toISOString();
    default:
      return trimmed;
  }
}

export function buildRowDraft(columns: ColumnSummary[]): Record<string, string | boolean> {
  return Object.fromEntries(
    columns.map((column) => {
      if (column.type === "boolean") {
        return [column.key, Boolean(column.default)];
      }
      if (typeof column.default === "string") {
        return [column.key, column.default];
      }
      if (typeof column.default === "number" || typeof column.default === "bigint") {
        return [column.key, String(column.default)];
      }
      return [column.key, ""];
    }),
  );
}

export function buildRowPayload(
  columns: ColumnSummary[],
  values: Record<string, string | boolean>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const column of columns) {
    const raw = values[column.key];
    if (column.type === "boolean") {
      payload[column.key] = Boolean(raw);
      continue;
    }

    if (typeof raw !== "string") continue;
    if (column.array) {
      const items = raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => parseSingleValue(column.type, part));

      if (items.length > 0) {
        payload[column.key] = items;
      }
      continue;
    }

    const parsed = parseSingleValue(column.type, raw);
    if (parsed !== undefined && !(typeof parsed === "number" && Number.isNaN(parsed))) {
      payload[column.key] = parsed;
    }
  }

  return payload;
}

export function rowPreviewColumns(columns: ColumnSummary[], row: RowSummary): Array<[string, string]> {
  const preferred = columns.slice(0, 4).map((column) => column.key);
  return preferred.map((key) => [key, key in row ? String(row[key]) : "—"]);
}
