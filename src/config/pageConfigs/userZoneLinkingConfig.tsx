// userZoneLinkingConfig.ts
import { PageConfig } from "../../types/config";

export const UserZoneLinkingConfig: PageConfig = {
  title: "Inspector Management",

  tableConfig: {
    columns: [
      { key: "InspectorName", title: "Inspector Name", type: "string", sortable: true },
      { key: "Zone", title: "Zone", type: "string", sortable: false },
      { key: "Shift", title: "Shift", type: "string", sortable: false }, // ✅ NEW
      { key: "InspectionType", title: "Inspection Type", type: "string", sortable: false }, // ✅ NEW

      { key: "WeekOffs", title: "Week Offs", type: "string", sortable: false },
    ],
    viewRecord: false,
  },
};
