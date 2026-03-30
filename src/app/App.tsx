import React, { useEffect, useRef, useState } from "react";
import { AppwriteConsoleService, isUnauthorized } from "../sdk/service";
import { createFilePersistence, defaultPersistedState, type PersistenceAdapter } from "../state/persistence";
import { buildDefaultColumnDraft, buildRowDraft, buildRowPayload, COLUMN_TYPES } from "../utils/schema";
import { readRuntimeConfig } from "./config";
import type {
  AccountSummary,
  ColumnSummary,
  ConsoleService,
  DatabaseSummary,
  IndexSummary,
  LogEntry,
  ModalState,
  OrganizationSummary,
  PersistedState,
  ProjectSummary,
  RowPage,
  RowSummary,
  RuntimeConfig,
  TableSummary,
  TableTab,
  UsageStats,
  UserSummary,
} from "./types";
import { Field, Modal, ToggleRow, type Viewport, Button } from "../components/primitives";
import { LoginScreen, OrganizationsScreen, ProjectWorkspaceScreen } from "../features/screens";

function readViewport(): Viewport {
  return {
    width: (process.stdout.columns ?? Number(process.env.APPWRITE_TUI_HEADLESS_WIDTH ?? 160)) || 160,
    height: (process.stdout.rows ?? Number(process.env.APPWRITE_TUI_HEADLESS_HEIGHT ?? 48)) || 48,
  };
}

function useViewport() {
  const [viewport, setViewport] = useState<Viewport>(() => readViewport());

  useEffect(() => {
    const handleResize = () => setViewport(readViewport());
    process.stdout.on("resize", handleResize);
    return () => {
      process.stdout.off("resize", handleResize);
    };
  }, []);

  return viewport;
}

function pickId<T extends { $id: string }>(preferredId: string | null, items: T[]): string | null {
  if (preferredId && items.some((item) => item.$id === preferredId)) return preferredId;
  return items[0]?.$id ?? null;
}

type AlertState = { tone: "success" | "warning" | "danger"; message: string } | null;

export interface AppProps {
  service?: ConsoleService;
  persistence?: PersistenceAdapter;
  config?: RuntimeConfig;
}

