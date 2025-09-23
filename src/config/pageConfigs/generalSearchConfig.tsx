import { PageConfig } from "../../types/config";

export const carPlatePageConfig: PageConfig = {
  key: "CarPlate",
  tableConfig: {
    rowKey: "entityNo",
    columns: [
      { key: "entityNo", title: "Entity No", type: "string" },
      { key: "totalFineAmount", title: "Amount", type: "number" },
      { key: "entityDateTime", title: "Date", type: "date" },
    ],
    viewRecord: true,
  },
};



export const tradeLicensePageConfig: PageConfig = {
  key: "TradeLicense",
  title: "page.title.tradeLicense",
  name: { singular: "Trade License", plural: "Trade Licenses" },
  api: { get: "", post: "", put: "", delete: "" },
  tableConfig: {
    rowKey: "entityNo", // Changed from fineId to entityNo
    columns: [
      { key: "entityNo", title: "Entity No", type: "string" }, // Changed from fineId to entityNo
      { key: "violation", title: "Violation", type: "string" },
      { key: "amount", title: "Amount", type: "number" },
      { key: "date", title: "Date", type: "date" },
    ],
    viewRecord: true, // Changed to true to enable view functionality
  },
  formConfig: { modalWidth: "0", fields: [] },
};