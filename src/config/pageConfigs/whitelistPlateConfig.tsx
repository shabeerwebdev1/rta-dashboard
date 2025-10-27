import UAEPlate from "../../components/UAEPlate";
import type { PageConfig } from "../../types/config";
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

export const EMIRATES: Record<number, { en: string; ar: string; code: string }> = {
  1: { en: "Dubai", ar: "دبي", code: "DXB" },
  2: { en: "Abu Dhabi", ar: "أبو ظبي", code: "AUH" },
  3: { en: "Al Ain", ar: "العين", code: "AAN" },
  4: { en: "Sharjah", ar: "الشارقة", code: "SHJ" },
  5: { en: "Ajman", ar: "عجمان", code: "AJM" },
  6: { en: "Umm Al Quwain", ar: "أم القيوين", code: "UAQ" },
  7: { en: "Ras-Al-Khaimah", ar: "رأس الخيمة", code: "RAK" },
  8: { en: "Fujairah", ar: "الفجيرة", code: "FJR" },
  9: { en: "Other", ar: "أخرى", code: "OTH" },
};

export const PLATE_TYPE_SHORT: Record<number, string> = {
  1: "Private",
  2: "Taxi",
  3: "PubTra", // Public Transportation
  4: "Motorc", // Motorcycle
  6: "Other",
  8: "Classic",
  9: "Consul", // Consulate
  12: "EntMC", // Entertainment MotorCycle
  13: "Export",
  14: "Govern", // Government
  15: "Hospit", // Hospitality
  16: "IntOrg", // International Organization
  17: "Learn",
  19: "Munici", // Municipality
  20: "Police",
  21: "Probati", // Probation
  22: "Protoco", // Protocol
  24: "Test",
  30: "Ceremo", // Ceremonies
  31: "Classi", // Classical
  32: "Commerc", // Commercial
  33: "DataMi", // Data Migration
  34: "DriveL", // Driving Learning
  35: "DXBFlag",
  36: "DXBPoli", // Dubai Police
  37: "Import",
  38: "PolAuth", // Police Authority
  39: "PrivTra", // Private Transportation
  40: "Pub2",
  41: "SelfDr", // Self Driving Vehicle
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
  45: "10",
  46: "11",
  47: "12",
  48: "13",
  50: "14",
  51: "15",
  52: "16",
  53: "17",
  54: "18",
  55: "19",
  86: "50",
  100: "AA",
  44: "RAK-T", // shortened
  49: "Other",
  150: "CerWht", // shortened
  151: "Clssc", // Classic
  152: "Clsscl", // Classical
  153: "ClssMC", // ClassicMC
  154: "Conslt", // Consulate
  155: "Custm", // Customs
  156: "DataMg", // DataMigration
  157: "Diplmt", // Diplomat
  158: "DubFlg", // DubaiFlag
  159: "DubPol", // DubaiPolice
  160: "EntMtr", // EntertainmentMotorcycle
  161: "Govt",
  162: "GovWht", // GovernmentWhite
  163: "Green1",
  164: "Hosp", // Hospitality
  165: "HosBlu", // HospitalityBlue
  166: "HosYel", // HospitalityYellow
  167: "Import",
  168: "IntlOrg", // InternationalOrganization
  169: "Learn",
  170: "Mtrccl", // Motorcycle
  171: "Mtrc1",
  172: "Mtrc2",
  173: "Mtrc3",
  174: "Mtrc4",
  200: "Munic", // Municipality
  210: "Police",
  211: "PolAsn", // PoliticalAssociation
  220: "PrivTr", // PrivateTransportation
  221: "Probtn",
  222: "Proto",
  223: "PubTrn", // PublicTransportation
  224: "PubTr1",
  225: "PubTr2",
  226: "SelfDV", // SelfDrivingVehicle
  227: "Taxi",
  228: "Trade",
  229: "TrdWht", // TradeWhite
  230: "Trailr",
  231: "UndrT", // UnderTest
  232: "WhtGrn", // White and Green
  233: "WhtGrn",
  234: "Works",
};

