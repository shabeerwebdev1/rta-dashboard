import type { PageConfig } from "../../types/config";
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import UAEPlate from "../../components/UAEPlate";
import dayjs from "dayjs";
export const plateSources: Record<number, { en: string; ar: string }> = {
  1: { en: "Dubai", ar: "دبي" },
  2: { en: "Abu Dhabi", ar: "ابوظبي" },
  3: { en: "Al-Ain", ar: "العين" },
  4: { en: "Sharjah", ar: "الشارقة" },
  5: { en: "Ajman", ar: "عجمان" },
  6: { en: "Umm-ul-Quwain", ar: "أم القيوين" },
  7: { en: "Ras-Al-Khaimah", ar: "رأس الخيمة" },
  8: { en: "Fujairah", ar: "الفجيرة" },
  9: { en: "Other", ar: "أخرى" },
  10: { en: "test", ar: "test" },
};

export const PLATE_TYPE_SHORT: Record<number, string> = {
  1: "Private",
  2: "Taxi",
  3: "PubTra",
  4: "Motorc", // Motorcycle
  5: "TaxiYel", // Taxi Yellow
  6: "Other", // Other (Specify)
  7: "Public",
  8: "Classic",
  9: "Consul", // Consulate
  10: "Customs",
  11: "Diplom", // Diplomat
  12: "EntMC", // Entertainment Motorcycle
  13: "Export",
  14: "Govern", // Government
  15: "Hospit", // Hospitality
  16: "IntOrg", // International Organization
  17: "Learn", // Learning
  18: "LocGua", // Local Guard
  19: "Munici", // Municipality
  20: "Police",
  21: "Probati", // Probation
  22: "Protoco", // Protocol
  23: "Trade", // Trade Plate
  24: "Test", // Under Test
};

export const PLATE_COLOR: Record<number, string> = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
  5: "E",
  6: "F",
  7: "G",
  8: "H",
  9: "I",
  10: "J",
  11: "K",
  12: "L",
  13: "M",
  14: "N",
  15: "O",
  16: "P",
  17: "Q",
  18: "R",
  19: "S",
  20: "T",
  21: "U",
  22: "V",
  23: "W",
  24: "X",
  25: "Y",
  26: "Z",
  27: "White",
  28: "Orange",
  29: "Red",
  30: "Gray",
  31: "Blue",
  32: "Green",
  33: "Black",
  34: "Yellow",
  35: "1",
  36: "2",
  37: "3",
  38: "4",
  39: "5",
  40: "6",
  41: "7",
  42: "8",
  43: "9",
  44: "RAK-Tower",
  45: "10",
  46: "11",
  47: "12",
  48: "13",
  49: "Other",
  50: "14",
  51: "15",
};
export const parkonicPageConfig: PageConfig = {
  key: "parkonic",
  title: "page.title.parkonic",
  name: { singular: "Parkonic Record", plural: "Parkonic Records" },
  api: { get: "/api/Parkonic", post: "", put: "/api/Parkonic/Review", delete: "" },
  searchConfig: {
    // globalSearchKeys: ["entityNo", "plateNumber"],
    globalSearchKeys: ["plateNumber"],
    columnFilterKeys: ["reviewStatus"],
    dateRangeKey: "Entry_DateTime",
  },
  statsConfig: [
    {
      title: "stats.TotalRecords",
      icon: <IdcardOutlined />,
      value: (data, metadata) => `${data.length}/${metadata.total}`,
    },
    {
      title: "status.approved",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) => `${data.filter((d) => d.reviewStatus === 1).length}/${metadata.total}`,
      color: "#52c41a",
    },
    {
      title: "status.rejected",
      icon: <CloseCircleOutlined />,
      value: (data, metadata) => `${data.filter((d) => d.reviewStatus === 0).length}/${metadata.total}`,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    rowKey: "fineId",
    columns: [
      // { key: "entityNo", title: "form.fineNumber", type: "string", sortable: true },
      {
        key: "plateNumber",
        title: "form.vehicleNumber",
        type: "string",
        render: (_, record) => (
          <UAEPlate
            code={PLATE_COLOR[record?.plateCode] || ""}
            number={record?.plateNumber}
            emirateEn={plateSources[record?.plateSource]?.en || ""}
            emirateAr={plateSources[record?.plateSource]?.ar || ""}
          />
        ),
      },

      {
        key: "entryDateTime",
        title: "form.vehicleEntry",
        type: "string",
        sortable: true,
        render: (value) => dayjs(value).format("DD-MM-YYYY, hh:mm A"),
      },
      {
        key: "exitDateTime",
        title: "form.vehicleExit",
        type: "string",
        sortable: true,
        render: (value) => dayjs(value).format("DD-MM-YYYY, hh:mm A"),
      },
      {
        key: "reviewStatus",
        title: "form.status",
        type: "custom",
        sortable: true,
        filterable: true,
        render: (status: number) => {
          const statusMap: Record<number, { text: string; color: string }> = {
            0: { text: "Rejected", color: "red" },
            1: { text: "Approved", color: "green" },
            2: { text: "Pending", color: "blue" },
          };
          const { text, color } = statusMap[status ?? 2] || { text: "Unknown", color: "default" };
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        key: "reviewer_name",
        title: "form.reviewedBy",
        type: "string",
        sortable: true,
        render: (value) => value ?? "",
      },
    ],
    viewRecord: true,
  },
  formConfig: { modalWidth: "0", fields: [] },
};
