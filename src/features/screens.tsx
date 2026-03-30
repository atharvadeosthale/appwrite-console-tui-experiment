import React from "react";
import type {
  AccountSummary,
  ColumnSummary,
  DatabaseSummary,
  IndexSummary,
  LogEntry,
  OrganizationSummary,
  ProjectSummary,
  RowPage,
  RowSummary,
  ServiceId,
  TableSummary,
  TableTab,
  UsageStats,
  UserSummary,
} from "../app/types";
import {
  AlertBanner,
  AppLogo,
  Badge,
  Button,
  Card,
  DataTable,
  DefinitionList,
  EmptyState,
  InlineSearch,
  PageHeader,
  Pagination,
  RecordPreview,
  SearchField,
  SidebarItem,
  Tabs,
  Toolbar,
  ToolbarGroup,
  type Viewport,
} from "../components/primitives";
import { SIDEBAR_GROUPS, SIDEBAR_ICONS, TOKENS } from "../theme/tokens";
import { formatDateTime, initials, summarizeValue, truncate } from "../utils/format";

/* ─── Layout helpers ───────────────────────────────────────────────────── */

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function projectSidebarWidth(viewport: Viewport, iconOnly: boolean) {
  if (iconOnly) return 4;
  return clamp(Math.floor(viewport.width * 0.14), 18, 26);
}

function subNavWidth(viewport: Viewport) {
  return clamp(Math.floor(viewport.width * 0.16), 20, 30);
}

function inspectorWidth(viewport: Viewport) {
  return clamp(Math.floor(viewport.width * 0.22), 28, 38);
}

function loginShellWidth(viewport: Viewport) {
  return clamp(Math.floor(viewport.width * 0.75), 72, 110);
}

function formatSecurity(table: TableSummary) {
  return table.rowSecurity ? "Row" : "Table";
}

function formatBackups(database: DatabaseSummary) {
  return database.enabled ? "Manual" : "None";
}

/* ─── Top chrome (navbar) ──────────────────────────────────────────────── */

function TopChrome(props: {
  viewport: Viewport;
  account: AccountSummary;
  organization?: OrganizationSummary | null;
  project?: ProjectSummary | null;
  onOpenOrganizations: () => void;
  onLogout: () => void;
}) {
  const compact = props.viewport.width < 120;
  const showEmail = props.viewport.width >= 100;

  return (
    <box
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: TOKENS.chrome,
        border: ["bottom"],
        borderColor: TOKENS.border,
        paddingLeft: 1,
        paddingRight: 1,
        height: 3,
      }}
    >
      {/* Left: Logo + breadcrumb */}
      <box
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <text content="◢" style={{ fg: TOKENS.accent, marginRight: 1 }} />
        {!compact ? (
          <text content="APPWRITE" style={{ fg: TOKENS.text, marginRight: 1 }} />
        ) : null}

        {props.organization ? (
          <>
            <text content=" / " style={{ fg: TOKENS.textWeak }} />
            <Button
              label={truncate(props.organization.name, compact ? 14 : 20)}
              onPress={props.onOpenOrganizations}
              variant="ghost"
              compact
            />
          </>
        ) : null}

        {props.project ? (
          <>
            <text content=" / " style={{ fg: TOKENS.textWeak }} />
            <text
              content={truncate(props.project.name, compact ? 16 : 24)}
              style={{ fg: TOKENS.text }}
            />
            {props.project.region ? (
              <box style={{ marginLeft: 1 }}>
                <Badge label={props.project.region.toUpperCase()} tone="accent" />
              </box>
            ) : null}
          </>
        ) : null}
      </box>

      {/* Right: User info + logout */}
      <box style={{ flexDirection: "row", alignItems: "center", flexShrink: 0 }}>
        {showEmail ? (
          <text
            content={truncate(props.account.email, 24)}
            style={{ fg: TOKENS.textSubtle, marginRight: 1 }}
          />
        ) : null}
        <text
          content={initials(props.account.name, props.account.email)}
          style={{ fg: TOKENS.accent, marginRight: 1 }}
        />
        <Button label="Logout" onPress={props.onLogout} variant="ghost" compact />
      </box>
    </box>
  );
}

/* ─── Login screen ─────────────────────────────────────────────────────── */

