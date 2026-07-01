/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import UAEPlate from "../../components/UAEPlate";
import "dayjs/locale/ar";
import dayjs from "dayjs";

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

// export const PLATE_TYPE_SHORT: Record<number, string> = {
//   1: "Private",
//   2: "Taxi",
//   3: "PubTra",
//   4: "Motorc", // Motorcycle
//   5: "TaxiYel", // Taxi Yellow
//   6: "Other", // Other (Specify)
//   7: "Public",
//   8: "Classic",
//   9: "Consul", // Consulate
//   10: "Customs",
//   11: "Diplom", // Diplomat
//   12: "EntMC", // Entertainment Motorcycle
//   13: "Export",
//   14: "Govern", // Government
//   15: "Hospit", // Hospitality
//   16: "IntOrg", // International Organization
//   17: "Learn", // Learning
//   18: "LocGua", // Local Guard
//   19: "Munici", // Municipality
//   20: "Police",
//   21: "Probati", // Probation
//   22: "Protoco", // Protocol
//   23: "Trade", // Trade Plate
//   24: "Test", // Under Test
// };

export const PLATE_TYPE_SHORT: Record<number, string> = {
  1: "Private",
  2: "Taxi",
  3: "Public Transportation",
  4: "Motorcycle",
  5: "Taxi Yellow",
  6: "Other (Specify)",
  7: "Public",
  8: "Classic",
  9: "Consulate",
  10: "Customs",
  11: "Diplomat",
  12: "Entertainment Motorcycle",
  13: "Export",
  14: "Government",
  15: "Hospitality",
  16: "International Organization",
  17: "Learning",
  18: "Local Guard",
  19: "Municipality",
  20: "Police",
  21: "Probation",
  22: "Protocol",
  23: "Trade Plate",
  24: "Under Test",
  30: "Ceremonies",
  31: "Classical",
  32: "Commercial",
  33: "Data Migration",
  34: "Driving Learning",
  35: "Dubai Flag",
  36: "Dubai Police",
  37: "Import",
  38: "Political Authority",
  39: "Private Transportation",
  40: "Public 2",
  41: "Self Driving Vehicle",
  42: "Trade",
  43: "Trailer",
  44: "Works",
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
  52: "16",
  53: "17",
  54: "18",
  55: "19",
  86: "50",
  100: "AA",

  150: "CeremWR",
  151: "Classic",
  152: "Classical",
  153: "ClassicMC",
  154: "Consulate",
  155: "Customs",
  156: "DataMig",
  157: "Diplom",
  158: "DubaiFlg",
  159: "DubaiPol",
  160: "EntMC",
  161: "Govern",
  162: "GovWhite",
  163: "Green1",
  164: "Hospit",
  165: "HospBlue",
  166: "HospYel",
  167: "Import",
  168: "IntOrg",
  169: "Learn",
  170: "Motorc",
  171: "Motor1",
  172: "Motor2",
  173: "Motor3",
  174: "Motor4",
  200: "Munici",
  210: "Police",
  211: "Politic",
  220: "PrivTra",
  221: "Probati",
  222: "Protoco",
  223: "Public",
  224: "Public1",
  225: "Public2",
  226: "Test",
  227: "Taxi",
  228: "Trade",
  229: "TradeW",
  230: "Trailer",
  231: "Probati",
  232: "WhiteGr",
  233: "WhiteG",
  234: "Works",
};

// export const PLATE_COLOR: Record<number, string> = {
//   1: "A",
//   2: "B",
//   3: "C",
//   4: "D",
//   5: "E",
//   6: "F",
//   7: "G",
//   8: "H",
//   9: "I",
//   10: "J",
//   11: "K",
//   12: "L",
//   13: "M",
//   14: "N",
//   15: "O",
//   16: "P",
//   17: "Q",
//   18: "R",
//   19: "S",
//   20: "T",
//   21: "U",
//   22: "V",
//   23: "W",
//   24: "X",
//   25: "Y",
//   26: "Z",
//   27: "White",
//   28: "Orange",
//   29: "Red",
//   30: "Gray",
//   31: "Blue",
//   32: "Green",
//   33: "Black",
//   34: "Yellow",
//   35: "1",
//   36: "2",
//   37: "3",
//   38: "4",
//   39: "5",
//   40: "6",
//   41: "7",
//   42: "8",
//   43: "9",
//   44: "RAK-Tower",
//   45: "10",
//   46: "11",
//   47: "12",
//   48: "13",
//   49: "Other",
//   50: "14",
//   51: "15",
// };

export const finesConfig: PageConfig = {
  key: "fines",
  title: "page.title.vehicleInspections",
  name: { singular: "Fine", plural: "Fines" },
  api: {
    get: "/api/Inspection",
    post: "",
    put: "",
    delete: "",
  },
  searchConfig: {
    globalSearchKeys: ["entityNo", "plateNumber", "inspectorNameEn"],
    columnFilterKeys: ["inspectionStatus", "vehicleColor", "fineType", "inspectionType"],
    dateRangeKey: "entityDateTime",
  },

  statsConfig: [
    {
      title: "stats.totalFines",
      icon: <span style={{ fontSize: 24 }}>AED</span>,
      value: (data) => data.length,
    },
    {
      title: "stats.paidFines", // This should match your translation key
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.isPaid).length,
      color: "#52c41a",
    },
    {
      title: "stats.unpaidFines", // This should match your translation key
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => !d.isPaid).length,
      color: "#ff4d4f",
    },
  ],

  tableConfig: {
    rowKey: "inspectionGUID",
    columns: [
      { key: "entityNo", title: "form.fineNumber", type: "string" },
      {
        key: "plateNumber",
        title: "form.plateNumber",
        type: "custom",
        render: (_, record) => (
          <UAEPlate
            code={PLATE_COLOR[record?.plateCodeValue] || ""}
            number={record?.plateNumber}
            emirateEn={plateSources[record?.plateSourceValue]?.en || ""}
            emirateAr={plateSources[record?.plateSourceValue]?.ar || ""}
          />
        ),
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
