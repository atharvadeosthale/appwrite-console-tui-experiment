import React from "react";
import { describe, expect, it } from "bun:test";
import { LoginScreen, OrganizationsScreen, ProjectWorkspaceScreen } from "../features/screens";
import { renderFrame } from "./helpers";

describe("screen snapshots", () => {
  it("renders login screen", async () => {
    const frame = await renderFrame(
      <LoginScreen
        viewport={{ width: 120, height: 36 }}
        endpoint="http://localhost:9501/v1"
        email="atharva@appwrite.io"
        password="secret"
        busy={false}
        onEmailChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={() => {}}
      />,
      120,
      36,
    );

    expect(frame).toContain("APPWRITE");
    expect(frame).toContain("Sign in");
  });

  it("renders organization workspace", async () => {
    const frame = await renderFrame(
      <OrganizationsScreen
        viewport={{ width: 160, height: 42 }}
        account={{ $id: "user_1", name: "Atharva", email: "atharva@appwrite.io" }}
        organizations={[
          { $id: "org_1", name: "Personal projects", kind: "organization", total: 1, billingPlan: "Starter" },
        ]}
        selectedOrganization={{ $id: "org_1", name: "Personal projects", kind: "organization", total: 1, billingPlan: "Starter" }}
        organizationSearch=""
        projectSearch=""
        projects={[
          { $id: "project_1", name: "Console TUI", teamId: "org_1", region: "fra", $updatedAt: new Date().toISOString() },
        ]}
        selectedProjectId={null}
        busy={false}
        onChangeOrganizationSearch={() => {}}
        onChangeProjectSearch={() => {}}
        onSelectOrganization={() => {}}
        onSelectProject={() => {}}
        onOpenCreateOrganization={() => {}}
        onOpenCreateProject={() => {}}
        onLogout={() => {}}
      />,
      160,
      42,
    );

    expect(frame).toContain("Organizations");
    expect(frame).toContain("Projects");
    expect(frame).toContain("project_1");
  });

  it("renders project workspace", async () => {
    const frame = await renderFrame(
      <ProjectWorkspaceScreen
        viewport={{ width: 180, height: 48 }}
        account={{ $id: "user_1", name: "Atharva", email: "atharva@appwrite.io" }}
        organization={{ $id: "org_1", name: "Personal projects", kind: "organization", total: 1, billingPlan: "Starter" }}
        project={{ $id: "project_1", name: "Console TUI", teamId: "org_1", region: "fra" }}
        service="auth"
        users={[
          { $id: "user_2", name: "Jane Doe", email: "jane@example.com", status: true, registration: new Date().toISOString() },
        ]}
        userTotal={1}
        selectedUser={{ $id: "user_2", name: "Jane Doe", email: "jane@example.com", status: true, registration: new Date().toISOString() }}
        userSearch=""
        databases={[]}
        selectedDatabase={null}
        tables={[]}
        selectedTable={null}
        columns={[]}
        rows={null}
        selectedRow={null}
        databaseSearch=""
        tableSearch=""
        onOpenOrganizations={() => {}}
        onLogout={() => {}}
        onChangeService={() => {}}
        onChangeUserSearch={() => {}}
        onChangeDatabaseSearch={() => {}}
        onChangeTableSearch={() => {}}
        onSelectUser={() => {}}
        onSelectDatabase={() => {}}
        onSelectTable={() => {}}
        onSelectRow={() => {}}
        onOpenCreateUser={() => {}}
        onOpenCreateDatabase={() => {}}
        onOpenCreateTable={() => {}}
        onOpenCreateRow={() => {}}
        onBackToDatabases={() => {}}
        onBackToTables={() => {}}
        onPrevRows={() => {}}
        onNextRows={() => {}}
        onRefreshRows={() => {}}
      />,
      180,
      48,
    );

    expect(frame).toContain("Auth");
    expect(frame).toContain("Users");
    expect(frame).toContain("Jane Doe");
  });
});
