import { PageConfig } from "../../types/config";

export const SupervisorManagemnetConfig: PageConfig = {
  title: "Supervisor Management",

  tableConfig: {
    columns: [
      { key: "SupervisorName", title: "form.supervisorName", type: "string", sortable: true },
      { key: "zone", title: "form.Zone", type: "string", sortable: false },
      { key: "shift", title: "form.Shift", type: "string", sortable: false },
      { key: "weekOffs", title: "form.WeekOffs", type: "string", sortable: false },
      { key: "Actions", title: "", type: "string", sortable: false },
    ],
    viewRecord: false,

    //  Weekdays config
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
