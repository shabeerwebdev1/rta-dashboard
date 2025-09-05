import { PageConfig } from "../../types/config";

export const SupervisorManagemnetConfig: PageConfig = {
  title: "Supervisor Management",

  tableConfig: {
    columns: [
      { key: "SupervisorName", title: "Supervisor Name", type: "string", sortable: true },
      { key: "zone", title: "Zone", type: "string", sortable: false },
      { key: "shift", title: "Shift", type: "string", sortable: false },
      { key: "weekOffs", title: "Week Offs", type: "string", sortable: false },
      { key: "Actions", title: "", type: "string", sortable: false },
    ],
    viewRecord: false,
  },
};