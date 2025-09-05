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

    // ✅ Added week days here
    weekDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
};