export const whitelistPlateConfig: PageConfig = {
  key: "whitelist-plates",
  title: "page.title.whitelist-plates",
  name: { singular: "entity.plate", plural: "Plates" },
  api: {
    get: "/api/WhitelistPlate",
    post: "/api/WhitelistPlate",
    put: "/api/WhitelistPlate",
    delete: "/api/WhitelistPlate/:id",
  },
  searchConfig: {
    globalSearchKeys: ["plateNumber"],
    columnFilterKeys: ["plateSource_Id", "plateType_Id", "plateColor_Id", "plateStatus_Id", "exemptionReason_ID"],
    dateRangeKey: "FromDate",
  },
  statsConfig: [
    {
      title: "stats.TotalPlates",
      icon: <IdcardOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata?.totalRecords || 0}`,
    },
    {
      title: "stats.ActivePlates",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) =>
        `${data.filter((d) => d.plateStatus_Id === 5001).length} / ${metadata?.activeRecords || 0}`,
      color: "#52c41a",
    },
    {
      title: "stats.InactivePlates",
      icon: <CloseCircleOutlined />,
      value: (data, metadata) =>
        `${data.filter((d) => d.plateStatus_Id === 5002).length} / ${metadata?.inactiveRecords || 0}`,
      color: "#ff4d4f",
    },
    {
      title: "stats.ExpiredPlates",
      icon: <CloseCircleOutlined />,
      value: (data, metadata) => {
        const today = new Date();
        const expiredCount = data.filter((d) => d.toDate && new Date(d.toDate) < today).length;
        return `${expiredCount} / ${metadata?.expiredRecords || 0}`;
      },
      color: "#faad14",
    },

    {
      title: "stats.IsByLaw",
      icon: <CheckCircleOutlined />,
      value: (data) => `${data.filter((d) => d.isByLaw === true).length}`,
      color: "#1890ff",
    },
  ],

  tableConfig: {
    columns: [
      {
        key: "plateNumber",
        title: "form.Number",
        type: "ReactNode",
        width: "160px",
        align: "center",
        render: (_, record) => {
          return (
            <UAEPlate
              code={PLATE_COLOR[record.plateColor_Id] || ""}
              number={record.plateNumber}
              emirateEn={EMIRATES[record.plateSource_Id]?.en || ""}
              emirateAr={EMIRATES[record.plateSource_Id]?.ar || ""}
            />
          );
        },
      },
      {
        key: "plateSource_Id",
        title: "form.Source",
        dataIndex: "plateSource_Id",
        type: "string",
        sortable: true,
        filterable: true,
        lookupCategory: 200,
      },
      {
        key: "plateType_Id",
        title: "form.Type",
        dataIndex: "plateType_Id",
        type: "string",
        filterable: true,
        lookupCategory: 300,
      },
      {
        key: "plateColor_Id",
        title: "form.Color",
        dataIndex: "plateColor_Id",
        type: "badge",
        lookupCategory: 400,
        filterable: true,
      },
      { key: "fromDate", title: "form.fromDate", dataIndex: "fromDate", type: "date", sortable: true },
      { key: "toDate", title: "form.toDate", dataIndex: "toDate", type: "date", sortable: true },
      {
        key: "plateStatus_Id",
        title: "form.status",
        dataIndex: "plateStatus_Id",
        type: "tag",
        filterable: true,
        lookupCategory: 500,
      },
      {
        key: "exemptionReason_ID",
        title: "form.exemptionReason",
        dataIndex: "exemptionReason_ID",
        type: "string",
        lookupCategory: 100,
        filterable: true,
      },
      { key: "isByLaw", title: "form.isByLaw", dataIndex: "isByLaw", type: "string", align: "center" },
    ],
    viewRecord: true,
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "plateNumber",
        label: "form.plateNumber",
        type: "text",
        required: true,
        span: 12,
        validationType: "plateNumber",
      },
      {
        name: "plateSource_Id",
        label: "form.plateSource",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "plateType_Id",
        label: "form.plateType",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "plateColor_Id",
        label: "form.plateColor",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "dateRange",
        label: "form.dateRange",
        type: "dateRange",
        required: true,
        span: 24,
        fieldMapping: { from: "fromDate", to: "toDate" },
        disablePastDates: true,
      },
      {
        name: "exemptionReason_ID",
        label: "form.exemptionReason",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "plateStatus_Id",
        label: "form.status",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "isByLaw",
        label: "form.isByLaw",
        type: "select",
        required: false,
        span: 12,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
};
