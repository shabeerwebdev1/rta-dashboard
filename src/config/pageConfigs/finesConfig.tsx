import { CheckCircleOutlined, CloseCircleOutlined, DollarCircleOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import UAEPlate from "../../components/UAEPlate";

const plateSources: Record<number, string> = {
  1: "Dubai",
  2: "Abu Dhabi",
  3: "Ajman",
  4: "Sharjah",
  5: "Umm Al Quwain",
  6: "Fujairah",
  7: "Ras Al Khaimah",
  8: "Al Ain",
  9: "Other",
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
    globalSearchKeys: ["entityNo", "plateNumber"],
    columnFilterKeys: ["inspectionStatus", "vehicleColor", "fineType", "inspectionType"],
    dateRangeKey: "entityDateTime",
  },

  statsConfig: [
    {
  title: "Total Fines",
  icon: <span style={{  fontSize: 24 }}>AED</span>,
  value: (data) => data.length,
}
    ,
    {
      title: "Paid Fines",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.isPaid).length,
      color: "#52c41a",
    },
    {
      title: "Unpaid Fines",
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
            code={PLATE_TYPE_SHORT[record?.plateCategoryValue]}
            number={record?.plateNumber}
            emirateEn={plateSources[record?.plateSourceValue]}
            emirateAr={PLATE_COLOR[record?.plateCodeValue]}
          />
        ),
      },

      { key: "inspectionType", title: "form.inspectionType", type: "number", filterable: true },
      { key: "inspectionCategory", title: "form.fineType", type: "string", filterable: true },
      { key: "fineAmount", title: "form.fineAmount", type: "number" },

      { key: "entityDateTime", title: "form.finedDate", type: "date" },
      { key: "inspectionStatus", title: "form.inspectionStatus", type: "string", filterable: true },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "720px",
    fields: [],
  },
};
