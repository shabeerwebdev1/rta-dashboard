import { PageConfig } from "../../types/config";

export const ShiftPlanningConfig: PageConfig = {
  key: "shift-planning",
  title: "page.title.shiftplanning",
  name: { singular: "entity.shiftPlan", plural: "Shift Plans" },
  api: {
    get: "/api/ShiftPlan",
    post: "/api/ShiftPlan",
    put: "/api/ShiftPlan",
    delete: "/api/ShiftPlan/:id",
  },
  searchConfig: {
    globalSearchKeys: ["inspector"],
    columnFilterKeys: ["zone", "area"],
    dateRangeKey: "planDate",
  },
  tableConfig: {
    columns: [
      {
        key: "inspector",
        title: "shiftPlanning.inspector",
        dataIndex: "inspector",
        type: "string",
        width: "160px",
        fixed: "left",
        filterable: true,
      },
    ],
    viewRecord: false,
  },
};