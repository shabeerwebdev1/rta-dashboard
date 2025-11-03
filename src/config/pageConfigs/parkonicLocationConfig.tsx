/* eslint-disable @typescript-eslint/no-explicit-any */
// Define the PageConfig interface if not already defined
import type { PageConfig } from "../../types/config";

export const parkonicLocationPageConfig: PageConfig = {
  key: "parkonic-location",
  title: "page.title.parkonicLocation",
  showAssignButton: true,

  name: { singular: "entity.location", plural: "Locations" },
  api: {
    get: "/api/ParkonicLocation",
    post: "/api/ParkonicLocation",
    put: "/api/ParkonicLocation",
    delete: "/api/ParkonicLocation/:id",
  },
  searchConfig: {
    globalSearchKeys: ["parkingName"],
    columnFilterKeys: ["zone", "area"],
    dateRangeKey: "created_At",
  },
  tableConfig: {
    columns: [
      { key: "parkonics_Location_Id", title: "form.parkonicslocationId", type: "string" },
      {
        key: "parkingName",
        title: "form.parkingName",
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
            ? record?.parking_Name_Ar || record?.parking_Name_En || "No Data"
            : record?.parking_Name_En || record?.parking_Name_Ar || "No Data";
        },
      },

      { key: "created_At", title: "form.addedOn", dataIndex: "long", type: "string", sortable: true },
    ],
    viewRecord: true,
  },
};
