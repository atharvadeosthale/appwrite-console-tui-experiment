import {
  Account,
  AppwriteException,
  BillingPlanGroup,
  Client,
  ID,
  Organizations,
  Platform,
  Projects,
  Query,
  TablesDB,
  Teams,
  Users,
  type Models,
} from "@appwrite.io/console";
import type {
  AccountSummary,
  ColumnSummary,
  ConsoleService,
  DatabaseSummary,
  IndexSummary,
  LogEntry,
  OrganizationSummary,
  ProjectSummary,
  RegionSummary,
  RowPage,
  RowSummary,
  RuntimeConfig,
  TableColumnDraft,
  TableSummary,
  UsageStats,
  UserSummary,
} from "../app/types";

type CookieListener = (cookie: string | null) => void;

let fetchPatched = false;
const cookieListeners = new Set<CookieListener>();

function patchFetchForCookies() {
  if (fetchPatched || typeof globalThis.fetch !== "function") return;
  const originalFetch = globalThis.fetch.bind(globalThis);

  const wrappedFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    const fallbackCookie =
      response.headers.get("X-Fallback-Cookies") ?? response.headers.get("x-fallback-cookies");

    if (fallbackCookie) {
      for (const listener of cookieListeners) {
        listener(fallbackCookie);
      }
    }

    return response;
  }) as typeof globalThis.fetch;

  Object.assign(wrappedFetch, originalFetch);

  globalThis.fetch = wrappedFetch;

  fetchPatched = true;
}

function subscribeCookie(listener: CookieListener): () => void {
  patchFetchForCookies();
  cookieListeners.add(listener);
  return () => cookieListeners.delete(listener);
}

function applySessionCookie(client: Client, cookie: string | null) {
  if (!cookie) {
    delete client.headers.Cookie;
    delete client.headers["X-Fallback-Cookies"];
    client.config.cookie = "";
    return;
  }

  client.setCookie(cookie);
  client.headers["X-Fallback-Cookies"] = cookie;
}

function resolveEndpoint(baseEndpoint: string, region: string | undefined, multiRegion: boolean): string {
  if (!multiRegion || !region) return baseEndpoint;
  const url = new URL(baseEndpoint);
  if (!url.hostname.startsWith(`${region}.`)) {
    url.hostname = `${region}.${url.hostname}`;
  }
  return url.toString();
}

function isCloudOrganization(value: Models.Organization | Models.Team): value is Models.Organization {
  return "billingPlanDetails" in value;
}

function mapAccount(account: Models.User<Models.Preferences>): AccountSummary {
  return {
    $id: account.$id,
    name: account.name,
    email: account.email,
  };
}

function mapOrganization(organization: Models.Organization | Models.Team): OrganizationSummary {
  if (isCloudOrganization(organization)) {
    return {
      $id: organization.$id,
      name: organization.name,
      kind: "organization",
      total: organization.total,
      billingPlan: organization.billingPlanDetails?.name ?? organization.billingPlan,
      billingPlanGroup: organization.billingPlanDetails?.group ?? BillingPlanGroup.Starter,
    };
  }

  return {
    $id: organization.$id,
    name: organization.name,
    kind: "team",
    total: organization.total,
    billingPlan: "Self-hosted",
  };
}

function mapProject(project: Models.Project): ProjectSummary {
  return {
    $id: project.$id,
    name: project.name,
    teamId: project.teamId,
    region: project.region,
    description: project.description,
    platforms: project.platforms as unknown as string[],
    $createdAt: project.$createdAt,
    $updatedAt: project.$updatedAt,
  };
}

function mapUser(user: Models.User<Models.Preferences>): UserSummary {
  return {
    $id: user.$id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    registration: user.registration,
    accessedAt: user.accessedAt,
    emailVerification: user.emailVerification,
    phoneVerification: user.phoneVerification,
  };
}

function mapDatabase(database: Models.Database): DatabaseSummary {
  return {
    $id: database.$id,
    name: database.name,
    enabled: database.enabled,
    $createdAt: database.$createdAt,
    $updatedAt: database.$updatedAt,
  };
}

function mapTable(table: Models.Table): TableSummary {
  return {
    $id: table.$id,
    databaseId: table.databaseId,
    name: table.name,
    enabled: table.enabled,
    rowSecurity: table.rowSecurity,
    $createdAt: table.$createdAt,
    $updatedAt: table.$updatedAt,
  };
}

