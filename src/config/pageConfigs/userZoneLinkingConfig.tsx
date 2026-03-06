// userZoneLinkingConfig.ts
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

export const UserZoneLinkingConfig: PageConfig = {
  title: "Inspector Management",
  pageKey: "userZoneLinking",

  tableConfig: {
    columns: [
      {
        key: "InspectorName",
        title: "form.InspectorName",
        type: "string",
        sortable: true,
        width: 200,
      },
      {
        key: "Zone",
        title: "form.Zone",
        type: "string",
        sortable: false,
        width: 180,
      },
      // {
      //   key: "Area",
      //   title: "form.area",
      //   type: "string",
      //   sortable: false,
      //   width: 180,
      // },
      {
        key: "Shift",
        title: "form.Shift",
        type: "string",
        sortable: false,
        width: 160,
      },
      {
        key: "AssignmentType",
        title: "form.AssignmentType",
        type: "string",
        sortable: false,
        width: 170,
      },
      {
        key: "SpecialZone",
        title: "form.SpecialZone",
        type: "string",
        sortable: false,
        width: 170,
      },
      {
        key: "WeekOffs",
        title: "form.WeekOffs",
        type: "string",
        sortable: false,
        width: 320, // increased width
      },
      {
        key: "Actions",
        title: "",
        type: "string",
        sortable: false,
        width: 64,
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