export function App(props: AppProps) {
  const runtimeConfig = props.config ?? readRuntimeConfig();
  const persistence = useRef(props.persistence ?? createFilePersistence()).current;
  const viewport = useViewport();

  const [persisted, setPersisted] = useState<PersistedState>(defaultPersistedState);
  const [hydrated, setHydrated] = useState(false);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [organizationSearch, setOrganizationSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [databaseSearch, setDatabaseSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [databases, setDatabases] = useState<DatabaseSummary[]>([]);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [columns, setColumns] = useState<ColumnSummary[]>([]);
  const [rows, setRows] = useState<RowPage | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [rowOffset, setRowOffset] = useState(0);
  const [rowsReloadToken, setRowsReloadToken] = useState(0);
  const [modal, setModal] = useState<ModalState | null>(null);

  const [tableTab, setTableTab] = useState<TableTab>("rows");
  const [indexes, setIndexes] = useState<IndexSummary[]>([]);
  const [tableLogs, setTableLogs] = useState<LogEntry[]>([]);
  const [tableUsage, setTableUsage] = useState<UsageStats | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string; value: string } | null>(null);

  const serviceRef = useRef<ConsoleService | (ConsoleService & { destroy?: () => void }) | null>(null);

  if (!serviceRef.current) {
    serviceRef.current =
      props.service ??
      new AppwriteConsoleService(runtimeConfig, (cookie) => {
        setPersisted((current) => ({ ...current, sessionCookie: cookie }));
      });
  }

  const service = serviceRef.current;

  function patchPersisted(patch: Partial<PersistedState>) {
    setPersisted((current) => ({ ...current, ...patch }));
  }

  function clearWorkspaceSelection() {
    patchPersisted({
      selectedProjectId: null,
      selectedDatabaseId: null,
      selectedTableId: null,
      selectedService: "auth",
    });
    setSelectedUserId(null);
    setSelectedRowId(null);
    setRows(null);
    setTables([]);
    setColumns([]);
    setDatabases([]);
    setTableTab("rows");
    setIndexes([]);
    setTableLogs([]);
    setTableUsage(null);
    setEditingCell(null);
  }

  function expireSession(message: string) {
    service.restoreSession(null);
    setAccount(null);
    setOrganizations([]);
    setProjects([]);
    setUsers([]);
    setUserTotal(0);
    setDatabases([]);
    setTables([]);
    setColumns([]);
    setRows(null);
    setSelectedUserId(null);
    setSelectedRowId(null);
    setIndexes([]);
    setTableLogs([]);
    setTableUsage(null);
    setTableTab("rows");
    setEditingCell(null);
    setAlert({ tone: "warning", message });
    setModal(null);
    setPassword("");
    setPersisted((current) => ({
      ...current,
      sessionCookie: null,
      selectedProjectId: null,
      selectedDatabaseId: null,
      selectedTableId: null,
    }));
  }

  function handleError(error: unknown, fallback: string) {
    if (isUnauthorized(error)) {
      expireSession("Your Appwrite session expired. Sign in again to keep using the Console clone.");
      return;
    }

    setAlert({
      tone: "danger",
      message: error instanceof Error ? error.message : fallback,
    });
  }

  async function runTask<T>(message: string, task: () => Promise<T>): Promise<T | undefined> {
    setBusyMessage(message);
    try {
      return await task();
    } catch (error) {
      handleError(error, message);
      return undefined;
    } finally {
      setBusyMessage(null);
    }
  }

  const selectedOrganization =
    organizations.find((organization) => organization.$id === persisted.selectedOrganizationId) ?? null;
  const selectedProject = projects.find((project) => project.$id === persisted.selectedProjectId) ?? null;
  const selectedUser = users.find((user) => user.$id === selectedUserId) ?? null;
  const selectedDatabase =
    databases.find((database) => database.$id === persisted.selectedDatabaseId) ?? null;
  const selectedTable = tables.find((table) => table.$id === persisted.selectedTableId) ?? null;
  const selectedRow = rows?.rows.find((row) => row.$id === selectedRowId) ?? null;

  useEffect(() => {
    let disposed = false;

    void (async () => {
      const saved = await persistence.read();
      if (disposed) return;

      const merged: PersistedState = {
        ...saved,
        endpoint: runtimeConfig.endpoint,
        mode: runtimeConfig.mode,
        multiRegion: runtimeConfig.multiRegion,
      };

      setPersisted(merged);
      service.restoreSession(merged.sessionCookie);
      setHydrated(true);

      if (!merged.sessionCookie) return;

      setBusyMessage("Restoring Appwrite session…");
      try {
        const currentAccount = await service.getAccount();
        if (disposed) return;
        setAccount(currentAccount);

        const orgList = await service.listOrganizations();
        if (disposed) return;
        setOrganizations(orgList);

        const nextOrganizationId = pickId(merged.selectedOrganizationId, orgList);
        setPersisted((current) => ({ ...current, selectedOrganizationId: nextOrganizationId }));

        if (nextOrganizationId) {
          const projectList = await service.listProjects(nextOrganizationId);
          if (disposed) return;
          setProjects(projectList);
          setPersisted((current) => ({
            ...current,
            selectedProjectId: current.selectedProjectId
              ? pickId(current.selectedProjectId, projectList)
              : null,
          }));
        }
      } catch (error) {
        if (!disposed) {
          handleError(error, "Unable to restore the Appwrite session.");
        }
      } finally {
        if (!disposed) setBusyMessage(null);
      }
    })();

    return () => {
      disposed = true;
      if ("destroy" in service && typeof service.destroy === "function") {
        service.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void persistence.write(persisted);
  }, [hydrated, persistence, persisted]);

  useEffect(() => {
    if (!account || !persisted.selectedOrganizationId) {
      setProjects([]);
      return;
    }

    let disposed = false;

    void (async () => {
      const result = await runTask("Loading projects…", () =>
        service.listProjects(persisted.selectedOrganizationId!, projectSearch || undefined),
      );
      if (!result || disposed) return;

      setProjects(result);
      if (persisted.selectedProjectId && !result.some((project) => project.$id === persisted.selectedProjectId)) {
        clearWorkspaceSelection();
      }
    })();

    return () => {
      disposed = true;
    };
  }, [account, persisted.selectedOrganizationId, projectSearch]);

  useEffect(() => {
    if (!selectedProject || persisted.selectedService !== "auth") {
      setUsers([]);
      setUserTotal(0);
      return;
    }

    let disposed = false;

    void (async () => {
      const result = await runTask("Loading users…", () =>
        service.listUsers(selectedProject, userSearch || undefined, 0, 12),
      );
      if (!result || disposed) return;
      setUsers(result.users);
      setUserTotal(result.total);

      if (selectedUserId && !result.users.some((user) => user.$id === selectedUserId)) {
        setSelectedUserId(null);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [selectedProject, persisted.selectedService, userSearch]);

  useEffect(() => {
    if (!selectedProject || persisted.selectedService !== "databases") {
      setDatabases([]);
      return;
    }

    let disposed = false;

    void (async () => {
      const result = await runTask("Loading databases…", () =>
        service.listDatabases(selectedProject, databaseSearch || undefined),
      );
      if (!result || disposed) return;

      setDatabases(result);
      if (persisted.selectedDatabaseId && !result.some((database) => database.$id === persisted.selectedDatabaseId)) {
        patchPersisted({ selectedDatabaseId: null, selectedTableId: null });
      }
    })();

    return () => {
      disposed = true;
    };
  }, [selectedProject, persisted.selectedService, databaseSearch]);

  useEffect(() => {
    if (!selectedProject || !selectedDatabase || persisted.selectedService !== "databases") {
      setTables([]);
      setColumns([]);
      setRows(null);
      return;
    }

    let disposed = false;

    void (async () => {
      const result = await runTask("Loading tables…", () =>
        service.listTables(selectedProject, selectedDatabase.$id, tableSearch || undefined),
      );
      if (!result || disposed) return;
      setTables(result);
      if (persisted.selectedTableId && !result.some((table) => table.$id === persisted.selectedTableId)) {
        patchPersisted({ selectedTableId: null });
      }
    })();

    return () => {
      disposed = true;
    };
  }, [selectedProject, selectedDatabase, persisted.selectedService, tableSearch]);

  useEffect(() => {
    if (!selectedProject || !selectedDatabase || !selectedTable || persisted.selectedService !== "databases") {
      setColumns([]);
      setRows(null);
      return;
    }

    // Reset table tab and tab-specific data when selectedTable changes
    setTableTab("rows");
    setIndexes([]);
    setTableLogs([]);
    setTableUsage(null);
    setEditingCell(null);

    let disposed = false;

    void (async () => {
      const schema = await runTask("Loading table schema…", () =>
        service.listColumns(selectedProject, selectedDatabase.$id, selectedTable.$id),
      );
      if (!schema || disposed) return;
      setColumns(schema);

      const rowPage = await runTask("Loading rows…", () =>
        service.listRows(selectedProject, selectedDatabase.$id, selectedTable.$id, rowOffset, 10),
      );
      if (!rowPage || disposed) return;
      setRows(rowPage);

      if (selectedRowId && !rowPage.rows.some((row) => row.$id === selectedRowId)) {
        setSelectedRowId(null);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [selectedProject, selectedDatabase, selectedTable, persisted.selectedService, rowOffset, rowsReloadToken]);

  // Load indexes when indexes tab is active
  useEffect(() => {
    if (tableTab !== "indexes" || !selectedProject || !selectedDatabase || !selectedTable) return;

    let disposed = false;

    void (async () => {
      const result = await runTask("Loading indexes…", () =>
        service.listIndexes(selectedProject, selectedDatabase.$id, selectedTable.$id),
      );
      if (!result || disposed) return;
      setIndexes(result);
    })();

    return () => {
      disposed = true;
    };
  }, [tableTab, selectedProject, selectedDatabase, selectedTable]);

  // Load activity logs when activity tab is active
  useEffect(() => {
    if (tableTab !== "activity" || !selectedProject || !selectedDatabase || !selectedTable) return;

    let disposed = false;

    void (async () => {
      const result = await runTask("Loading activity logs…", () =>
        service.listTableLogs(selectedProject, selectedDatabase.$id, selectedTable.$id),
      );
      if (!result || disposed) return;
      setTableLogs(result);
    })();

    return () => {
      disposed = true;
    };
  }, [tableTab, selectedProject, selectedDatabase, selectedTable]);

  // Load usage stats when usage tab is active
  useEffect(() => {
    if (tableTab !== "usage" || !selectedProject || !selectedDatabase || !selectedTable) return;

    let disposed = false;

    void (async () => {
      const result = await runTask("Loading usage stats…", () =>
        service.getTableUsage(selectedProject, selectedDatabase.$id, selectedTable.$id),
      );
      if (!result || disposed) return;
      setTableUsage(result);
    })();

    return () => {
      disposed = true;
    };
  }, [tableTab, selectedProject, selectedDatabase, selectedTable]);

  async function handleUpdateRow(rowId: string, data: Record<string, unknown>) {
    if (!selectedProject || !selectedDatabase || !selectedTable) return;
    await runTask("Updating row…", () =>
      service.updateRow(selectedProject, selectedDatabase.$id, selectedTable.$id, rowId, data),
    );
    setRowsReloadToken((t) => t + 1);
  }

  async function handleDeleteRow(rowId: string) {
    if (!selectedProject || !selectedDatabase || !selectedTable) return;
    await runTask("Deleting row…", () =>
      service.deleteRow(selectedProject, selectedDatabase.$id, selectedTable.$id, rowId),
    );
    if (selectedRowId === rowId) setSelectedRowId(null);
    setRowsReloadToken((t) => t + 1);
  }

  async function handleDeleteIndex(key: string) {
    if (!selectedProject || !selectedDatabase || !selectedTable) return;
    await runTask("Deleting index…", () =>
      service.deleteIndex(selectedProject, selectedDatabase.$id, selectedTable.$id, key),
    );
    const refreshed = await runTask("Refreshing indexes…", () =>
      service.listIndexes(selectedProject, selectedDatabase.$id, selectedTable.$id),
    );
    if (refreshed) setIndexes(refreshed);
  }

  async function handleUpdateTable(input: { name?: string; enabled?: boolean; rowSecurity?: boolean }) {
    if (!selectedProject || !selectedDatabase || !selectedTable) return;
    const updated = await runTask("Updating table…", () =>
      service.updateTable(selectedProject, selectedDatabase.$id, selectedTable.$id, input),
    );
    if (!updated) return;
    setTables((current) =>
      current.map((t) => (t.$id === updated.$id ? updated : t)),
    );
    setAlert({ tone: "success", message: `Updated table ${updated.name}.` });
  }

  async function handleDeleteTable() {
    if (!selectedProject || !selectedDatabase || !selectedTable) return;
    await runTask("Deleting table…", () =>
      service.deleteTable(selectedProject, selectedDatabase.$id, selectedTable.$id),
    );
    setTables((current) => current.filter((t) => t.$id !== selectedTable.$id));
    patchPersisted({ selectedTableId: null });
    setSelectedRowId(null);
    setColumns([]);
    setRows(null);
    setTableTab("rows");
    setAlert({ tone: "success", message: `Deleted table ${selectedTable.name}.` });
  }

  async function handleDeleteColumn(key: string) {
    if (!selectedProject || !selectedDatabase || !selectedTable) return;
    await runTask("Deleting column…", () =>
      service.deleteColumn(selectedProject, selectedDatabase.$id, selectedTable.$id, key),
    );
    const refreshed = await runTask("Refreshing columns…", () =>
      service.listColumns(selectedProject, selectedDatabase.$id, selectedTable.$id),
    );
    if (refreshed) setColumns(refreshed);
  }

  async function handleLogin() {
    const loggedIn = await runTask("Signing into Appwrite…", async () => {
      const nextAccount = await service.login(email, password);
      const orgList = await service.listOrganizations();

      setAccount(nextAccount);
      setOrganizations(orgList);
      setProjects([]);
      setUsers([]);
      setDatabases([]);
      setTables([]);
      setColumns([]);
      setRows(null);
      setSelectedUserId(null);
      setSelectedRowId(null);

      patchPersisted({
        selectedOrganizationId: orgList[0]?.$id ?? null,
        selectedProjectId: null,
        selectedDatabaseId: null,
        selectedTableId: null,
        selectedService: "auth",
      });

      return nextAccount;
    });

    if (!loggedIn) return;

    setAlert({ tone: "success", message: "Signed in successfully. Your session is now persisted locally." });
    setPassword("");
  }

  async function handleLogout() {
    await runTask("Ending session…", async () => {
      await service.logout();
      expireSession("Signed out.");
    });
  }

  async function openCreateProjectModal() {
    if (!selectedOrganization) return;

    const regions =
      (await runTask("Loading regions…", () => service.listRegions(selectedOrganization.$id))) ?? [];
    const selectedRegion = regions.find((region) => region.default)?.$id ?? regions[0]?.$id ?? "";

    setModal({
      kind: "createProject",
      name: "",
      projectId: "",
      region: selectedRegion,
      regions,
    });
  }

  function openCreateRowModal() {
    setModal({
      kind: "createRow",
      rowId: "",
      values: buildRowDraft(columns),
      columns,
    });
  }

  async function submitModal() {
    if (!modal) return;

    if (modal.kind === "createOrganization") {
      const created = await runTask("Creating organization…", () => service.createOrganization(modal.name));
      if (!created) return;
      setModal(null);
      setAlert({ tone: "success", message: `Created organization ${created.name}.` });
      patchPersisted({
        selectedOrganizationId: created.$id,
        selectedProjectId: null,
        selectedDatabaseId: null,
        selectedTableId: null,
      });
      setOrganizations((current) => [created, ...current]);
      return;
    }

    if (modal.kind === "createProject" && selectedOrganization) {
      const created = await runTask("Creating project…", () =>
        service.createProject(selectedOrganization.$id, {
          name: modal.name,
          projectId: modal.projectId || undefined,
          region: modal.region || undefined,
        }),
      );

      if (!created) return;
      setProjects((current) => [created, ...current]);
      patchPersisted({
        selectedProjectId: created.$id,
        selectedService: "auth",
        selectedDatabaseId: null,
        selectedTableId: null,
      });
      setModal(null);
      setAlert({ tone: "success", message: `Created project ${created.name}.` });
      return;
    }

    if (modal.kind === "createUser" && selectedProject) {
      const created = await runTask("Creating user…", () =>
        service.createUser(selectedProject, {
          userId: modal.userId || undefined,
          name: modal.name || undefined,
          email: modal.email || undefined,
          phone: modal.phone || undefined,
          password: modal.password || undefined,
        }),
      );
      if (!created) return;
      setUsers((current) => [created, ...current]);
      setUserTotal((current) => current + 1);
      setSelectedUserId(created.$id);
      setModal(null);
      setAlert({ tone: "success", message: `Created user ${created.name || created.$id}.` });
      return;
    }

    if (modal.kind === "createDatabase" && selectedProject) {
      const created = await runTask("Creating database…", () =>
        service.createDatabase(selectedProject, {
          databaseId: modal.databaseId || undefined,
          name: modal.name,
        }),
      );
      if (!created) return;
      setDatabases((current) => [created, ...current]);
      patchPersisted({ selectedDatabaseId: created.$id, selectedTableId: null });
      setModal(null);
      setAlert({ tone: "success", message: `Created database ${created.name}.` });
      return;
    }

    if (modal.kind === "createTable" && selectedProject && selectedDatabase) {
      const created = await runTask("Creating table…", () =>
        service.createTable(selectedProject, selectedDatabase.$id, {
          tableId: modal.tableId || undefined,
          name: modal.name,
          rowSecurity: modal.rowSecurity,
          columns: modal.columns,
        }),
      );
      if (!created) return;
      setTables((current) => [created, ...current]);
      patchPersisted({ selectedTableId: created.$id });
      setModal(null);
      setAlert({ tone: "success", message: `Created table ${created.name}.` });
      return;
    }

    if (modal.kind === "createRow" && selectedProject && selectedDatabase && selectedTable) {
      const data = buildRowPayload(modal.columns, modal.values);
      const created = await runTask("Creating row…", () =>
        service.createRow(selectedProject, selectedDatabase.$id, selectedTable.$id, {
          rowId: modal.rowId || undefined,
          data,
        }),
      );
      if (!created) return;
      setRows((current) =>
        current
          ? {
              ...current,
              total: current.total + 1,
              rows: [created, ...current.rows],
            }
          : null,
      );
      setSelectedRowId(created.$id);
      setModal(null);
      setAlert({ tone: "success", message: `Created row ${created.$id}.` });
      return;
    }

    if (modal.kind === "createIndex" && selectedProject && selectedDatabase && selectedTable) {
      const created = await runTask("Creating index…", () =>
        service.createIndex(selectedProject, selectedDatabase.$id, selectedTable.$id, {
          key: modal.key,
          type: modal.type,
          columns: modal.columns,
          orders: modal.orders.length > 0 ? modal.orders : undefined,
        }),
      );
      if (!created) return;
      const refreshed = await runTask("Refreshing indexes…", () =>
        service.listIndexes(selectedProject, selectedDatabase.$id, selectedTable.$id),
      );
      if (refreshed) setIndexes(refreshed);
      setModal(null);
      setAlert({ tone: "success", message: `Created index ${created.key}.` });
      return;
    }

    if (modal.kind === "createColumn" && selectedProject && selectedDatabase && selectedTable) {
      await runTask("Creating column…", () =>
        service.createSingleColumn(
          selectedProject,
          selectedDatabase.$id,
          selectedTable.$id,
          modal.column,
        ),
      );
      const refreshed = await runTask("Refreshing columns…", () =>
        service.listColumns(selectedProject, selectedDatabase.$id, selectedTable.$id),
      );
      if (refreshed) setColumns(refreshed);
      setModal(null);
      setAlert({ tone: "success", message: `Created column ${modal.column.key}.` });
      return;
    }

    if (modal.kind === "editTableSettings" && selectedProject && selectedDatabase && selectedTable) {
      const updated = await runTask("Updating table settings…", () =>
        service.updateTable(selectedProject, selectedDatabase.$id, selectedTable.$id, {
          name: modal.name,
          enabled: modal.enabled,
          rowSecurity: modal.rowSecurity,
        }),
      );
      if (!updated) return;
      setTables((current) =>
        current.map((t) => (t.$id === updated.$id ? updated : t)),
      );
      setModal(null);
      setAlert({ tone: "success", message: `Updated table settings for ${updated.name}.` });
    }
  }

  function renderModal() {
    if (!modal) return null;

    if (modal.kind === "createOrganization") {
      return (
        <Modal
          viewport={viewport}
          title="Create organization"
          description="Starter plan only for v1. This mirrors the Console onboarding path."
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create organization" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field
            label="Organization name"
            value={modal.name}
            placeholder="Personal projects"
            onChange={(value) => setModal({ ...modal, name: value })}
            onSubmit={submitModal}
          />
        </Modal>
      );
    }

    if (modal.kind === "createProject") {
      return (
        <Modal
          viewport={viewport}
          title="Create project"
          description="Name, optional custom ID, and region selection in the Appwrite Console spirit."
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create project" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field
            label="Project name"
            value={modal.name}
            placeholder="Console TUI"
            onChange={(value) => setModal({ ...modal, name: value })}
          />
          <Field
            label="Custom ID"
            value={modal.projectId}
            placeholder="Optional"
            onChange={(value) => setModal({ ...modal, projectId: value })}
          />
          <Field
            label="Region"
            value={modal.region}
            placeholder="Region"
            helper={
              modal.regions.length > 0
                ? `Available: ${modal.regions.map((region) => region.$id).join(", ")}`
                : "Local setup or single-region deployment."
            }
            onChange={(value) => setModal({ ...modal, region: value })}
            onSubmit={submitModal}
          />
        </Modal>
      );
    }

    if (modal.kind === "createUser") {
      return (
        <Modal
          viewport={viewport}
          title="Create user"
          description="Email, phone, password, and basic metadata for the Auth workspace."
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create user" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field label="User ID" value={modal.userId} placeholder="Optional" onChange={(value) => setModal({ ...modal, userId: value })} />
          <Field label="Name" value={modal.name} placeholder="User name" onChange={(value) => setModal({ ...modal, name: value })} />
          <Field label="Email" value={modal.email} placeholder="name@example.com" onChange={(value) => setModal({ ...modal, email: value })} />
          <Field label="Phone" value={modal.phone} placeholder="+15555555555" onChange={(value) => setModal({ ...modal, phone: value })} />
          <Field label="Password" value={modal.password} placeholder="Required for email users" onChange={(value) => setModal({ ...modal, password: value })} onSubmit={submitModal} />
        </Modal>
      );
    }

    if (modal.kind === "createDatabase") {
      return (
        <Modal
          viewport={viewport}
          title="Create database"
          description="This uses the TablesDB API path behind the same dark Console interaction pattern."
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create database" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field label="Database name" value={modal.name} placeholder="Main data" onChange={(value) => setModal({ ...modal, name: value })} />
          <Field
            label="Database ID"
            value={modal.databaseId}
            placeholder="Optional"
            onChange={(value) => setModal({ ...modal, databaseId: value })}
            onSubmit={submitModal}
          />
        </Modal>
      );
    }

    if (modal.kind === "createTable") {
      return (
        <Modal
          viewport={viewport}
          title="Create table"
          description="Create a table with starter columns and row security controls, modeled after the Appwrite Console flow."
          width={108}
          height={34}
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Add column" onPress={() => setModal({ ...modal, columns: [...modal.columns, buildDefaultColumnDraft(modal.columns.length)] })} variant="ghost" />
              </box>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create table" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field label="Table name" value={modal.name} placeholder="todos" onChange={(value) => setModal({ ...modal, name: value })} />
          <Field label="Table ID" value={modal.tableId} placeholder="Optional" onChange={(value) => setModal({ ...modal, tableId: value })} />
          <ToggleRow
            label="Row security"
            description="Enable row-level permissions for a closer match to Console table creation."
            enabled={modal.rowSecurity}
            onToggle={() => setModal({ ...modal, rowSecurity: !modal.rowSecurity })}
          />
          {modal.columns.map((column, index) => (
            <box
              key={`${column.key}:${index}`}
              style={{
                flexDirection: "column",
                border: true,
                borderColor: "#2D2D31",
                paddingLeft: 1,
                paddingRight: 1,
                paddingTop: 1,
                paddingBottom: 1,
                marginBottom: 1,
              }}
            >
              <box style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 1 }}>
                <text content={`Column ${index + 1}`} style={{ fg: "#EDEDF0" }} />
                <Button
                  label="Remove"
                  onPress={() =>
                    setModal({
                      ...modal,
                      columns: modal.columns.filter((_, columnIndex) => columnIndex !== index),
                    })
                  }
                  variant="danger"
                  disabled={modal.columns.length === 1}
                />
              </box>
              <Field
                label="Key"
                value={column.key}
                placeholder="title"
                onChange={(value) =>
                  setModal({
                    ...modal,
                    columns: modal.columns.map((entry, columnIndex) =>
                      columnIndex === index ? { ...entry, key: value } : entry,
                    ),
                  })
                }
              />
              <Field
                label="Type"
                value={column.type}
                helper={`Cycle supported types: ${COLUMN_TYPES.join(", ")}`}
                onChange={(value) =>
                  setModal({
                    ...modal,
                    columns: modal.columns.map((entry, columnIndex) =>
                      columnIndex === index ? { ...entry, type: value as typeof entry.type } : entry,
                    ),
                  })
                }
              />
              <ToggleRow
                label="Required"
                description="Mark this column as required in the initial schema."
                enabled={column.required}
                onToggle={() =>
                  setModal({
                    ...modal,
                    columns: modal.columns.map((entry, columnIndex) =>
                      columnIndex === index ? { ...entry, required: !entry.required } : entry,
                    ),
                  })
                }
              />
              <Field
                label="Default"
                value={column.defaultValue}
                placeholder="Optional default value"
                onChange={(value) =>
                  setModal({
                    ...modal,
                    columns: modal.columns.map((entry, columnIndex) =>
                      columnIndex === index ? { ...entry, defaultValue: value } : entry,
                    ),
                  })
                }
              />
              {column.type === "string" ? (
                <Field
                  label="Size"
                  value={column.size}
                  placeholder="255"
                  onChange={(value) =>
                    setModal({
                      ...modal,
                      columns: modal.columns.map((entry, columnIndex) =>
                        columnIndex === index ? { ...entry, size: value } : entry,
                      ),
                    })
                  }
                />
              ) : column.type === "integer" || column.type === "float" ? (
                <>
                  <Field
                    label="Min"
                    value={column.min}
                    placeholder="Optional"
                    onChange={(value) =>
                      setModal({
                        ...modal,
                        columns: modal.columns.map((entry, columnIndex) =>
                          columnIndex === index ? { ...entry, min: value } : entry,
                        ),
                      })
                    }
                  />
                  <Field
                    label="Max"
                    value={column.max}
                    placeholder="Optional"
                    onChange={(value) =>
                      setModal({
                        ...modal,
                        columns: modal.columns.map((entry, columnIndex) =>
                          columnIndex === index ? { ...entry, max: value } : entry,
                        ),
                      })
                    }
                  />
                </>
              ) : null}
            </box>
          ))}
        </Modal>
      );
    }

    if (modal.kind === "createRow") {
      return (
        <Modal
          viewport={viewport}
          title="Create row"
          description="Fields are generated from the current table schema."
          width={96}
          height={34}
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create row" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field label="Row ID" value={modal.rowId} placeholder="Optional" onChange={(value) => setModal({ ...modal, rowId: value })} />
          {modal.columns.map((column) =>
            column.type === "boolean" ? (
              <ToggleRow
                key={column.key}
                label={column.key}
                description={`Boolean${column.required ? " • required" : ""}`}
                enabled={Boolean(modal.values[column.key])}
                onToggle={() =>
                  setModal({
                    ...modal,
                    values: {
                      ...modal.values,
                      [column.key]: !modal.values[column.key],
                    },
                  })
                }
              />
            ) : (
              <Field
                key={column.key}
                label={`${column.key}${column.required ? " *" : ""}`}
                value={String(modal.values[column.key] ?? "")}
                placeholder={column.type}
                onChange={(value) =>
                  setModal({
                    ...modal,
                    values: {
                      ...modal.values,
                      [column.key]: value,
                    },
                  })
                }
              />
            ),
          )}
        </Modal>
      );
    }

    if (modal.kind === "createIndex") {
      return (
        <Modal
          viewport={viewport}
          title="Create index"
          description="Define an index on the current table. Columns and orders are comma-separated."
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create index" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field
            label="Key"
            value={modal.key}
            placeholder="index_name"
            onChange={(value) => setModal({ ...modal, key: value })}
          />
          <Field
            label="Type"
            value={modal.type}
            helper="Available types: key, fulltext, unique"
            onChange={(value) => setModal({ ...modal, type: value })}
          />
          <Field
            label="Columns"
            value={modal.columns.join(", ")}
            placeholder="col1, col2"
            helper={
              modal.availableColumns.length > 0
                ? `Available: ${modal.availableColumns.map((c) => c.key).join(", ")}`
                : undefined
            }
            onChange={(value) =>
              setModal({
                ...modal,
                columns: value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          <Field
            label="Orders"
            value={modal.orders.join(", ")}
            placeholder="asc, desc (optional)"
            onChange={(value) =>
              setModal({
                ...modal,
                orders: value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            onSubmit={submitModal}
          />
        </Modal>
      );
    }

    if (modal.kind === "createColumn") {
      const column = modal.column;
      return (
        <Modal
          viewport={viewport}
          title="Create column"
          description="Add a single column to the current table."
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Create column" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field
            label="Key"
            value={column.key}
            placeholder="field_name"
            onChange={(value) => setModal({ ...modal, column: { ...column, key: value } })}
          />
          <Field
            label="Type"
            value={column.type}
            helper={`Supported types: ${COLUMN_TYPES.join(", ")}`}
            onChange={(value) =>
              setModal({ ...modal, column: { ...column, type: value as typeof column.type } })
            }
          />
          <ToggleRow
            label="Required"
            description="Mark this column as required."
            enabled={column.required}
            onToggle={() =>
              setModal({ ...modal, column: { ...column, required: !column.required } })
            }
          />
          <Field
            label="Default"
            value={column.defaultValue}
            placeholder="Optional default value"
            onChange={(value) => setModal({ ...modal, column: { ...column, defaultValue: value } })}
          />
          {column.type === "string" ? (
            <Field
              label="Size"
              value={column.size}
              placeholder="255"
              onChange={(value) => setModal({ ...modal, column: { ...column, size: value } })}
              onSubmit={submitModal}
            />
          ) : column.type === "integer" || column.type === "float" ? (
            <>
              <Field
                label="Min"
                value={column.min}
                placeholder="Optional"
                onChange={(value) => setModal({ ...modal, column: { ...column, min: value } })}
              />
              <Field
                label="Max"
                value={column.max}
                placeholder="Optional"
                onChange={(value) => setModal({ ...modal, column: { ...column, max: value } })}
                onSubmit={submitModal}
              />
            </>
          ) : null}
        </Modal>
      );
    }

    if (modal.kind === "editTableSettings") {
      return (
        <Modal
          viewport={viewport}
          title="Table settings"
          description="Update table name, toggle status, and manage row-level security."
          onClose={() => setModal(null)}
          footer={
            <>
              <box style={{ marginRight: 1 }}>
                <Button label="Delete table" onPress={async () => { setModal(null); await handleDeleteTable(); }} variant="danger" />
              </box>
              <box style={{ marginRight: 1 }}>
                <Button label="Cancel" onPress={() => setModal(null)} variant="ghost" />
              </box>
              <Button label="Save" onPress={submitModal} variant="primary" />
            </>
          }
        >
          <Field
            label="Name"
            value={modal.name}
            placeholder="Table name"
            onChange={(value) => setModal({ ...modal, name: value })}
          />
          <ToggleRow
            label="Enabled"
            description="Enable or disable this table."
            enabled={modal.enabled}
            onToggle={() => setModal({ ...modal, enabled: !modal.enabled })}
          />
          <ToggleRow
            label="Row security"
            description="Enable row-level permissions."
            enabled={modal.rowSecurity}
            onToggle={() => setModal({ ...modal, rowSecurity: !modal.rowSecurity })}
          />
        </Modal>
      );
    }

    return null;
  }

  return (
    <box style={{ width: viewport.width, height: viewport.height, position: "relative" }}>
      {account ? (
        selectedProject ? (
          <ProjectWorkspaceScreen
            viewport={viewport}
            account={account}
            organization={selectedOrganization!}
            project={selectedProject}
            service={persisted.selectedService}
            alert={alert}
            users={users}
            userTotal={userTotal}
            selectedUser={selectedUser}
            userSearch={userSearch}
            databases={databases}
            selectedDatabase={selectedDatabase}
            tables={tables}
            selectedTable={selectedTable}
            columns={columns}
            rows={rows}
            selectedRow={selectedRow}
            databaseSearch={databaseSearch}
            tableSearch={tableSearch}
            onOpenOrganizations={() => patchPersisted({ selectedProjectId: null, selectedDatabaseId: null, selectedTableId: null })}
            onLogout={handleLogout}
            onChangeService={(serviceId) => {
              patchPersisted({ selectedService: serviceId });
              setAlert(null);
            }}
            onChangeUserSearch={setUserSearch}
            onChangeDatabaseSearch={setDatabaseSearch}
            onChangeTableSearch={setTableSearch}
            onSelectUser={(user) => setSelectedUserId(user.$id)}
            onSelectDatabase={(database) => {
              patchPersisted({ selectedDatabaseId: database.$id, selectedTableId: null, selectedService: "databases" });
              setSelectedRowId(null);
              setRowOffset(0);
            }}
            onSelectTable={(table) => {
              patchPersisted({ selectedTableId: table.$id, selectedService: "databases" });
              setSelectedRowId(null);
              setRowOffset(0);
            }}
            onSelectRow={(row) => setSelectedRowId(row.$id)}
            onOpenCreateUser={() =>
              setModal({
                kind: "createUser",
                userId: "",
                name: "",
                email: "",
                phone: "",
                password: "",
              })
            }
            onOpenCreateDatabase={() =>
              setModal({
                kind: "createDatabase",
                databaseId: "",
                name: "",
              })
            }
            onOpenCreateTable={() =>
              setModal({
                kind: "createTable",
                tableId: "",
                name: "",
                rowSecurity: false,
                columns: [buildDefaultColumnDraft(0)],
              })
            }
            onOpenCreateRow={openCreateRowModal}
            onBackToDatabases={() => {
              patchPersisted({ selectedDatabaseId: null, selectedTableId: null });
              setSelectedRowId(null);
              setRowOffset(0);
            }}
            onBackToTables={() => {
              patchPersisted({ selectedTableId: null });
              setSelectedRowId(null);
              setRowOffset(0);
            }}
            onPrevRows={() => setRowOffset((current) => Math.max(0, current - 10))}
            onNextRows={() => {
              if (!rows) return;
              setRowOffset((current) => Math.min(current + 10, Math.max(rows.total - rows.limit, 0)));
            }}
            onRefreshRows={() => setRowsReloadToken((current) => current + 1)}
            tableTab={tableTab}
            indexes={indexes}
            tableLogs={tableLogs}
            tableUsage={tableUsage}
            editingCell={editingCell}
            onChangeTableTab={(tab: TableTab) => {
              setTableTab(tab);
              if (tab !== "indexes") setIndexes([]);
              if (tab !== "activity") setTableLogs([]);
              if (tab !== "usage") setTableUsage(null);
            }}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
            onCreateIndex={() => {
              setModal({
                kind: "createIndex",
                key: "",
                type: "key",
                columns: [],
                orders: [],
                availableColumns: columns,
              });
            }}
            onDeleteIndex={handleDeleteIndex}
            onDeleteColumn={handleDeleteColumn}
            onCreateSingleColumn={() => {
              setModal({
                kind: "createColumn",
                column: buildDefaultColumnDraft(0),
              });
            }}
            onUpdateTable={handleUpdateTable}
            onDeleteTable={handleDeleteTable}
            onOpenEditTableSettings={() => {
              if (!selectedTable) return;
              setModal({
                kind: "editTableSettings",
                name: selectedTable.name,
                enabled: selectedTable.enabled ?? true,
                rowSecurity: selectedTable.rowSecurity ?? false,
              });
            }}
            onStartEditCell={(rowId: string, columnKey: string, value: string) =>
              setEditingCell({ rowId, columnKey, value })
            }
            onSubmitEditCell={async () => {
              if (!editingCell || !selectedProject || !selectedDatabase || !selectedTable) return;
              await runTask("Updating cell…", () =>
                service.updateRow(
                  selectedProject,
                  selectedDatabase.$id,
                  selectedTable.$id,
                  editingCell.rowId,
                  { [editingCell.columnKey]: editingCell.value },
                ),
              );
              setEditingCell(null);
              setRowsReloadToken((t) => t + 1);
            }}
            onCancelEditCell={() => setEditingCell(null)}
            onEditCellChange={(value: string) =>
              setEditingCell((prev) => (prev ? { ...prev, value } : null))
            }
          />
        ) : (
          <OrganizationsScreen
            viewport={viewport}
            account={account}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
            organizationSearch={organizationSearch}
            projectSearch={projectSearch}
            projects={projects}
            selectedProjectId={persisted.selectedProjectId}
            busy={Boolean(busyMessage)}
            alert={alert}
            onChangeOrganizationSearch={async (value) => {
              setOrganizationSearch(value);
              const result = await runTask("Searching organizations…", () =>
                service.listOrganizations(value || undefined),
              );
              if (!result) return;
              setOrganizations(result);
              patchPersisted({ selectedOrganizationId: pickId(persisted.selectedOrganizationId, result) });
            }}
            onChangeProjectSearch={setProjectSearch}
            onSelectOrganization={(organization) => {
              patchPersisted({
                selectedOrganizationId: organization.$id,
                selectedProjectId: null,
                selectedDatabaseId: null,
                selectedTableId: null,
              });
              setAlert(null);
            }}
            onSelectProject={(project) => {
              patchPersisted({
                selectedProjectId: project.$id,
                selectedService: "auth",
                selectedDatabaseId: null,
                selectedTableId: null,
              });
              setSelectedUserId(null);
              setSelectedRowId(null);
            }}
            onOpenCreateOrganization={() =>
              setModal({
                kind: "createOrganization",
                name: "Personal projects",
              })
            }
            onOpenCreateProject={openCreateProjectModal}
            onLogout={handleLogout}
          />
        )
      ) : (
        <LoginScreen
          viewport={viewport}
          endpoint={persisted.endpoint}
          email={email}
          password={password}
          busy={Boolean(busyMessage)}
          alert={alert}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
        />
      )}

      {busyMessage ? (
        <box
          style={{
            position: "absolute",
            right: 2,
            bottom: 1,
            backgroundColor: "#252529",
            border: true,
            borderColor: "#414146",
            paddingLeft: 1,
            paddingRight: 1,
          }}
        >
          <text content={busyMessage} style={{ fg: "#EDEDF0" }} />
        </box>
      ) : null}

      {renderModal()}
    </box>
  );
}
