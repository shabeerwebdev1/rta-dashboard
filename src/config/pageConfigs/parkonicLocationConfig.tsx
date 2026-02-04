/* eslint-disable @typescript-eslint/no-explicit-any */
// Define the PageConfig interface if not already defined
import { CheckCircleOutlined, EnvironmentOutlined, ExclamationCircleOutlined, IdcardOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import { Tag } from "antd";
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

export const parkonicLocationPageConfig: PageConfig = {
  key: "parkonic-location",
  title: "page.title.parkonicLocations",
  showAssignButton: true,

  name: { singular: "entity.location", plural: "Locations" },
  api: {
    get: "/api/ParkonicLocation",
    post: "/api/ParkonicLocation",
    put: "/api/ParkonicLocation",
    delete: "/api/ParkonicLocation/:id",
  },
  searchConfig: {
    // globalSearchKeys: [i18n.language === "en" ? "parking_Name_En" : "parking_Name_Ar", "parkonics_Location_Id"],
    globalSearchKeys: ["parking_Name_En", "parking_Name_Ar", "parkonics_Location_Id"],
    columnFilterKeys: ["zone", "area"],
    dateRangeKey: "created_At",
  },
  statsConfig: [
    {
      title: "stats.TotalRecords",
      icon: <EnvironmentOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata.totalCount}`,
    },
    {
      title: "status.approved",
      icon: <CheckCircleOutlined />,
      value: (data) => `${data.filter((d) => d.isUpdatedBack).length} / ${data.length}`,
      color: "#52c41a",
    },
    {
      title: "status.pending",
      icon: <ExclamationCircleOutlined />,
      value: (data) => `${data.filter((d) => !d.isUpdatedBack).length} / ${data.length}`,
      color: "#faad14",
    },
  ],
  tableConfig: {
    columns: [
      { key: "parkonics_Location_Id", title: "form.parkonicsLocationId", type: "string" },
      { key: "parking_Name_En", title: "form.parkingNameEn", type: "string" },
      { key: "parking_Name_Ar", title: "form.parkingNameAr", type: "string" },
      // { key: "zone", title: "form.zone", type: "string" },
      // { key: "area", title: "form.area", type: "string" },
      {
        key: "created_At",
        title: "form.addedOn",
        type: "string",
        sortable: true,
        render: (value) => formatDateTime(value),
      },

      {
        key: "isUpdatedBack",
        title: "form.status",
        type: "custom",
        sortable: true,
        filterable: true,
        render: (status: string) => {
          const statusMap: Record<string, { text: string; color: string }> = {
            0: { text: "Approved", color: "green" },
            1: { text: "Pending", color: "blue" },
          };
          const { text, color } = statusMap[Number(status)] || { text: "Unknown", color: "default" };
          return <Tag color={color}>{text}</Tag>;
        },
      },
      { key: "updated_By", title: "form.approvedBy", type: "string" , },
      { key: "updated_At", title: "form.approvedDate", dataIndex: "long", type: "string", sortable: true },
    ],
    viewRecord: true,
  },
};
