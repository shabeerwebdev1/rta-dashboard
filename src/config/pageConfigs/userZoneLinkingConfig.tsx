// userZoneLinkingConfig.ts
import { PageConfig } from "../../types/config";

export const UserZoneLinkingConfig: PageConfig = {
  title: "Inspector Management",

  tableConfig: {
    columns: [
      { key: "InspectorName", title: "Inspector Name", type: "string", sortable: true },
      { key: "Zone", title: "Zone", type: "string", sortable: false },
      { key: "Shift", title: "Shift", type: "string", sortable: false },
      { key: "AssignmentType", title: "Assignment Type", type: "string", sortable: false },
      { key: "WeekOffs", title: "Week Offs", type: "string", sortable: false },
      { key: "Actions", title: "", type: "string", sortable: false }, 
    ],
    viewRecord: false,

    // ✅ Store both label and value
    weekDays: [
      { label: "Monday", value: "1" },
      { label: "Tuesday", value: "2" },
      { label: "Wednesday", value: "3" },
      { label: "Thursday", value: "4" },
      { label: "Friday", value: "5" },
      { label: "Saturday", value: "6" },
      { label: "Sunday", value: "7" },
    ],
  },
};