export function LoginScreen(props: {
  viewport: Viewport;
  endpoint: string;
  email: string;
  password: string;
  busy: boolean;
  alert?: { tone: "success" | "warning" | "danger"; message: string } | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const shellWidth = loginShellWidth(props.viewport);
  const splitLayout = props.viewport.width >= 120;

  return (
    <box
      style={{
        backgroundColor: TOKENS.canvas,
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <box
        style={{
          width: shellWidth,
          border: true,
          borderColor: TOKENS.borderStrong,
          backgroundColor: TOKENS.shell,
          flexDirection: splitLayout ? "row" : "column",
          minHeight: splitLayout ? 20 : undefined,
        }}
      >
        {/* Left panel - branding */}
        <box
          style={{
            width: splitLayout
              ? clamp(Math.floor(shellWidth * 0.36), 24, 38)
              : undefined,
            border: splitLayout ? ["right"] : ["bottom"],
            borderColor: TOKENS.border,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 2,
            paddingBottom: 2,
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: TOKENS.panelAlt,
          }}
        >
          <box style={{ flexDirection: "column" }}>
            <AppLogo />
            <text
              content="Build like a team of hundreds_"
              style={{ fg: TOKENS.textMuted, marginTop: 1 }}
            />
          </box>
          <box style={{ flexDirection: "column", marginTop: 2 }}>
            <Badge label="Console TUI" tone="accent" />
          </box>
        </box>

        {/* Right panel - sign in form */}
        <box
          style={{
            flexGrow: 1,
            minHeight: 0,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 2,
            paddingBottom: 1,
            flexDirection: "column",
          }}
        >
          <text content="Sign in" style={{ fg: TOKENS.text, marginBottom: 1 }} />
          {props.alert ? (
            <AlertBanner tone={props.alert.tone} message={props.alert.message} />
          ) : null}
          <SearchField
            label="Email"
            value={props.email}
            placeholder="name@appwrite.io"
            onChange={props.onEmailChange}
            onSubmit={props.onSubmit}
          />
          <SearchField
            label="Password"
            value={props.password}
            placeholder="Enter password"
            onChange={props.onPasswordChange}
            onSubmit={props.onSubmit}
          />
          <box style={{ marginTop: 1 }}>
            <Button
              label={props.busy ? "Signing in…" : "Sign in"}
              onPress={props.onSubmit}
              variant="primary"
              disabled={props.busy}
            />
          </box>
        </box>
      </box>
    </box>
  );
}

/* ─── Organizations screen ─────────────────────────────────────────────── */

function OrganizationListItem(props: {
  organization: OrganizationSummary;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <box
      onMouseDown={(event) => {
        event.preventDefault();
        props.onPress();
      }}
      style={{
        backgroundColor: props.active ? TOKENS.rowActive : "transparent",
        paddingLeft: 1,
        paddingRight: 1,
        height: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <text content={props.organization.name} style={{ fg: TOKENS.text }} />
      <Badge
        label={props.organization.billingPlan ?? "Starter"}
        tone={props.active ? "accent" : "default"}
      />
    </box>
  );
}

export function OrganizationsScreen(props: {
  viewport: Viewport;
  account: AccountSummary;
  organizations: OrganizationSummary[];
  selectedOrganization: OrganizationSummary | null;
  organizationSearch: string;
  projectSearch: string;
  projects: ProjectSummary[];
  selectedProjectId: string | null;
  busy: boolean;
  alert?: { tone: "success" | "warning" | "danger"; message: string } | null;
  onChangeOrganizationSearch: (value: string) => void;
  onChangeProjectSearch: (value: string) => void;
  onSelectOrganization: (organization: OrganizationSummary) => void;
  onSelectProject: (project: ProjectSummary) => void;
  onOpenCreateOrganization: () => void;
  onOpenCreateProject: () => void;
  onLogout: () => void;
}) {
  const stacked = props.viewport.width < 100;
  const railWidth = stacked
    ? undefined
    : clamp(Math.floor(props.viewport.width * 0.22), 26, 36);

  const projectColumns = [
    {
      key: "name",
      label: "Name",
      minWidth: 20,
      flexGrow: 1,
      render: (p: ProjectSummary) => p.name,
    },
    {
      key: "id",
      label: "Project ID",
      width: props.viewport.width >= 140 ? 22 : 16,
      render: (p: ProjectSummary) => p.$id,
    },
    {
      key: "region",
      label: "Region",
      width: 10,
      render: (p: ProjectSummary) => p.region ?? "local",
    },
    {
      key: "updated",
      label: "Updated",
      width: 18,
      render: (p: ProjectSummary) => formatDateTime(p.$updatedAt),
    },
  ];

  return (
    <box
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        backgroundColor: TOKENS.canvas,
      }}
    >
      <TopChrome
        viewport={props.viewport}
        account={props.account}
        onOpenOrganizations={() => {}}
        onLogout={props.onLogout}
      />

      <box
        style={{
          flexDirection: stacked ? "column" : "row",
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        {/* Organization rail */}
        <box
          style={{
            width: railWidth,
            backgroundColor: TOKENS.shell,
            border: stacked ? ["bottom"] : ["right"],
            borderColor: TOKENS.border,
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 1,
            paddingBottom: 1,
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <box
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              height: 1,
              marginBottom: 1,
            }}
          >
            <text content="Organizations" style={{ fg: TOKENS.textMuted }} />
            <Button
              label="+ New"
              onPress={props.onOpenCreateOrganization}
              variant="primary"
              compact
            />
          </box>
          <scrollbox style={{ flexGrow: 1, minHeight: 0 }}>
            {props.organizations.length === 0 ? (
              <text content="No organizations" style={{ fg: TOKENS.textSubtle }} />
            ) : (
              props.organizations.map((org) => (
                <OrganizationListItem
                  key={org.$id}
                  organization={org}
                  active={props.selectedOrganization?.$id === org.$id}
                  onPress={() => props.onSelectOrganization(org)}
                />
              ))
            )}
          </scrollbox>
        </box>

        {/* Project content */}
        <box
          style={{
            flexDirection: "column",
            flexGrow: 1,
            minHeight: 0,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 1,
          }}
        >
          <PageHeader
            title={
              props.selectedOrganization
                ? props.selectedOrganization.name
                : "Projects"
            }
            description=""
            meta={
              props.selectedOrganization ? (
                <Badge
                  label={props.selectedOrganization.billingPlan ?? "Starter"}
                  tone="accent"
                />
              ) : null
            }
            actions={
              <Button
                label={props.busy ? "Working…" : "+ Create project"}
                onPress={props.onOpenCreateProject}
                variant="primary"
                compact
                disabled={!props.selectedOrganization || props.busy}
              />
            }
          />

          {props.alert ? (
            <AlertBanner
              tone={props.alert.tone}
              message={props.alert.message}
            />
          ) : null}

          <Tabs
            tabs={[
              { id: "projects", label: "Projects", active: true },
              { id: "members", label: "Members", disabled: true },
              { id: "billing", label: "Billing", disabled: true },
              { id: "settings", label: "Settings", disabled: true },
            ]}
          />

          <Toolbar>
            <ToolbarGroup grow>
              <InlineSearch
                value={props.projectSearch}
                placeholder="Search by name, label, or ID"
                onChange={props.onChangeProjectSearch}
                width={40}
              />
            </ToolbarGroup>
            <ToolbarGroup>
              <Button
                label="+ Create project"
                onPress={props.onOpenCreateProject}
                variant="primary"
                compact
                disabled={!props.selectedOrganization || props.busy}
              />
            </ToolbarGroup>
          </Toolbar>

          <DataTable
            columns={projectColumns}
            rows={props.projects}
            selectedId={props.selectedProjectId}
            onSelect={props.onSelectProject}
            emptyTitle="No projects yet"
            emptyDescription="Create a project to get started."
          />
        </box>
      </box>
    </box>
  );
}

/* ─── Users panel ──────────────────────────────────────────────────────── */

function UsersPanel(props: {
  viewport: Viewport;
  users: UserSummary[];
  total: number;
  selectedUser: UserSummary | null;
  search: string;
  onChangeSearch: (value: string) => void;
  onSelectUser: (user: UserSummary) => void;
  onOpenCreateUser: () => void;
}) {
  const showInspector = props.viewport.width >= 140;
  const userColumns = [
    {
      key: "name",
      label: "Name",
      minWidth: 16,
      flexGrow: 1,
      render: (u: UserSummary) => u.name || "Unnamed",
    },
    {
      key: "email",
      label: "Email",
      width: props.viewport.width >= 150 ? 26 : 20,
      render: (u: UserSummary) => u.email ?? "—",
    },
    {
      key: "status",
      label: "Status",
      width: 10,
      render: (u: UserSummary) => (u.status ? "Active" : "Blocked"),
    },
    {
      key: "registered",
      label: "Registered",
      width: 18,
      render: (u: UserSummary) => formatDateTime(u.registration),
    },
  ];

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <Tabs
        tabs={[
          { id: "users", label: "Users", active: true },
          { id: "sessions", label: "Sessions", disabled: true },
          { id: "providers", label: "Providers", disabled: true },
        ]}
      />

      <Toolbar>
        <ToolbarGroup grow>
          <InlineSearch
            value={props.search}
            placeholder="Search by name, email, or ID"
            onChange={props.onChangeSearch}
            width={40}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <Button
            label="+ Create user"
            onPress={props.onOpenCreateUser}
            variant="primary"
            compact
          />
        </ToolbarGroup>
      </Toolbar>

      <box
        style={{
          flexDirection: showInspector ? "row" : "column",
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <box
          style={{
            flexGrow: 1,
            minHeight: 0,
            marginRight: showInspector ? 1 : 0,
          }}
        >
          <DataTable
            columns={userColumns}
            rows={props.users}
            selectedId={props.selectedUser?.$id}
            onSelect={props.onSelectUser}
            emptyTitle="No users yet"
            emptyDescription="Create a user to begin."
            footer={
              <text
                content={`${props.total} users total`}
                style={{ fg: TOKENS.textSubtle }}
              />
            }
          />
        </box>

        {showInspector && props.selectedUser ? (
          <box
            style={{
              width: inspectorWidth(props.viewport),
              minHeight: 0,
              backgroundColor: TOKENS.shell,
              border: true,
              borderColor: TOKENS.border,
              paddingLeft: 1,
              paddingRight: 1,
              paddingTop: 1,
              flexDirection: "column",
            }}
          >
            <text
              content={props.selectedUser.name || props.selectedUser.$id}
              style={{ fg: TOKENS.text, marginBottom: 1 }}
            />
            <DefinitionList
              entries={[
                { label: "ID", value: props.selectedUser.$id },
                { label: "Email", value: props.selectedUser.email ?? "—" },
                { label: "Phone", value: props.selectedUser.phone ?? "—" },
                {
                  label: "Status",
                  value: props.selectedUser.status ? "Active" : "Blocked",
                },
                {
                  label: "Verified",
                  value:
                    props.selectedUser.emailVerification ||
                    props.selectedUser.phoneVerification
                      ? "Yes"
                      : "No",
                },
                {
                  label: "Seen",
                  value: formatDateTime(props.selectedUser.accessedAt),
                },
              ]}
            />
          </box>
        ) : null}
      </box>
    </box>
  );
}

/* ─── Database sub-navigation (matches console sidebar) ────────────────── */

function DatabaseSubNav(props: {
  viewport: Viewport;
  selectedDatabase: DatabaseSummary;
  selectedTable: TableSummary | null;
  tables: TableSummary[];
  onBackToDatabases: () => void;
  onBackToTables: () => void;
  onSelectTable: (table: TableSummary) => void;
  onOpenCreateTable: () => void;
}) {
  const width = subNavWidth(props.viewport);

  return (
    <box
      style={{
        width,
        minHeight: 0,
        backgroundColor: TOKENS.shell,
        border: ["right"],
        borderColor: TOKENS.border,
        flexDirection: "column",
      }}
    >
      {/* Database name header */}
      <box
        style={{
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 1,
          flexDirection: "column",
        }}
      >
        <box
          onMouseDown={(event) => {
            event.preventDefault();
            props.onBackToDatabases();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 1,
            marginBottom: 1,
          }}
        >
          <text content="🗄️" style={{ fg: TOKENS.textSubtle, marginRight: 1 }} />
          <text
            content={truncate(props.selectedDatabase.name, width - 6)}
            style={{ fg: TOKENS.textMuted }}
          />
        </box>
      </box>

      {/* Table list */}
      <scrollbox
        style={{
          flexGrow: 1,
          minHeight: 0,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        {props.tables.length === 0 ? (
          <text content="No tables" style={{ fg: TOKENS.textSubtle }} />
        ) : (
          props.tables.map((table) => (
            <SidebarItem
              key={table.$id}
              label={truncate(table.name, width - 6)}
              icon="📋"
              active={props.selectedTable?.$id === table.$id}
              onPress={() => props.onSelectTable(table)}
            />
          ))
        )}
      </scrollbox>

      {/* Create table */}
      <box style={{ paddingLeft: 1, paddingRight: 1, marginTop: 1 }}>
        <Button
          label="+ Create table"
          onPress={props.onOpenCreateTable}
          variant="ghost"
          compact
        />
      </box>

      {/* Separator + bottom nav */}
      <box
        style={{
          border: ["top"],
          borderColor: TOKENS.border,
          marginTop: 1,
          paddingLeft: 1,
          paddingRight: 1,
          paddingBottom: 1,
          flexDirection: "column",
        }}
      >
        <SidebarItem label="Backups" icon="🔄" disabled />
        <SidebarItem label="Usage" icon="📈" disabled />
        <SidebarItem label="Settings" icon="⚙️" disabled />
      </box>
    </box>
  );
}

/* ─── Database index view (list of databases) ──────────────────────────── */

function DatabaseIndexView(props: {
  viewport: Viewport;
  databases: DatabaseSummary[];
  selectedDatabase: DatabaseSummary | null;
  search: string;
  onChangeSearch: (value: string) => void;
  onSelectDatabase: (database: DatabaseSummary) => void;
  onOpenCreateDatabase: () => void;
}) {
  const databaseColumns = [
    {
      key: "$id",
      label: "Database ID",
      width: props.viewport.width >= 140 ? 22 : 18,
      render: (d: DatabaseSummary) => d.$id,
    },
    {
      key: "name",
      label: "Name",
      minWidth: 16,
      flexGrow: 1,
      render: (d: DatabaseSummary) => d.name,
    },
    {
      key: "backup",
      label: "Backups",
      width: 14,
      render: (d: DatabaseSummary) => formatBackups(d),
    },
    {
      key: "created",
      label: "Created",
      width: 18,
      render: (d: DatabaseSummary) => formatDateTime(d.$createdAt),
    },
    {
      key: "updated",
      label: "Updated",
      width: 18,
      render: (d: DatabaseSummary) => formatDateTime(d.$updatedAt),
    },
  ];

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <PageHeader title="Databases" description="" />

      <Tabs
        tabs={[
          { id: "databases", label: "Databases", active: true },
          { id: "usage", label: "Usage", disabled: true },
        ]}
      />

      <Toolbar>
        <ToolbarGroup grow>
          <InlineSearch
            value={props.search}
            placeholder="Search by name or ID"
            onChange={props.onChangeSearch}
            width={36}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <Button
            label="≡ Table"
            onPress={() => {}}
            variant="ghost"
            compact
          />
          <text content=" " />
          <Button
            label="⊞ Grid"
            onPress={() => {}}
            variant="ghost"
            compact
            disabled
          />
          <text content="  " />
          <Button
            label="+ Create database"
            onPress={props.onOpenCreateDatabase}
            variant="primary"
            compact
          />
        </ToolbarGroup>
      </Toolbar>

      <DataTable
        columns={databaseColumns}
        rows={props.databases}
        selectedId={props.selectedDatabase?.$id}
        onSelect={props.onSelectDatabase}
        emptyTitle="No databases yet"
        emptyDescription="Create a database to get started."
        footer={
          <text
            content={`${props.databases.length} databases`}
            style={{ fg: TOKENS.textSubtle }}
          />
        }
      />
    </box>
  );
}

/* ─── Database tables view ─────────────────────────────────────────────── */

function DatabaseTablesView(props: {
  viewport: Viewport;
  database: DatabaseSummary;
  tables: TableSummary[];
  selectedTable: TableSummary | null;
  search: string;
  onChangeSearch: (value: string) => void;
  onSelectTable: (table: TableSummary) => void;
  onOpenCreateTable: () => void;
}) {
  const tableColumns = [
    {
      key: "$id",
      label: "Table ID",
      width: props.viewport.width >= 140 ? 22 : 18,
      render: (t: TableSummary) => t.$id,
    },
    {
      key: "name",
      label: "Name",
      minWidth: 16,
      flexGrow: 1,
      render: (t: TableSummary) => t.name,
    },
    {
      key: "security",
      label: "Security",
      width: 12,
      render: (t: TableSummary) => formatSecurity(t),
    },
    {
      key: "created",
      label: "Created",
      width: 18,
      render: (t: TableSummary) => formatDateTime(t.$createdAt),
    },
    {
      key: "updated",
      label: "Updated",
      width: 18,
      render: (t: TableSummary) => formatDateTime(t.$updatedAt),
    },
  ];

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <PageHeader
        title={props.database.name}
        description=""
        breadcrumbs={["Databases", props.database.name]}
        meta={
          <Badge
            label={props.database.enabled ? "Enabled" : "Disabled"}
            tone={props.database.enabled ? "success" : "warning"}
          />
        }
      />

      <Tabs
        tabs={[
          { id: "tables", label: "Tables", active: true },
          { id: "backups", label: "Backups", disabled: true },
          { id: "usage", label: "Usage", disabled: true },
          { id: "settings", label: "Settings", disabled: true },
        ]}
      />

      <Toolbar>
        <ToolbarGroup grow>
          <InlineSearch
            value={props.search}
            placeholder="Search tables"
            onChange={props.onChangeSearch}
            width={30}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <Button
            label="+ Create table"
            onPress={props.onOpenCreateTable}
            variant="primary"
            compact
          />
        </ToolbarGroup>
      </Toolbar>

      <DataTable
        columns={tableColumns}
        rows={props.tables}
        selectedId={props.selectedTable?.$id}
        onSelect={props.onSelectTable}
        emptyTitle="No tables yet"
        emptyDescription="Create a table to start adding rows."
        footer={
          <text
            content={`${props.tables.length} tables`}
            style={{ fg: TOKENS.textSubtle }}
          />
        }
      />
    </box>
  );
}

/* ─── Build spreadsheet columns from schema ────────────────────────────── */

function buildRowColumns(columns: ColumnSummary[], viewport: Viewport) {
  const visible = columns.filter((c) => c.status !== "processing");
  const fieldCount =
    viewport.width >= 160 ? 4 : viewport.width >= 130 ? 3 : viewport.width >= 100 ? 2 : 1;
  const selected = visible.slice(0, fieldCount);

  return [
    {
      key: "$id",
      label: "$id",
      width: viewport.width >= 150 ? 22 : 16,
      render: (row: RowSummary) => row.$id,
    },
    ...selected.map((col, i) => ({
      key: col.key,
      label: col.key,
      minWidth: 12,
      flexGrow: i === 0 ? 1 : 0,
      width: i === 0 ? undefined : 16,
      render: (row: RowSummary) => summarizeValue(row[col.key]),
    })),
    {
      key: "$createdAt",
      label: "$createdAt",
      width: 18,
      render: (row: RowSummary) => formatDateTime(row.$createdAt),
    },
    {
      key: "$updatedAt",
      label: "$updatedAt",
      width: 18,
      render: (row: RowSummary) => formatDateTime(row.$updatedAt),
    },
  ];
}

/* ─── Columns tab view ─────────────────────────────────────────────────── */

function ColumnsTabView(props: {
  columns: ColumnSummary[];
  onDeleteColumn: (key: string) => void;
  onCreateSingleColumn: () => void;
}) {
  const colDefs = [
    { key: "key", label: "Key", minWidth: 14, flexGrow: 1, render: (c: ColumnSummary) => c.key },
    { key: "type", label: "Type", width: 12, render: (c: ColumnSummary) => c.type },
    { key: "status", label: "Status", width: 12, render: (c: ColumnSummary) => c.status ?? "available" },
    { key: "required", label: "Required", width: 10, render: (c: ColumnSummary) => c.required ? "Yes" : "No" },
    { key: "array", label: "Array", width: 8, render: (c: ColumnSummary) => c.array ? "Yes" : "No" },
    { key: "size", label: "Size", width: 8, render: (c: ColumnSummary) => c.size != null ? String(c.size) : "—" },
    { key: "default", label: "Default", width: 14, render: (c: ColumnSummary) => c.default != null ? String(c.default) : "—" },
  ];

  const rows = props.columns.map((c) => ({ ...c, $id: c.key }));

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <Toolbar>
        <ToolbarGroup>
          <text content={`${props.columns.length} columns`} style={{ fg: TOKENS.textSubtle }} />
        </ToolbarGroup>
        <ToolbarGroup>
          <Button label="+ Create column" onPress={props.onCreateSingleColumn} variant="primary" compact />
        </ToolbarGroup>
      </Toolbar>
      <DataTable
        columns={colDefs}
        rows={rows}
        emptyTitle="No columns"
        emptyDescription="Create a column to define your table schema."
        onSelect={(row) => props.onDeleteColumn(row.$id)}
      />
    </box>
  );
}

/* ─── Indexes tab view ─────────────────────────────────────────────────── */

function IndexesTabView(props: {
  indexes: IndexSummary[];
  onCreateIndex: () => void;
  onDeleteIndex: (key: string) => void;
}) {
  const idxDefs = [
    { key: "key", label: "Key", minWidth: 14, flexGrow: 1, render: (i: IndexSummary) => i.key },
    { key: "type", label: "Type", width: 12, render: (i: IndexSummary) => i.type },
    { key: "status", label: "Status", width: 12, render: (i: IndexSummary) => i.status },
    { key: "columns", label: "Columns", width: 30, render: (i: IndexSummary) => i.columns.join(", ") },
    { key: "orders", label: "Orders", width: 14, render: (i: IndexSummary) => (i.orders ?? []).join(", ") || "—" },
  ];

  const rows = props.indexes.map((i) => ({ ...i, $id: i.key }));

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <Toolbar>
        <ToolbarGroup>
          <text content={`${props.indexes.length} indexes`} style={{ fg: TOKENS.textSubtle }} />
        </ToolbarGroup>
        <ToolbarGroup>
          <Button label="+ Create index" onPress={props.onCreateIndex} variant="primary" compact />
        </ToolbarGroup>
      </Toolbar>
      <DataTable
        columns={idxDefs}
        rows={rows}
        emptyTitle="No indexes"
        emptyDescription="Create an index to optimize queries."
      />
    </box>
  );
}

/* ─── Activity tab view ────────────────────────────────────────────────── */

function ActivityTabView(props: { logs: LogEntry[] }) {
  const logDefs = [
    { key: "event", label: "Event", minWidth: 20, flexGrow: 1, render: (l: LogEntry) => l.event },
    { key: "user", label: "User", width: 22, render: (l: LogEntry) => l.userName || l.userEmail || l.userId || "—" },
    { key: "ip", label: "IP", width: 16, render: (l: LogEntry) => l.ip || "—" },
    { key: "time", label: "Time", width: 18, render: (l: LogEntry) => formatDateTime(l.time) },
    { key: "client", label: "Client", width: 16, render: (l: LogEntry) => l.clientName || "—" },
  ];

  const rows = props.logs.map((l, i) => ({ ...l, $id: `log_${i}` }));

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <Toolbar>
        <ToolbarGroup>
          <text content={`${props.logs.length} events`} style={{ fg: TOKENS.textSubtle }} />
        </ToolbarGroup>
      </Toolbar>
      <DataTable
        columns={logDefs}
        rows={rows}
        emptyTitle="No activity"
        emptyDescription="Activity logs will appear here."
      />
    </box>
  );
}

/* ─── Usage tab view ───────────────────────────────────────────────────── */

function UsageTabView(props: { usage: UsageStats | null }) {
  if (!props.usage) {
    return <EmptyState title="Loading..." description="Fetching usage data." />;
  }

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <box style={{ flexDirection: "row", marginBottom: 1 }}>
        <box style={{ marginRight: 3 }}>
          <text content="Total rows" style={{ fg: TOKENS.textSubtle }} />
          <text content={String(props.usage.rowsTotal)} style={{ fg: TOKENS.text }} />
        </box>
        <box>
          <text content="Range" style={{ fg: TOKENS.textSubtle }} />
          <text content={props.usage.range} style={{ fg: TOKENS.text }} />
        </box>
      </box>
      <box style={{ border: true, borderColor: TOKENS.border, backgroundColor: TOKENS.panelAlt, paddingLeft: 1, paddingRight: 1, paddingTop: 1, paddingBottom: 1, flexGrow: 1, minHeight: 0 }}>
        <scrollbox style={{ flexGrow: 1, minHeight: 0 }}>
          {props.usage.rows.length === 0 ? (
            <text content="No usage data available." style={{ fg: TOKENS.textSubtle }} />
          ) : (
            props.usage.rows.map((entry, i) => (
              <box key={`u_${i}`} style={{ flexDirection: "row", height: 1 }}>
                <text content={formatDateTime(entry.date)} style={{ fg: TOKENS.textSubtle, marginRight: 2 }} />
                <text content={`${"█".repeat(Math.min(Math.max(entry.value, 0), 50))} ${entry.value}`} style={{ fg: TOKENS.accent }} />
              </box>
            ))
          )}
        </scrollbox>
      </box>
    </box>
  );
}

/* ─── Settings tab view ────────────────────────────────────────────────── */

function SettingsTabView(props: {
  table: TableSummary;
  onOpenEditTableSettings: () => void;
  onDeleteTable: () => void;
}) {
  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <DefinitionList
        entries={[
          { label: "Table ID", value: props.table.$id },
          { label: "Name", value: props.table.name },
          { label: "Database ID", value: props.table.databaseId },
          { label: "Row security", value: props.table.rowSecurity ? "Enabled" : "Disabled" },
          { label: "Enabled", value: props.table.enabled !== false ? "Yes" : "No" },
          { label: "Created", value: formatDateTime(props.table.$createdAt) },
          { label: "Updated", value: formatDateTime(props.table.$updatedAt) },
        ]}
      />
      <box style={{ flexDirection: "row", marginTop: 2 }}>
        <box style={{ marginRight: 1 }}>
          <Button label="Edit settings" onPress={props.onOpenEditTableSettings} variant="primary" compact />
        </box>
        <Button label="🗑️ Delete table" onPress={props.onDeleteTable} variant="danger" compact />
      </box>
    </box>
  );
}

/* ─── Table detail view (all tabs) ─────────────────────────────────────── */

function TableDetailView(props: {
  viewport: Viewport;
  database: DatabaseSummary;
  table: TableSummary;
  columns: ColumnSummary[];
  rows: RowPage | null;
  selectedRow: RowSummary | null;
  tableTab: TableTab;
  indexes: IndexSummary[];
  tableLogs: LogEntry[];
  tableUsage: UsageStats | null;
  editingCell: { rowId: string; columnKey: string; value: string } | null;
  onSelectRow: (row: RowSummary) => void;
  onOpenCreateRow: () => void;
  onPrevRows: () => void;
  onNextRows: () => void;
  onRefreshRows: () => void;
  onBackToTables: () => void;
  onChangeTableTab: (tab: TableTab) => void;
  onDeleteRow: (rowId: string) => void;
  onCreateIndex: () => void;
  onDeleteIndex: (key: string) => void;
  onDeleteColumn: (key: string) => void;
  onCreateSingleColumn: () => void;
  onOpenEditTableSettings: () => void;
  onDeleteTable: () => void;
  onStartEditCell: (rowId: string, columnKey: string, value: string) => void;
  onSubmitEditCell: () => void;
  onCancelEditCell: () => void;
  onEditCellChange: (value: string) => void;
}) {
  const rowColumns = buildRowColumns(props.columns, props.viewport);

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      {/* Title bar */}
      <box style={{ flexDirection: "row", alignItems: "center", height: 1, marginBottom: 1 }}>
        <Button label="←" onPress={props.onBackToTables} variant="ghost" compact />
        <text content={` ${props.table.name} `} style={{ fg: TOKENS.text }} />
        <Badge label={props.table.$id} />
      </box>

      {/* Tabs - ALL functional */}
      <Tabs
        tabs={[
          { id: "rows", label: "Rows", active: props.tableTab === "rows", onPress: () => props.onChangeTableTab("rows") },
          { id: "columns", label: "Columns", active: props.tableTab === "columns", onPress: () => props.onChangeTableTab("columns") },
          { id: "indexes", label: "Indexes", active: props.tableTab === "indexes", onPress: () => props.onChangeTableTab("indexes") },
          { id: "activity", label: "Activity", active: props.tableTab === "activity", onPress: () => props.onChangeTableTab("activity") },
          { id: "usage", label: "Usage", active: props.tableTab === "usage", onPress: () => props.onChangeTableTab("usage") },
          { id: "settings", label: "Settings", active: props.tableTab === "settings", onPress: () => props.onChangeTableTab("settings") },
        ]}
      />

      {/* Tab content */}
      {props.tableTab === "rows" ? (
        <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
          <Toolbar>
            <ToolbarGroup>
              <Button label="+ Create row" onPress={props.onOpenCreateRow} variant="primary" compact disabled={!props.columns.length} />
              <text content="  " />
              <Button label="↻ Refresh" onPress={props.onRefreshRows} variant="ghost" compact />
            </ToolbarGroup>
          </Toolbar>

          <DataTable
            columns={rowColumns}
            rows={props.rows?.rows ?? []}
            selectedId={props.selectedRow?.$id}
            onSelect={props.onSelectRow}
            emptyTitle="No rows yet"
            emptyDescription="Create a row to get started."
            showRowNumbers
          />

          {props.rows ? (
            <Pagination total={props.rows.total} offset={props.rows.offset} limit={props.rows.limit} onPrev={props.onPrevRows} onNext={props.onNextRows} label="rows" />
          ) : null}

          {/* Inline edit panel for selected row */}
          {props.selectedRow ? (
            <box style={{ marginTop: 1, backgroundColor: TOKENS.shell, border: true, borderColor: TOKENS.border, paddingLeft: 1, paddingRight: 1, paddingTop: 1, paddingBottom: 1, maxHeight: 10, minHeight: 0 }}>
              <box style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 1, marginBottom: 1 }}>
                <text content={`📝 Row: ${props.selectedRow.$id}`} style={{ fg: TOKENS.text }} />
                <box style={{ flexDirection: "row" }}>
                  {props.editingCell ? (
                    <>
                      <box style={{ marginRight: 1 }}><Button label="💾 Save" onPress={props.onSubmitEditCell} variant="primary" compact /></box>
                      <box style={{ marginRight: 1 }}><Button label="Cancel" onPress={props.onCancelEditCell} variant="ghost" compact /></box>
                    </>
                  ) : null}
                  <Button label="🗑️ Delete" onPress={() => props.onDeleteRow(props.selectedRow!.$id)} variant="danger" compact />
                </box>
              </box>
              {props.editingCell ? (
                <box style={{ flexDirection: "row", alignItems: "center", backgroundColor: TOKENS.input, border: true, borderColor: TOKENS.accent, paddingLeft: 1, paddingRight: 1, height: 3 }}>
                  <text content={`${props.editingCell.columnKey}: `} style={{ fg: TOKENS.accent, marginRight: 1 }} />
                  <input
                    value={props.editingCell.value}
                    onInput={props.onEditCellChange}
                    onKeyDown={(key) => {
                      if (key.name === "return" || key.name === "enter") { key.preventDefault(); props.onSubmitEditCell(); }
                      if (key.name === "escape") { key.preventDefault(); props.onCancelEditCell(); }
                    }}
                    cursorColor={TOKENS.accent}
                    width="100%"
                    style={{ width: "100%", flexGrow: 1, minWidth: 0, backgroundColor: TOKENS.input, focusedBackgroundColor: TOKENS.input, textColor: TOKENS.text, focusedTextColor: TOKENS.text, placeholderColor: TOKENS.textSubtle }}
                  />
                </box>
              ) : (
                <scrollbox style={{ flexGrow: 1, minHeight: 0 }}>
                  {props.columns.filter((c) => c.status !== "processing").map((col) => (
                    <box
                      key={col.key}
                      onMouseDown={(e) => { e.preventDefault(); props.onStartEditCell(props.selectedRow!.$id, col.key, String(props.selectedRow![col.key] ?? "")); }}
                      style={{ flexDirection: "row", height: 1 }}
                    >
                      <text content={`${col.key}: `} style={{ fg: TOKENS.textSubtle }} />
                      <text content={summarizeValue(props.selectedRow![col.key])} style={{ fg: TOKENS.text }} />
                    </box>
                  ))}
                  <text content="  Click a field above to edit it" style={{ fg: TOKENS.textWeak }} />
                </scrollbox>
              )}
            </box>
          ) : null}
        </box>
      ) : props.tableTab === "columns" ? (
        <ColumnsTabView columns={props.columns} onDeleteColumn={props.onDeleteColumn} onCreateSingleColumn={props.onCreateSingleColumn} />
      ) : props.tableTab === "indexes" ? (
        <IndexesTabView indexes={props.indexes} onCreateIndex={props.onCreateIndex} onDeleteIndex={props.onDeleteIndex} />
      ) : props.tableTab === "activity" ? (
        <ActivityTabView logs={props.tableLogs} />
      ) : props.tableTab === "usage" ? (
        <UsageTabView usage={props.tableUsage} />
      ) : props.tableTab === "settings" ? (
        <SettingsTabView table={props.table} onOpenEditTableSettings={props.onOpenEditTableSettings} onDeleteTable={props.onDeleteTable} />
      ) : null}
    </box>
  );
}

