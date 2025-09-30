// roleManagementConfig.ts
import type { PageConfig } from "../../types/config";

export const roleManagementConfig: PageConfig = {
  key: "role-management",
  title: "page.title.roleManagement",
  name: { singular: "Role", plural: "Roles" },
  api: {
    get: "/api/RoleManagement",
    put: "/api/RoleManagement",
  },
  tableConfig: {
    columns: [
      { key: "menuItem", title: "form.feature", dataIndex: "menuItem", type: "string" },
      { key: "create", title: "form.create", dataIndex: "create", type: "boolean" },
      { key: "read", title: "form.read", dataIndex: "read", type: "boolean" },
      { key: "update", title: "form.update", dataIndex: "update", type: "boolean" },
      { key: "delete", title: "form.Deactivate", dataIndex: "delete", type: "boolean" },
    ],
  },
};
