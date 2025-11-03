import { PageConfig } from "../../types/config";

export const carPlatePageConfig: PageConfig = {
  key: "CarPlate",
  tableConfig: {
    rowKey: "entityNo",
    columns: [
      { key: "entityNo", title: "form.fineNumber", type: "string" },
      { key: "totalFineAmount", title: "form.amount", type: "number" },
      { key: "entityDateTime", title: "form.date", type: "date" },
    ],
    viewRecord: true,
  },
};
