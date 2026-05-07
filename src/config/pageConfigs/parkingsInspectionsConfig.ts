/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PageConfig } from "../../types/config";
import dayjs from "dayjs";
import "dayjs/locale/ar";

const formatDateTime = (value: number) => {
  if (!value) return "";

  const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");

  const isArabic = lang.startsWith("ar");

  return dayjs(value)
    .locale(isArabic ? "ar" : "en")
    .format(isArabic ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
};

export const parkingsInspectionsConfig: PageConfig = {
  key: "parkingsInspections",
  title: "page.title.parkingsfines",
  name: { singular: "Parking Inspection", plural: "Parking Inspections" },

  api: {
    get: "/api/Inspection",
    post: "",
    put: "",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["entityNo", "tradeLicenseNumber"],
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
      {
        key: "inspectorName",
        title: "form.inspectorName",
        type: "custom" as const,
        render: (_text: any, record: any) => {
          const getCurrentLanguage = () => {
            const storedLang = localStorage.getItem("i18nextLng");
            if (storedLang) return storedLang;
            if (document.documentElement.dir === "rtl") return "ar";
            if (document.body.classList.contains("rtl")) return "ar";
            return "en";
          };

          const language = getCurrentLanguage();
          const isArabic = language.startsWith("ar");

          return isArabic
            ? record?.inspectorNameAr || record?.inspectorNameEn || "No Data"
            : record?.inspectorNameEn || record?.inspectorNameAr || "No Data";
        },
      },

      { key: "inspectionType", title: "form.inspectionType", type: "number", filterable: true },
      // { key: "inspectionCategory", title: "form.fineType", type: "string", filterable: true },
      { key: "fineAmount", title: "form.fineAmount", type: "number", align: "center" },

      { key: "entityDateTime", title: "form.finedDate", type: "string", render: (value) => formatDateTime(value) },
      { key: "inspectionStatus", title: "form.finestatus", type: "string", filterable: true, align: "center" },
      { key: "paymentType", title: "form.paymentStatus", type: "string", align: "center" },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "720px",
    fields: [],
  },
};
