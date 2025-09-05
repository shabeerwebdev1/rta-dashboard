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
      { key: "menuItem", title: "Menu Item", dataIndex: "menuItem", type: "string" },
      { key: "create", title: "Create", dataIndex: "create", type: "boolean" },
      { key: "read", title: "Read", dataIndex: "read", type: "boolean" },
      { key: "update", title: "Update", dataIndex: "update", type: "boolean" },
      { key: "delete", title: "Delete", dataIndex: "delete", type: "boolean" },
    ],
  },
};
