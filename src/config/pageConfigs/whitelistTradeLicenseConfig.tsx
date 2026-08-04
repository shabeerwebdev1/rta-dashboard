import type { PageConfig } from "../../types/config";
import dayjs from "dayjs";
import { IdcardOutlined, CheckCircleOutlined, FieldTimeOutlined } from "@ant-design/icons";
import "dayjs/locale/ar";

const formatDate = (value: string) => {
  if (!value) return "";

  const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");
  const isArabic = lang.startsWith("ar");

  return dayjs(value)
    .locale(isArabic ? "ar" : "en")
    .format(isArabic ? "DD MMMM YYYY" : "DD MMM YYYY");
};

export const whitelistTradeLicenseConfig: PageConfig = {
  key: "whitelist-tradelicenses",
  title: "page.title.whitelist-tradelicenses",
  name: { singular: "entity.tradeLicense", plural: "Trade Licenses" },
  api: {
    get: "/api/WhitelistTradeLicense",
    post: "/api/WhitelistTradeLicense",
    put: "/api/WhitelistTradeLicense/update",
    delete: "/api/WhitelistTradeLicense/:id",
  },
  searchConfig: {
    globalSearchKeys: ["tradeLicenseNumber", "tradeLicense_EN_Name", "plotNumber"],
    columnFilterKeys: ["plateStatus"],
    dateRangeKey: "FromDate",
  },
  statsConfig: [
    {
      title: "stats.TotalLicenses",
      icon: <IdcardOutlined />,
      value: (data, metadata) => `${data?.length || 0} / ${metadata?.totalCount || 0}`,
    },
    {
      title: "stats.ActiveLicenses",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) =>
        `${data?.filter((d) => d.plateStatus_Id === 5001).length || 0} / ${metadata?.activeRecords || 0}`,
      color: "#52c41a",
    },
    {
      title: "stats.InactiveLicenses",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) =>
        `${data?.filter((d) => d.plateStatus_Id === 5002).length || 0} / ${metadata?.inactiveRecords || 0}`,
      color: "#faad14",
    },
    {
      title: "stats.ExpiredLicenses",
      icon: <FieldTimeOutlined />,
      value: (data, metadata) =>
        `${data?.filter((d) => d.plateStatus_Id === 5003).length || 0} / ${metadata?.expiredRecords || 0}`,
      color: "#ff4d4f",
    },
  ],
  tableConfig: {
    columns: [
      { key: "tradeLicenseNumber", title: "form.tradeLicenseNumber", type: "string", sortable: true },
      { key: "tradeLicense_EN_Name", title: "form.tradeLicense_EN_Name", type: "string", sortable: true },
      { key: "tradeLicense_AR_Name", title: "form.tradeLicense_AR_Name", type: "string", sortable: true },
      { key: "plotNumber", title: "form.plotNumber", type: "string", sortable: true },
      { 
        key: "fromDate", 
        title: "form.fromDate", 
        type: "date", 
        sortable: true,
        render: (value: string) => formatDate(value),
      },
      { 
        key: "toDate", 
        title: "form.toDate", 
        type: "date", 
        sortable: true,
        render: (value: string) => formatDate(value),
      },
      {
        key: "plateStatus_Id",
        title: "form.status",
        dataIndex: "plateStatus_Id",
        type: "tag",
        filterable: true,
        lookupCategory: 500,
        align: "center",
      },
    ],
    viewRecord: true,
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "tradeLicenseNumber",
        label: "form.tradeLicenseNumber",
        type: "text",
        required: true,
        span: 12,
        validationType: "alphanumeric_hyphen_uppercase",
      },
      {
        name: "tradeLicense_EN_Name",
        label: "form.tradeLicense_EN_Name",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "tradeLicense_AR_Name",
        label: "form.tradeLicense_AR_Name",
        type: "text",
        required: true,
        span: 12,
        validationType: "arabic",
      },
      {
        name: "plotNumber",
        label: "form.plotNumber",
        type: "text",
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
        label: "form.exemptionReason_ID",
        type: "select",
        required: true,
        span: 12,
        options: [
          { label: "Govt Entity", value: 1 },
          { label: "Diplomatic Entity", value: 2 },
        ],
        showLabel: true,
      },
      {
        name: "plateStatus_Id",
        label: "form.status",
        type: "select",
        required: true,
        span: 12,
        options: ["Active", "Inactive"],
      },
    ],
  },
};