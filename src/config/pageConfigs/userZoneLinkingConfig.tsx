// userZoneLinkingConfig.ts
import { PageConfig } from "../../types/config";

export const UserZoneLinkingConfig: PageConfig = {
  title: "Inspector Management",

  tableConfig: {
    columns: [
      { key: "InspectorName", title: "form.InspectorName", type: "string", sortable: true },
      { key: "Zone", title: "form.Zone", type: "string", sortable: false },
      { key: "Shift", title: "form.Shift", type: "string", sortable: false },
      { key: "AssignmentType", title: "form.AssignmentType", type: "string", sortable: false },
      { key: "WeekOffs", title: "form.WeekOffs", type: "string", sortable: false },
      { key: "Actions", title: "", type: "string", sortable: false },
    ],
    viewRecord: false,

    // ✅ Store both label and value
    weekDays: [
      { label: "weekdays.Monday", value: "1" },
      { label: "weekdays.Tuesday", value: "2" },
      { label: "weekdays.Wednesday", value: "3" },
      { label: "weekdays.Thursday", value: "4" },
      { label: "weekdays.Friday", value: "5" },
      { label: "weekdays.Saturday", value: "6" },
      { label: "weekdays.Sunday", value: "7" },
    ],
  },
};
