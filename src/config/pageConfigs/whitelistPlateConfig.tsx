import UAEPlate from "../../components/UAEPlate";
import type { PageConfig } from "../../types/config";
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

export const EMIRATES: Record<number,{ en: string; ar: string; code: string }> = {
  2001: { en: "Dubai", ar: "دبي", code: "DXB" },
  2002: { en: "Abu Dhabi", ar: "أبو ظبي", code: "AUH" },
  2003: { en: "Sharjah", ar: "الشارقة", code: "SHJ" },
  2004: { en: "Ajman", ar: "عجمان", code: "AJM" },
  2005: { en: "Ras Al Khaimah", ar: "رأس الخيمة", code: "RAK" },
  2006: { en: "Fujairah", ar: "الفجيرة", code: "FJR" },
  2007: { en: "Umm Al Quwain", ar: "أم القيوين", code: "UAQ" },
};

export const whitelistPlateConfig: PageConfig = {
  key: "whitelist-plates",
  title: "page.title.whitelist-plates",
  name: { singular: "Plate", plural: "Plates" },
  api: {
    get: "/api/WhitelistPlate",
    post: "/api/WhitelistPlate",
    put: "/api/WhitelistPlate",
    delete: "/api/WhitelistPlate/:id",
  },
  searchConfig: {
    globalSearchKeys: ["plateNumber"],
    columnFilterKeys: ["plateSource_Id", "plateType_Id", "plateColor_Id", "plateStatus_Id", "exemptionReason_ID"],
    dateRangeKey: "fromDate",
  },
  statsConfig: [
    { title: "Total Plates", icon: <IdcardOutlined />, value: (data) => data.length },
    {
      title: "Active Plates",
      icon: <CheckCircleOutlined />,
      value: (data) => data.filter((d) => d.plateStatus_Id === 5001).length,
      color: "#52c41a",
    },
    {
      title: "Inactive Plates",
      icon: <CloseCircleOutlined />,
      value: (data) => data.filter((d) => d.plateStatus_Id === 5002).length,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    columns: [
      {
        key: "plateUI",
        title: "Plate Preview",
        type: "ReactNode",
        width: "160px",
        align: "center",
        render: (_, record) => {
          return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <UAEPlate
                code={record.plateType_Id}
                number={record.plateNumber}
                emirateEn={EMIRATES[record.plateSource_Id]?.en || ""}
                emirateAr={EMIRATES[record.plateSource_Id]?.ar || ""}
              />
            </div>
          );
        },
      },
      { key: "plateNumber", title: "form.plateNumber", dataIndex: "plateNumber", type: "string", sortable: true },
      {
        key: "plateSource_Id",
        title: "form.plateSource",
        dataIndex: "plateSource_Id",
        type: "string",
        sortable: true,
        filterable: true,
        lookupCategory: 200,
      },
      {
        key: "plateType_Id",
        title: "form.plateType",
        dataIndex: "plateType_Id",
        type: "string",
        filterable: true,
        lookupCategory: 300,
      },
      {
        key: "plateColor_Id",
        title: "form.plateColor",
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
      { key: "isByLaw", title: "form.isByLaw", dataIndex: "isByLaw", type: "string" },
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
