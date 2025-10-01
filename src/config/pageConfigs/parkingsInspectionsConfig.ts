import type { PageConfig } from "../../types/config";

export const parkingsInspectionsConfig: PageConfig = {
  key: "parkingsInspections",
  title: "page.title.parkingsInspections",
  name: { singular: "Parking Inspection", plural: "Parking Inspections" },

  api: {
    get: "/api/Inspection",
    post: "",
    put: "",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["entityNo", "plateNumber"],
    columnFilterKeys: ["inspectionStatus", "inspectionType"],
    dateRangeKey: "entityDateTime",
  },

  // No stats config - stats will be hidden
  statsConfig: [],

  tableConfig: {
    rowKey: "inspectionGUID",
    columns: [
      { key: "entityNo", title: "form.fineNumber", type: "string" },
      {
        key: "tradeLicenseNumber",
        title: "form.tradeLicense",
        type: "string",
      },
      { key: "inspectionType", title: "form.inspectionType", type: "number", filterable: true },
      // { key: "inspectionCategory", title: "form.fineType", type: "string", filterable: true },
      { key: "fineAmount", title: "form.fineAmount", type: "number" },

      { key: "entityDateTime", title: "form.finedDate", type: "date" },
      { key: "inspectionStatus", title: "form.inspectionStatus", type: "string", filterable: true },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "720px",
    fields: [],
  },
};
