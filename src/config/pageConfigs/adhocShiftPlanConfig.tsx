// config/pageConfigs/adhocShiftPlanConfig.ts
import { PageConfig } from "../../types/config";

export const AdhocShiftPlanConfig: PageConfig = {
  key: "adhoc-shift-plan",
  title: "page.title.adhocshiftplan",
  name: { singular: "entity.adhocShiftPlan", plural: "Adhoc Shift Plans" },
  searchConfig: {
    globalSearchKeys: ["inspector"],
    columnFilterKeys: ["zone", "area", "shift"],
    dateRangeKey: "planDate",
  },
  tableConfig: {
    columns: [
      {
        key: "inspector",
        title: "form.inspector",
        dataIndex: "inspector",
        type: "string",
        width: "160px",
        fixed: "left",
        filterable: true,
      },
      {
        key: "month",
        title: "common.month",
        dataIndex: "month",
        type: "string",
        width: "120px",
        fixed: "left",
        filterable: true,
      },
      {
        key: "shift",
        title: "form.Shift",
        dataIndex: "shift",
        type: "string",
        width: "120px",
        fixed: "left",
        filterable: true,
      },
    ],
    viewRecord: false,
  },
};
