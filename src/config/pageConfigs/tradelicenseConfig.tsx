import { CheckCircleOutlined, CloseCircleOutlined, FileSearchOutlined } from "@ant-design/icons";
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

export const tradeLicenseConfig: PageConfig = {
  key: "tradeLicenseInspections",
  title: "page.title.parkingsInspections",
  name: { singular: "Trade License Inspection", plural: "Trade License Inspections" },

  api: {
    get: "/api/Inspection",
    post: "",
    put: "",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["entityNo", "tradeLicenseNumber", "inspectorNameEn"],
    columnFilterKeys: ["inspectionStatus", "inspectionType", "inspectionCategory"],
    dateRangeKey: "entityDateTime",
  },

  statsConfig: [
    {
      title: "stats.TotalInspections",
      icon: <FileSearchOutlined />,
      value: (data) => data.length,
    },
    {
      title: "status.approved",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.inspectionStatus === "Approved").length,
      color: "#52c41a",
    },
    {
      title: "status.rejected",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.inspectionStatus === "Rejected").length,
      color: "#ff4d4f",
    },
  ],

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
      { key: "inspectionCategory", title: "form.fineType", type: "string", filterable: true },
      // { key: "fineAmount", title: "form.fineAmount", type: "number" },

      {
        key: "entityDateTime",
        title: "form.inspectionDate",
        type: "string",
        render: (value) => formatDateTime(value),
        sortable: true,
      },
      { key: "inspectionStatus", title: "form.inspectionStatus", type: "string", filterable: true, align: "center" },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "720px",
    fields: [],
  },
};