/* ─── Databases panel (orchestrator) ───────────────────────────────────── */

function DatabasesPanel(props: {
  viewport: Viewport;
  databases: DatabaseSummary[];
  selectedDatabase: DatabaseSummary | null;
  tables: TableSummary[];
  selectedTable: TableSummary | null;
  columns: ColumnSummary[];
  rows: RowPage | null;
  selectedRow: RowSummary | null;
  databaseSearch: string;
  tableSearch: string;
  tableTab: TableTab;
  indexes: IndexSummary[];
  tableLogs: LogEntry[];
  tableUsage: UsageStats | null;
  editingCell: { rowId: string; columnKey: string; value: string } | null;
  onChangeDatabaseSearch: (value: string) => void;
  onChangeTableSearch: (value: string) => void;
  onSelectDatabase: (database: DatabaseSummary) => void;
  onSelectTable: (table: TableSummary) => void;
  onSelectRow: (row: RowSummary) => void;
  onOpenCreateDatabase: () => void;
  onOpenCreateTable: () => void;
  onOpenCreateRow: () => void;
  onBackToDatabases: () => void;
  onBackToTables: () => void;
  onPrevRows: () => void;
  onNextRows: () => void;
  onRefreshRows: () => void;
  onChangeTableTab: (tab: TableTab) => void;
  onDeleteRow: (rowId: string) => void;
  onCreateIndex: () => void;
  onDeleteIndex: (key: string) => void;
  onDeleteColumn: (key: string) => void;
  onCreateSingleColumn: () => void;
  onOpenEditTableSettings: () => void;
  onDeleteTable: () => void;
  onStartEditCell: (rowId: string, columnKey: string, value: string) => void;
  onSubmitEditCell: () => void;
  onCancelEditCell: () => void;
  onEditCellChange: (value: string) => void;
}) {
  if (!props.selectedDatabase) {
    return (
      <DatabaseIndexView
        viewport={props.viewport}
        databases={props.databases}
        selectedDatabase={props.selectedDatabase}
        search={props.databaseSearch}
        onChangeSearch={props.onChangeDatabaseSearch}
        onSelectDatabase={props.onSelectDatabase}
        onOpenCreateDatabase={props.onOpenCreateDatabase}
      />
    );
  }

  return (
    <box style={{ flexDirection: "row", flexGrow: 1, minHeight: 0 }}>
      <DatabaseSubNav
        viewport={props.viewport}
        selectedDatabase={props.selectedDatabase}
        selectedTable={props.selectedTable}
        tables={props.tables}
        onBackToDatabases={props.onBackToDatabases}
        onBackToTables={props.onBackToTables}
        onSelectTable={props.onSelectTable}
        onOpenCreateTable={props.onOpenCreateTable}
      />

      <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0, paddingLeft: 1, paddingRight: 1, paddingTop: 1 }}>
        {props.selectedTable ? (
          <TableDetailView
            viewport={props.viewport}
            database={props.selectedDatabase}
            table={props.selectedTable}
            columns={props.columns}
            rows={props.rows}
            selectedRow={props.selectedRow}
            tableTab={props.tableTab}
            indexes={props.indexes}
            tableLogs={props.tableLogs}
            tableUsage={props.tableUsage}
            editingCell={props.editingCell}
            onSelectRow={props.onSelectRow}
            onOpenCreateRow={props.onOpenCreateRow}
            onPrevRows={props.onPrevRows}
            onNextRows={props.onNextRows}
            onRefreshRows={props.onRefreshRows}
            onBackToTables={props.onBackToTables}
            onChangeTableTab={props.onChangeTableTab}
            onDeleteRow={props.onDeleteRow}
            onCreateIndex={props.onCreateIndex}
            onDeleteIndex={props.onDeleteIndex}
            onDeleteColumn={props.onDeleteColumn}
            onCreateSingleColumn={props.onCreateSingleColumn}
            onOpenEditTableSettings={props.onOpenEditTableSettings}
            onDeleteTable={props.onDeleteTable}
            onStartEditCell={props.onStartEditCell}
            onSubmitEditCell={props.onSubmitEditCell}
            onCancelEditCell={props.onCancelEditCell}
            onEditCellChange={props.onEditCellChange}
          />
        ) : (
          <DatabaseTablesView
            viewport={props.viewport}
            database={props.selectedDatabase}
            tables={props.tables}
            selectedTable={props.selectedTable}
            search={props.tableSearch}
            onChangeSearch={props.onChangeTableSearch}
            onSelectTable={props.onSelectTable}
            onOpenCreateTable={props.onOpenCreateTable}
          />
        )}
      </box>
    </box>
  );
}

