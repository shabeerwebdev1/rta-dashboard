import type { PageConfig } from "../../types/config";
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Space, Tag, Tooltip, Typography } from "antd";
import UAEPlate from "../../components/UAEPlate";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { formatDateTimeDisplay } from "../../utils/dateFormatter";

const formatDateTime = (value: number) => {
  if (!value) return "";

  const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");

  const isArabic = lang.startsWith("ar");

  return dayjs(value)
    .locale(isArabic ? "ar" : "en")
    .format(isArabic ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
};

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
      title: "status.pending",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) => `${data.filter((d) => d.reviewStatus === 0).length}/${metadata.pendingRecords}`,
      color: "#1890ff",
    },
    {
      title: "status.approved",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) => `${data.filter((d) => d.reviewStatus === 1).length}/${metadata.approvedRecords}`,
      color: "#52c41a",
    },
    {
      title: "status.rejected",
      icon: <CloseCircleOutlined />,
      value: (data, metadata) => `${data.filter((d) => d.reviewStatus === 2).length}/${metadata.rejectedRecords}`,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    rowKey: "fineId",
    columns: [
      {
        key: "entityNo",
        title: "form.refernecenumber",
        type: "custom",
        render: (_: any, record: any) => {
          if (record.reviewStatus === 1) {
            return record.entityNo || "-"; // Approved
          }

          return record.transcationId || "-"; // Pending or Rejected
        },
      },

      {
        key: "plateNumber",
        title: "form.vehiclePlate",
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

      // {
      //   key: "entryDateTime",
      //   title: "form.vehicleEntry",
      //   type: "string",
      //   sortable: true,
      //   render: (value) => formatDateTime(value),
      // },
      // {
      //   key: "exitDateTime",
      //   title: "form.vehicleExit",
      //   type: "string",
      //   sortable: true,
      //   render: (value) => formatDateTime(value),
      // },
      {
        key: "categoryId",
        title: "form.violationCategory",
        type: "custom" as const,
        render: (_: any, record: any) => {
          const getCurrentLanguage = () => {
            const storedLang = localStorage.getItem("i18nextLng");
            if (storedLang) return storedLang;
            if (document.documentElement.dir === "rtl") return "ar";
            if (document.body.classList.contains("rtl")) return "ar";
            return "en";
          };

          const isArabic = getCurrentLanguage().startsWith("ar");

          const violationText = isArabic
            ? record?.violationNameAr || record?.violationNameEn
            : record?.violationNameEn || record?.violationNameAr;

          return (
            <Tooltip title={violationText || "No Data"} placement="topLeft">
              <Typography.Text style={{ cursor: "help" }}>{record?.categoryId ?? "—"}</Typography.Text>
            </Tooltip>
          );
        },
      },

      {
        key: "violationAmount",
        title: "form.violationAmount",
        type: "number",
        render: (value?: number) => <Typography.Text type="danger"> AED {value ?? "—"} </Typography.Text>,
      },

      {
        key: "reviewStatus",
        title: "form.reviewtatus",
        type: "custom",
        filterable: true,
        render: (status: number) => {
          const getCurrentLanguage = () => {
            const storedLang = localStorage.getItem("i18nextLng");
            if (storedLang) return storedLang;
            if (document.documentElement.dir === "rtl") return "ar";
            if (document.body.classList.contains("rtl")) return "ar";
            return "en";
          };

          const language = getCurrentLanguage();
          const isArabic = language.startsWith("ar");

          const statusMap: Record<number, { en: string; ar: string; color: string }> = {
            0: { en: "Pending", ar: "قيد الانتظار", color: "orange" },
            1: { en: "Approved", ar: "مُوافق عليه", color: "green" },
            2: { en: "Rejected", ar: "مُرفوض", color: "red" },
          };

          const statusItem = statusMap[status ?? 2] || { en: "Unknown", ar: "غير معروف", color: "default" };
          const text = isArabic ? statusItem.ar : statusItem.en;

          return <Tag color={statusItem.color}>{text}</Tag>;
        },
      },
      {
        key: "createdDateTime",
        title: "form.addedOn",
        type: "string",
        sortable: true,
        render: (value) => formatDateTime(value),
      },

      {
        key: "reviewerName",
        title: "form.reviewedBy",
        type: "string",
        sortable: true,
        render: (value) => value ?? "",
      },
      {
        key: "reviewedDtTm",
        title: "form.reviewedDate",
        type: "string",
        sortable: true,
        render: (value) => (value ? formatDateTimeDisplay(value) : ""),
      },
      {
        key: "review_updateback_status",
        title: "form.integrationStatus",
        type: "custom",
        sortable: true,
        render: (status?: number) => {
          if (status === null || status === undefined) {
            return null;
          }

          const getCurrentLanguage = () => {
            const storedLang = localStorage.getItem("i18nextLng");
            if (storedLang) return storedLang;
            if (document.documentElement.dir === "rtl") return "ar";
            if (document.body.classList.contains("rtl")) return "ar";
            return "en";
          };

          const language = getCurrentLanguage();
          const isArabic = language.startsWith("ar");

          const statusMap: Record<number, { en: string; ar: string; color: string }> = {
            1: { en: "Success", ar: "ناجح", color: "green" },
            2: { en: "Failed", ar: "فشل", color: "red" },
          };

          const statusItem = statusMap[status];
          if (!statusItem) {
            return null;
          }

          const text = isArabic ? statusItem.ar : statusItem.en;
          return <Tag color={statusItem.color}>{text}</Tag>;
        },
      },
      // {
      //   key: "review_updateback_status",
      //   title: "form.integrationStatus",
      //   type: "custom",
      //   sortable: true,
      //   render: (status?: number) => {
      //     if (status === null || status === undefined) return null;

      //     const getCurrentLanguage = () => {
      //       const storedLang = localStorage.getItem("i18nextLng");
      //       if (storedLang) return storedLang;
      //       if (document.documentElement.dir === "rtl") return "ar";
      //       return "en";
      //     };

      //     const isArabic = getCurrentLanguage().startsWith("ar");

      //     const statusMap: Record<number, { en: string; ar: string; color: string }> = {
      //       1: { en: "Success", ar: "ناجح", color: "green" },
      //       2: { en: "Failed", ar: "فشل", color: "red" },
      //     };

      //     const statusItem = statusMap[status];
      //     if (!statusItem) return null;

      //     const text = isArabic ? statusItem.ar : statusItem.en;

      //     const StatusRow = ({ label }: { label: string }) => (
      //       <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      //         <span style={{ fontSize: 12, color: "black", minWidth: 70 }}>{label}</span>
      //         <Tag color={statusItem.color}>{text}</Tag>
      //       </div>
      //     );

      //     return (
      //       <Space direction="vertical" size={10}>
      //         <StatusRow label="Parkonic" />
      //         <StatusRow label="eTraffic" />
      //       </Space>
      //     );
      //   },
      // },
    ],
    viewRecord: true,
  },
  formConfig: { modalWidth: "0", fields: [] },
};