function mapColumn(column: Models.ColumnBoolean | Models.ColumnInteger | Models.ColumnFloat | Models.ColumnDatetime | Models.ColumnString): ColumnSummary {
  return {
    key: column.key,
    type: column.type,
    status: column.status,
    required: column.required,
    array: column.array,
    size: "size" in column ? (column.size as number | undefined) : undefined,
    min: "min" in column ? (column.min as number | bigint | undefined) : undefined,
    max: "max" in column ? (column.max as number | bigint | undefined) : undefined,
    default: "default" in column ? column.default : undefined,
  };
}

function mapIndex(index: Models.ColumnIndex): IndexSummary {
  return {
    key: index.key,
    type: index.type,
    status: index.status,
    error: index.error,
    columns: index.columns,
    lengths: index.lengths,
    orders: index.orders ?? [],
    $createdAt: index.$createdAt,
    $updatedAt: index.$updatedAt,
  };
}

function mapLog(log: Models.Log): LogEntry {
  return {
    event: log.event,
    userId: log.userId,
    userEmail: log.userEmail,
    userName: log.userName,
    ip: log.ip,
    time: log.time,
    osName: log.osName,
    clientName: log.clientName,
    deviceName: log.deviceName,
  };
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 401;
}

export class AppwriteConsoleService implements ConsoleService {
  private readonly consoleClient: Client;
  private readonly projectClient: Client;
  private readonly account: Account;
  private readonly organizations: Organizations;
  private readonly teams: Teams;
  private readonly projects: Projects;
  private readonly users: Users;
  private readonly tablesDB: TablesDB;
  private readonly unsubscribeCookie: () => void;

  constructor(
    private readonly config: RuntimeConfig,
    onCookieChange: (cookie: string | null) => void,
  ) {
    this.consoleClient = new Client();
    this.projectClient = new Client();

    this.consoleClient.setEndpoint(config.endpoint).setProject("console");
    this.projectClient.setEndpoint(config.endpoint).setMode("admin");

    this.account = new Account(this.consoleClient);
    this.organizations = new Organizations(this.consoleClient);
    this.teams = new Teams(this.consoleClient);
    this.projects = new Projects(this.consoleClient);
    this.users = new Users(this.projectClient);
    this.tablesDB = new TablesDB(this.projectClient);

    this.unsubscribeCookie = subscribeCookie((cookie) => {
      this.restoreSession(cookie);
      onCookieChange(cookie);
    });
  }

  destroy() {
    this.unsubscribeCookie();
  }

  restoreSession(cookie: string | null) {
    applySessionCookie(this.consoleClient, cookie);
    applySessionCookie(this.projectClient, cookie);
  }

  private bindProject(project: ProjectSummary) {
    this.projectClient.setEndpoint(
      resolveEndpoint(this.config.endpoint, project.region, this.config.multiRegion),
    );
    this.projectClient.setProject(project.$id);
  }

  async getAccount(): Promise<AccountSummary> {
    return mapAccount(await this.account.get());
  }

  async login(email: string, password: string): Promise<AccountSummary> {
    await this.account.createEmailPasswordSession({ email, password });
    return this.getAccount();
  }

  async logout(): Promise<void> {
    try {
      await this.account.deleteSession({ sessionId: "current" });
    } catch {}
    this.restoreSession(null);
  }

  async listOrganizations(search?: string): Promise<OrganizationSummary[]> {
    if (this.config.mode === "cloud") {
      const result = await this.organizations.list({ search });
      return result.teams.map(mapOrganization);
    }

    const result = await this.teams.list({ search, total: true });
    return result.teams.map(mapOrganization);
  }

  async createOrganization(name: string): Promise<OrganizationSummary> {
    if (this.config.mode === "cloud") {
      const created = await this.organizations.create({
        organizationId: ID.unique(),
        name,
        billingPlan: "starter",
        platform: Platform.Appwrite,
      });

      if ("organizationId" in created) {
        throw new Error("Payment authentication is not supported in TUI mode.");
      }

      return mapOrganization(created);
    }

    return mapOrganization(
      await this.teams.create({
        teamId: ID.unique(),
        name,
      }),
    );
  }