/* ─── Project workspace screen ─────────────────────────────────────────── */

export function ProjectWorkspaceScreen(props: {
  viewport: Viewport;
  account: AccountSummary;
  organization: OrganizationSummary;
  project: ProjectSummary;
  service: ServiceId;
  alert?: { tone: "success" | "warning" | "danger"; message: string } | null;
  users: UserSummary[];
  userTotal: number;
  selectedUser: UserSummary | null;
  userSearch: string;
  databases: DatabaseSummary[];
  selectedDatabase: DatabaseSummary | null;
  tables: TableSummary[];
  selectedTable: TableSummary | null;
  columns: ColumnSummary[];
  rows: RowPage | null;
  selectedRow: RowSummary | null;
  databaseSearch: string;
  tableSearch: string;
  onOpenOrganizations: () => void;
  onLogout: () => void;
  onChangeService: (service: ServiceId) => void;
  onChangeUserSearch: (value: string) => void;
  onChangeDatabaseSearch: (value: string) => void;
  onChangeTableSearch: (value: string) => void;
  onSelectUser: (user: UserSummary) => void;
  onSelectDatabase: (database: DatabaseSummary) => void;
  onSelectTable: (table: TableSummary) => void;
  onSelectRow: (row: RowSummary) => void;
  onOpenCreateUser: () => void;
  onOpenCreateDatabase: () => void;
  onOpenCreateTable: () => void;
  onOpenCreateRow: () => void;
  onBackToDatabases: () => void;
  onBackToTables: () => void;
  onPrevRows: () => void;
  onNextRows: () => void;
  onRefreshRows: () => void;
  tableTab?: TableTab;
  indexes?: IndexSummary[];
  tableLogs?: LogEntry[];
  tableUsage?: UsageStats | null;
  editingCell?: { rowId: string; columnKey: string; value: string } | null;
  onChangeTableTab?: (tab: TableTab) => void;
  onUpdateRow?: (rowId: string, data: Record<string, unknown>) => void;
  onDeleteRow?: (rowId: string) => void;
  onCreateIndex?: () => void;
  onDeleteIndex?: (key: string) => void;
  onDeleteColumn?: (key: string) => void;
  onCreateSingleColumn?: () => void;
  onUpdateTable?: (input: { name?: string; enabled?: boolean; rowSecurity?: boolean }) => void;
  onDeleteTable?: () => void;
  onOpenEditTableSettings?: () => void;
  onStartEditCell?: (rowId: string, columnKey: string, value: string) => void;
  onSubmitEditCell?: () => void;
  onCancelEditCell?: () => void;
  onEditCellChange?: (value: string) => void;
}) {
  // Collapse main sidebar to icons when inside a database
  const inDatabaseDetail =
    props.service === "databases" && props.selectedDatabase != null;
  const sidebarWidth = projectSidebarWidth(props.viewport, inDatabaseDetail);
  const iconOnly = inDatabaseDetail;
  const tinyTerminal = props.viewport.width < 80;

  return (
    <box
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        backgroundColor: TOKENS.canvas,
      }}
    >
      <TopChrome
        viewport={props.viewport}
        account={props.account}
        organization={props.organization}
        project={props.project}
        onOpenOrganizations={props.onOpenOrganizations}
        onLogout={props.onLogout}
      />

      <box style={{ flexDirection: "row", flexGrow: 1, minHeight: 0 }}>
        {/* Main sidebar */}
        {!tinyTerminal ? (
          <box
            style={{
              width: sidebarWidth,
              backgroundColor: TOKENS.shell,
              border: ["right"],
              borderColor: TOKENS.border,
              paddingTop: 1,
              paddingBottom: 1,
              flexDirection: "column",
            }}
          >
            {/* Overview */}
            <SidebarItem
              label="Overview"
              icon={SIDEBAR_ICONS.overview}
              active={props.service === "overview"}
              disabled
              iconOnly={iconOnly}
            />

            {/* Sidebar groups */}
            {SIDEBAR_GROUPS.map((group) => (
              <box
                key={group.label}
                style={{ flexDirection: "column", marginTop: 1 }}
              >
                {!iconOnly ? (
                  <box style={{ paddingLeft: 1, height: 1 }}>
                    <text
                      content={group.label.toUpperCase()}
                      style={{ fg: TOKENS.textWeak }}
                    />
                  </box>
                ) : null}
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={SIDEBAR_ICONS[item.id] ?? "·"}
                    label={item.label}
                    active={props.service === item.id}
                    disabled={!item.active}
                    iconOnly={iconOnly}
                    onPress={
                      item.active
                        ? () => props.onChangeService(item.id as ServiceId)
                        : undefined
                    }
                  />
                ))}
              </box>
            ))}

            {/* Spacer + settings at bottom */}
            <box style={{ flexGrow: 1 }} />
          </box>
        ) : null}

        {/* Content area */}
        <box
          style={{
            flexDirection: "column",
            flexGrow: 1,
            minHeight: 0,
            paddingLeft: inDatabaseDetail ? 0 : 2,
            paddingRight: inDatabaseDetail ? 1 : 2,
            paddingTop: inDatabaseDetail ? 0 : 1,
          }}
        >
          {props.alert ? (
            <AlertBanner
              tone={props.alert.tone}
              message={props.alert.message}
            />
          ) : null}

          {props.service === "auth" ? (
            <UsersPanel
              viewport={props.viewport}
              users={props.users}
              total={props.userTotal}
              selectedUser={props.selectedUser}
              search={props.userSearch}
              onChangeSearch={props.onChangeUserSearch}
              onSelectUser={props.onSelectUser}
              onOpenCreateUser={props.onOpenCreateUser}
            />
          ) : props.service === "databases" ? (
            <DatabasesPanel
              viewport={props.viewport}
              databases={props.databases}
              selectedDatabase={props.selectedDatabase}
              tables={props.tables}
              selectedTable={props.selectedTable}
              columns={props.columns}
              rows={props.rows}
              selectedRow={props.selectedRow}
              databaseSearch={props.databaseSearch}
              tableSearch={props.tableSearch}
              tableTab={props.tableTab ?? "rows"}
              indexes={props.indexes ?? []}
              tableLogs={props.tableLogs ?? []}
              tableUsage={props.tableUsage ?? null}
              editingCell={props.editingCell ?? null}
              onChangeDatabaseSearch={props.onChangeDatabaseSearch}
              onChangeTableSearch={props.onChangeTableSearch}
              onSelectDatabase={props.onSelectDatabase}
              onSelectTable={props.onSelectTable}
              onSelectRow={props.onSelectRow}
              onOpenCreateDatabase={props.onOpenCreateDatabase}
              onOpenCreateTable={props.onOpenCreateTable}
              onOpenCreateRow={props.onOpenCreateRow}
              onBackToDatabases={props.onBackToDatabases}
              onBackToTables={props.onBackToTables}
              onPrevRows={props.onPrevRows}
              onNextRows={props.onNextRows}
              onRefreshRows={props.onRefreshRows}
              onChangeTableTab={props.onChangeTableTab ?? (() => {})}
              onDeleteRow={props.onDeleteRow ?? (() => {})}
              onCreateIndex={props.onCreateIndex ?? (() => {})}
              onDeleteIndex={props.onDeleteIndex ?? (() => {})}
              onDeleteColumn={props.onDeleteColumn ?? (() => {})}
              onCreateSingleColumn={props.onCreateSingleColumn ?? (() => {})}
              onOpenEditTableSettings={props.onOpenEditTableSettings ?? (() => {})}
              onDeleteTable={props.onDeleteTable ?? (() => {})}
              onStartEditCell={props.onStartEditCell ?? (() => {})}
              onSubmitEditCell={props.onSubmitEditCell ?? (() => {})}
              onCancelEditCell={props.onCancelEditCell ?? (() => {})}
              onEditCellChange={props.onEditCellChange ?? (() => {})}
            />
          ) : (
            <EmptyState
              title="Coming soon"
              description="This section is reserved for future implementation."
            />
          )}
        </box>
      </box>
    </box>
  );
}
