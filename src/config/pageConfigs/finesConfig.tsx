import { CheckCircleOutlined, CloseCircleOutlined, DollarCircleOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import UAEPlate from "../../components/UAEPlate";
import TradeLicenseCard from "../../components/TradeLicenseCard";

export const finesConfig: PageConfig = {
  key: "fines",
  title: "page.title.inspectionmanagement",
  name: { singular: "Fine", plural: "Fines" },
  api: {
    get: "/api/Inspection",
    post: "",
    put: "",
    delete: "",
  },
  searchConfig: {
    globalSearchKeys: ["Fine Number", "Plate Number", "TL Number"],
    columnFilterKeys: ["inspectionStatus", "vehicleColor", "fineType", "inspectionType"],
    dateRangeKey: "entityDateTime",
  },

  statsConfig: [
    {
      title: "Total Fines",
      icon: <DollarCircleOutlined />,
      value: (data) => data.length,
    },
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
        key: "identification",
        title: "form.tradeLicenseOrPlate",
        type: "custom",
        render: (_, record) => {
          if (record?.tradeLicenseNumber) {
            return (
              <TradeLicenseCard
                code={record?.tradeLicenseNumber}
                number={record?.tradeLicenseNameEn}
                emirateAr={record?.tradeLicenseNameAr}
              />
            );
          }
          if (record?.plateNumber) {
            return (
              <UAEPlate
                code={record?.plateCategoryValue}
                number={record?.plateNumber}
                emirateEn={record?.plateSourceValue}
                emirateAr={record?.plateCodeValue}
              />
            );
          }
          return null;
        },
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