  async listRegions(organizationId: string): Promise<RegionSummary[]> {
    if (this.config.mode !== "cloud") return [];
    const result = await this.organizations.listRegions({ organizationId });
    return result.regions
      .filter((region) => region.available && !region.disabled)
      .map((region) => ({
        $id: region.$id,
        name: region.name,
        default: region.default,
        available: region.available,
        disabled: region.disabled,
        flag: region.flag,
      }));
  }

  async listProjects(organizationId: string, search?: string): Promise<ProjectSummary[]> {
    const result = await this.projects.list({
      queries: [Query.equal("teamId", organizationId), Query.limit(100)],
      search,
      total: true,
    });

    return result.projects.map(mapProject);
  }

  async createProject(
    organizationId: string,
    input: { name: string; projectId?: string; region?: string },
  ): Promise<ProjectSummary> {
    const created = await this.projects.create({
      projectId: input.projectId?.trim() || ID.unique(),
      name: input.name,
      teamId: organizationId,
      region: input.region as never,
    });

    return mapProject(created);
  }

  async listUsers(
    project: ProjectSummary,
    search?: string,
    offset = 0,
    limit = 12,
  ): Promise<{ total: number; users: UserSummary[] }> {
    this.bindProject(project);
    const result = await this.users.list({
      queries: [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")],
      search,
      total: true,
    });

    return {
      total: result.total,
      users: result.users.map(mapUser),
    };
  }

  async createUser(
    project: ProjectSummary,
    input: { userId?: string; name?: string; email?: string; phone?: string; password?: string },
  ): Promise<UserSummary> {
    this.bindProject(project);
    const created = await this.users.create({
      userId: input.userId?.trim() || ID.unique(),
      name: input.name?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      password: input.password?.trim() || undefined,
    });

    return mapUser(created);
  }

  async listDatabases(project: ProjectSummary, search?: string): Promise<DatabaseSummary[]> {
    this.bindProject(project);
    const result = await this.tablesDB.list({
      queries: [Query.limit(100)],
      search,
      total: true,
    });

    return result.databases.map(mapDatabase);
  }

  async createDatabase(
    project: ProjectSummary,
    input: { databaseId?: string; name: string },
  ): Promise<DatabaseSummary> {
    this.bindProject(project);
    return mapDatabase(
      await this.tablesDB.create({
        databaseId: input.databaseId?.trim() || ID.unique(),
        name: input.name,
      }),
    );
  }

  async listTables(
    project: ProjectSummary,
    databaseId: string,
    search?: string,
  ): Promise<TableSummary[]> {
    this.bindProject(project);
    const result = await this.tablesDB.listTables({
      databaseId,
      queries: [Query.limit(100)],
      search,
      total: true,
    });

    return result.tables.map(mapTable);
  }

  private async createColumn(project: ProjectSummary, databaseId: string, tableId: string, draft: TableColumnDraft) {
    this.bindProject(project);
    const key = draft.key.trim();
    const required = draft.required;
    const common = { databaseId, tableId, key, required, array: draft.array };

    switch (draft.type) {
      case "integer":
        await this.tablesDB.createIntegerColumn({
          ...common,
          min: draft.min ? Number.parseInt(draft.min, 10) : undefined,
          max: draft.max ? Number.parseInt(draft.max, 10) : undefined,
          xdefault: draft.defaultValue ? Number.parseInt(draft.defaultValue, 10) : undefined,
        });
        break;
      case "float":
        await this.tablesDB.createFloatColumn({
          ...common,
          min: draft.min ? Number.parseFloat(draft.min) : undefined,
          max: draft.max ? Number.parseFloat(draft.max) : undefined,
          xdefault: draft.defaultValue ? Number.parseFloat(draft.defaultValue) : undefined,
        });
        break;
      case "boolean":
        await this.tablesDB.createBooleanColumn({
          ...common,
          xdefault: draft.defaultValue ? draft.defaultValue === "true" : undefined,
        });
        break;
      case "datetime":
        await this.tablesDB.createDatetimeColumn({
          ...common,
          xdefault: draft.defaultValue || undefined,
        });
        break;
      default:
        await this.tablesDB.createStringColumn({
          ...common,
          size: Number.parseInt(draft.size || "255", 10) || 255,
          xdefault: draft.defaultValue || undefined,
        });
    }
  }

  async createTable(
    project: ProjectSummary,
    databaseId: string,
    input: { tableId?: string; name: string; rowSecurity?: boolean; columns: TableColumnDraft[] },
  ): Promise<TableSummary> {
    this.bindProject(project);
    const created = await this.tablesDB.createTable({
      databaseId,
      tableId: input.tableId?.trim() || ID.unique(),
      name: input.name,
      rowSecurity: input.rowSecurity ?? false,
    });

    for (const column of input.columns.filter((draft) => draft.key.trim())) {
      await this.createColumn(project, databaseId, created.$id, column);
    }

    return mapTable(created);
  }

  async listColumns(project: ProjectSummary, databaseId: string, tableId: string): Promise<ColumnSummary[]> {
    this.bindProject(project);
    const result = await this.tablesDB.listColumns({ databaseId, tableId, total: true });
    return result.columns.map((column) => mapColumn(column as never));
  }

  async listRows(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    offset = 0,
    limit = 10,
  ): Promise<RowPage> {
    this.bindProject(project);
    const result = await this.tablesDB.listRows({
      databaseId,
      tableId,
      queries: [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")],
      total: true,
    });

    return {
      total: result.total,
      limit,
      offset,
      rows: result.rows as RowSummary[],
    };
  }

  async createRow(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    input: { rowId?: string; data: Record<string, unknown> },
  ): Promise<RowSummary> {
    this.bindProject(project);
    return (await this.tablesDB.createRow({
      databaseId,
      tableId,
      rowId: input.rowId?.trim() || ID.unique(),
      data: input.data,
    })) as RowSummary;
  }

  async updateRow(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    rowId: string,
    data: Record<string, unknown>,
  ): Promise<RowSummary> {
    this.bindProject(project);
    return (await this.tablesDB.updateRow({
      databaseId,
      tableId,
      rowId,
      data,
    })) as RowSummary;
  }

  async deleteRow(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    rowId: string,
  ): Promise<void> {
    this.bindProject(project);
    await this.tablesDB.deleteRow({ databaseId, tableId, rowId });
  }

  async listIndexes(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<IndexSummary[]> {
    this.bindProject(project);
    const result = await this.tablesDB.listIndexes({ databaseId, tableId, total: true });
    return result.indexes.map(mapIndex);
  }

  async createIndex(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    input: { key: string; type: string; columns: string[]; orders?: string[] },
  ): Promise<IndexSummary> {
    this.bindProject(project);
    const created = await this.tablesDB.createIndex({
      databaseId,
      tableId,
      key: input.key,
      type: input.type as never,
      columns: input.columns,
      orders: input.orders as never,
    });
    return mapIndex(created);
  }

  async deleteIndex(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    key: string,
  ): Promise<void> {
    this.bindProject(project);
    await this.tablesDB.deleteIndex({ databaseId, tableId, key });
  }

  async listTableLogs(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<LogEntry[]> {
    this.bindProject(project);
    const result = await this.tablesDB.listTableLogs({
      databaseId,
      tableId,
      queries: [Query.limit(50), Query.orderDesc("time")],
    });
    return result.logs.map(mapLog);
  }

  async getTableUsage(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<UsageStats> {
    this.bindProject(project);
    const result = await this.tablesDB.getTableUsage({ databaseId, tableId, range: "30d" as never });
    return {
      range: result.range,
      rowsTotal: result.rowsTotal,
      rows: result.rows.map((m: { value: number; date: string }) => ({ value: m.value, date: m.date })),
    };
  }

  async updateTable(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    input: { name?: string; enabled?: boolean; rowSecurity?: boolean },
  ): Promise<TableSummary> {
    this.bindProject(project);
    const updated = await this.tablesDB.updateTable({
      databaseId,
      tableId,
      name: input.name,
      enabled: input.enabled,
      rowSecurity: input.rowSecurity,
    });
    return mapTable(updated);
  }

  async deleteTable(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
  ): Promise<void> {
    this.bindProject(project);
    await this.tablesDB.deleteTable({ databaseId, tableId });
  }

  async deleteColumn(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    key: string,
  ): Promise<void> {
    this.bindProject(project);
    await this.tablesDB.deleteColumn({ databaseId, tableId, key });
  }

  async createSingleColumn(
    project: ProjectSummary,
    databaseId: string,
    tableId: string,
    draft: TableColumnDraft,
  ): Promise<void> {
    await this.createColumn(project, databaseId, tableId, draft);
  }
}
