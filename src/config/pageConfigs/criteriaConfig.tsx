import type { PageConfig } from "../../types/config";
import { FileTextOutlined } from "@ant-design/icons";

/**
 * Static lookup values (for dropdowns)
 */
export const criteriaLookups = {
  objectiveTypes: [
    { value: "target", labelEn: "Target", labelAr: "هدف" },
    { value: "competence", labelEn: "Competence", labelAr: "كفاءة" },
  ],
};

/**
 * Criteria PageConfig (API BASED)
 */
export const criteriaConfig: PageConfig = {
  key: "criteria-weight",
  title: "page.title.criteria",
  name: { singular: "entity.criteria", plural: "entity.criteriaPlural" },

  // ✅ API updated to your backend
  api: {
    get: "/api/CriteriaWeight/GetAll",
    post: "/api/CriteriaWeight",
    put: "/api/CriteriaWeight",
  },

  searchConfig: {
    globalSearchKeys: ["descriptionEn", "descriptionAr"],
    columnFilterKeys: ["active", "objectiveType"],
  },

  statsConfig: [
    {
      title: "stats.TotalCriteria",
      icon: <FileTextOutlined />,
      value: (data: any[], metadata: any) => `${data?.length || 0} / ${metadata?.totalCount || 0}`,
    },
    {
      title: "stats.ActiveCriteria",
      icon: <FileTextOutlined />,
      value: (data: any[], metadata: any) => `${data?.filter((c) => c.active).length || 0} / ${metadata?.active || 0}`,
      color: "#52c41a",
    },
    {
      title: "stats.InactiveCriteria",
      icon: <FileTextOutlined />,
      value: (data: any[], metadata: any) =>
        `${data?.filter((c) => !c.active).length || 0} / ${metadata?.inActive || 0}`,
      color: "#ff4d4f",
    },
  ],

  tableConfig: {
    columns: [
      {
        key: "descriptionEn",
        title: "form.descriptionEn",
        dataIndex: "descriptionEn",
        type: "string",
      },
      {
        key: "descriptionAr",
        title: "form.descriptionAr",
        dataIndex: "descriptionAr",
        type: "string",
      },
      {
        key: "objectiveType",
        title: "form.objectiveType",
        dataIndex: "objectiveType",
        type: "tag",
        filterable: true,
      },
      {
        key: "weight",
        title: "form.weight",
        dataIndex: "weight",
        type: "number",
        sortable: true,
        align: "center",
      },
      {
        key: "active",
        title: "form.isActive",
        dataIndex: "active",
        type: "boolean",
        filterable: true,
        align: "center",
      },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "600px",
    fields: [
      {
        name: "descriptionEn",
        label: "form.descriptionEn",
        type: "input",
        required: true,
        span: 24,
      },
      {
        name: "descriptionAr",
        label: "form.descriptionAr",
        type: "input",
        required: true,
        span: 24,
      },
      {
        name: "weight",
        label: "form.weight",
        type: "number",
        required: true,
        span: 12,
        props: { min: 0, max: 100 },
      },
      {
        name: "objectiveType",
        label: "form.objectiveType",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "active",
        label: "form.isActive",
        type: "switch",
        required: false,
        align: "center",
        span: 12,
      },
    ],
  },

  // attach lookups
  lookups: criteriaLookups,
};

export default criteriaConfig;
