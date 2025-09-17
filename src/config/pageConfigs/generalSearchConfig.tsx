import { PageConfig } from "../../types/config";

export const carPlatePageConfig: PageConfig = {
  key: "CarPlate",
  title: "page.title.carPlate",
  name: { singular: "Car Plate", plural: "Car Plates" },
  api: { get: "", post: "", put: "", delete: "" },
  tableConfig: {
    rowKey: "entityNo", // Changed from fineId to entityNo
    columns: [
      { key: "entityNo", title: "Entity No", type: "string" }, // Changed from fineId to entityNo
      
      { key: "amount", title: "Amount", type: "number" },
      { key: "date", title: "Date", type: "date" },
    ],
    viewRecord: true, // Changed to true to enable view functionality
  },
  formConfig: { modalWidth: "0", fields: [] },
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