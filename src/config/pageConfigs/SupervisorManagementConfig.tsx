// userZoneLinkingConfig.ts
import { PageConfig } from "../../types/config";

export const SupervisorManagemnetConfig: PageConfig = {
  title: "Supervisor Management",

  tableConfig: {
    columns: [
      { key: "employeeId", title: "employeeId", type: "string", sortable: true },
      { key: "employeeName", title: "employeeName", type: "string", sortable: true },
      { key: "zone", title: "zone", type: "string", sortable: false },
      { key: "shift", title: "shift", type: "string", sortable: false }, // ✅ NEW

      { key: "weekOffs", title: "weekOffs", type: "string", sortable: false },
    ],
  },
};
