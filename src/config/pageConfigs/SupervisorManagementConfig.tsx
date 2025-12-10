// SupervisorManagementConfig.ts
import { PageConfig } from "../../types/config";

interface WeekDay {
  label: string;
  value: string;
}

interface TableColumn {
  key: string;
  title: string;
  type: string;
  sortable: boolean;
  width?: number;
  fixed?: "left" | "right";
}

interface TableConfig {
  columns: TableColumn[];
  viewRecord: boolean;
  weekDays: WeekDay[];
}

export const SupervisorManagemnetConfig: PageConfig = {
  title: "Supervisor Management",
  pageKey: "supervisorManagement",

  tableConfig: {
    columns: [
      {
        key: "SupervisorName",
        title: "form.supervisorName",
        type: "string",
        sortable: true,
        width: 200,
      },
      {
        key: "zone",
        title: "form.Zone",
        type: "string",
        sortable: false,
        width: 260,
      },
      {
        key: "shift",
        title: "form.Shift",
        type: "string",
        sortable: false,
        width: 210,
      },
      {
        key: "weekOffs",
        title: "form.WeekOffs",
        type: "string",
        sortable: false,
        width: 180,
      },
      {
        key: "Actions",
        title: "",
        type: "string",
        sortable: false,
        width: 120,
        fixed: "right",
      },
    ],
    viewRecord: false,

    weekDays: [
      { label: "weekdays.Monday", value: "1" },
      { label: "weekdays.Tuesday", value: "2" },
      { label: "weekdays.Wednesday", value: "3" },
      { label: "weekdays.Thursday", value: "4" },
      { label: "weekdays.Friday", value: "5" },
      { label: "weekdays.Saturday", value: "6" },
      { label: "weekdays.Sunday", value: "7" },
    ],
  } as TableConfig,

  features: {
    search: true,
    filters: true,
    pagination: true,
    export: false,
  },

  permissions: {
    canView: true,
    canEdit: true,
    canDelete: false,
    canCreate: false,
  },
};
