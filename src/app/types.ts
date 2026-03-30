export type ConsoleMode = "cloud" | "selfhosted";

export type ServiceId =
  | "overview"
  | "auth"
  | "databases"
  | "functions"
  | "storage"
  | "messaging"
  | "sites"
  | "settings";

export type ColumnKind = "string" | "integer" | "float" | "boolean" | "datetime";

export interface RuntimeConfig {
  endpoint: string;
  mode: ConsoleMode;
  multiRegion: boolean;
}

export interface PersistedState {
  endpoint: string;
  mode: ConsoleMode;
  multiRegion: boolean;
  sessionCookie: string | null;
  selectedOrganizationId: string | null;
  selectedProjectId: string | null;
  selectedService: ServiceId;
  selectedDatabaseId: string | null;
  selectedTableId: string | null;
}

export interface AccountSummary {
  $id: string;
  name: string;
  email: string;
}

export interface OrganizationSummary {
  $id: string;
  name: string;
  kind: "organization" | "team";
  total?: number;
  billingPlan?: string;
  billingPlanGroup?: string;
}

export interface RegionSummary {
  $id: string;
  name: string;
  default: boolean;
  available: boolean;
  disabled: boolean;
  flag?: string;
}

export interface ProjectSummary {
  $id: string;
  name: string;
  teamId: string;
  region?: string;
  description?: string;
  platforms?: string[];
  $createdAt?: string;
  $updatedAt?: string;
}

export interface UserSummary {
  $id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: boolean;
  registration?: string;
  accessedAt?: string;
  emailVerification?: boolean;
  phoneVerification?: boolean;
}

export interface DatabaseSummary {
  $id: string;
  name: string;
  enabled?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface TableSummary {
  $id: string;
  databaseId: string;
  name: string;
  enabled?: boolean;
  rowSecurity?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface ColumnSummary {
  key: string;
  type: string;
  status?: string;
  required?: boolean;
  array?: boolean;
  size?: number;
  min?: number | bigint;
  max?: number | bigint;
  default?: unknown;
}

export interface RowSummary {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
  [key: string]: unknown;
}

export interface RowPage {
  total: number;
  limit: number;
  offset: number;
  rows: RowSummary[];
}

export interface TableColumnDraft {
  key: string;
  type: ColumnKind;
  required: boolean;
  defaultValue: string;
  size: string;
  min: string;
  max: string;
  array: boolean;
}

export interface IndexSummary {
  key: string;
  type: string;
  status: string;
  error?: string;
  columns: string[];
  lengths: number[];
  orders: string[];
  $createdAt?: string;
  $updatedAt?: string;
}

export interface LogEntry {
  event: string;
  userId: string;
  userEmail: string;
  userName: string;
  ip: string;
  time: string;
  osName: string;
  clientName: string;
  deviceName: string;
}

export interface UsageStats {
  range: string;
  rowsTotal: number;
  rows: Array<{ value: number; date: string }>;
}

export type TableTab = "rows" | "columns" | "indexes" | "activity" | "usage" | "settings";

export interface ConsoleService {
  restoreSession(cookie: string | null): void;
  getAccount(): Promise<AccountSummary>;
  login(email: string, password: string): Promise<AccountSummary>;
  logout(): Promise<void>;
  listOrganizations(search?: string): Promise<OrganizationSummary[]>;
  createOrganization(name: string): Promise<OrganizationSummary>;
  listRegions(organizationId: string): Promise<RegionSummary[]>;
  listProjects(organizationId: string, search?: string): Promise<ProjectSummary[]>;
  createProject(
    organizationId: string,
    input: { name: string; projectId?: string; region?: string },
  ): Promise<ProjectSummary>;
  listUsers(
    project: ProjectSummary,
    search?: string,
    offset?: number,
    limit?: number,
  ): Promise<{ total: number; users: UserSummary[] }>;
  createUser(
    project: ProjectSummary,
    input: { userId?: string; name?: string; email?: string; phone?: string; password?: string },
  ): Promise<UserSummary>;
  listDatabases(project: ProjectSummary, search?: string): Promise<DatabaseSummary[]>;
  createDatabase(
    project: ProjectSummary,
    input: { databaseId?: string; name: string },
  ): Promise<DatabaseSummary>;
  listTables(
    project: ProjectSummary,
    databaseId: string,
    search?: string,
  ): Promise<TableSummary[]>;
  createTable(
    project: ProjectSummary,
    databaseId: string,
    input: {
      tableId?: string;
      name: string;
      rowSecurity?: boolean;
      columns: TableColumnDraft[];
    },
  ): Promise<TableSummary>;
  listColumns(project: ProjectSummary, databaseId: string, tableId: string): Promise<ColumnSummary[]>;
  listRows(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    offset?: number,
    limit?: number,
  ): Promise<RowPage>;
  createRow(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    input: { rowId?: string; data: Record<string, unknown> },
  ): Promise<RowSummary>;
  updateRow(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    rowId: string,
    data: Record<string, unknown>,
  ): Promise<RowSummary>;
  deleteRow(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    rowId: string,
  ): Promise<void>;
  listIndexes(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<IndexSummary[]>;
  createIndex(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    input: { key: string; type: string; columns: string[]; orders?: string[] },
  ): Promise<IndexSummary>;
  deleteIndex(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    key: string,
  ): Promise<void>;
  listTableLogs(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<LogEntry[]>;
  getTableUsage(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<UsageStats>;
  updateTable(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    input: { name?: string; enabled?: boolean; rowSecurity?: boolean },
  ): Promise<TableSummary>;
  deleteTable(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<void>;
  deleteColumn(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    key: string,
  ): Promise<void>;
  createSingleColumn(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    draft: TableColumnDraft,
  ): Promise<void>;
}

export type ModalState =
  | { kind: "createOrganization"; name: string }
  | {
      kind: "createProject";
      name: string;
      projectId: string;
      region: string;
      regions: RegionSummary[];
    }
  | {
      kind: "createUser";
      userId: string;
      name: string;
      email: string;
      phone: string;
      password: string;
    }
  | { kind: "createDatabase"; databaseId: string; name: string }
  | {
      kind: "createTable";
      tableId: string;
      name: string;
      rowSecurity: boolean;
      columns: TableColumnDraft[];
    }
  | {
      kind: "createRow";
      rowId: string;
      values: Record<string, string | boolean>;
      columns: ColumnSummary[];
    }
  | {
      kind: "createIndex";
      key: string;
      type: string;
      columns: string[];
      orders: string[];
      availableColumns: ColumnSummary[];
    }
  | {
      kind: "createColumn";
      column: TableColumnDraft;
    }
  | {
      kind: "editTableSettings";
      name: string;
      enabled: boolean;
      rowSecurity: boolean;
    };
