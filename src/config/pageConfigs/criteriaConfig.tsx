import type { PageConfig } from "../../types/config";
import { FileTextOutlined } from "@ant-design/icons";

//
// criteriaConfig.tsx
// PageConfig for Criteria CRUD (static data only, NO DELETE)
// Matches the format you requested (icons in TSX, PageConfig shape)
//

/**
 * Static lookup values for criteria form
 */
export const staticCriteriaLookups = {
  objectiveTypes: [
    { value: "target", labelEn: "Target", labelAr: "هدف" },
    { value: "competence", labelEn: "Competence", labelAr: "كفاءة" },
  ],
  ratingScales: [
    { value: "1-5", labelEn: "1-5 Scale", labelAr: "مقياس 1-5" },
    { value: "1-10", labelEn: "1-10 Scale", labelAr: "مقياس 1-10" },
    { value: "poor-excellent", labelEn: "Poor - Excellent", labelAr: "ضعيف - ممتاز" },
  ],
};

/**
 * Static criteria seed data (NO DELETE support)
 * Users can search, add and update these records via CriteriaPage
 */
export const staticCriteriaData = [
  {
    id: 1,
    descriptionEn: "Attendance",
    descriptionAr: "الحضور",
    weight: 20,
    objectiveType: "target",
    ratingScale: "1-5",
    isActive: true,
  },
  {
    id: 2,
    descriptionEn: "Punctuality",
    descriptionAr: "الالتزام بالمواعيد",
    weight: 15,
    objectiveType: "target",
    ratingScale: "1-5",
    isActive: true,
  },
  {
    id: 3,
    descriptionEn: "Shift Completion",
    descriptionAr: "إتمام المناوبة",
    weight: 25,
    objectiveType: "target",
    ratingScale: "1-5",
    isActive: true,
  },
  {
    id: 4,
    descriptionEn: "Inspection Accuracy",
    descriptionAr: "دقة التفتيش",
    weight: 30,
    objectiveType: "competence",
    ratingScale: "1-5",
    isActive: true,
  },
  {
    id: 5,
    descriptionEn: "Compliance with Procedures",
    descriptionAr: "الالتزام بالإجراءات",
    weight: 10,
    objectiveType: "competence",
    ratingScale: "1-5",
    isActive: true,
  },
];

/**
 * Criteria PageConfig
 *
 * - Uses JSX icon (hence .tsx)
 * - Provides searchConfig, statsConfig, tableConfig and formConfig
 * - No delete operation (per your choice)
 */
export const criteriaConfig: PageConfig = {
  key: "criteria",
  title: "page.title.criteria",
  name: { singular: "entity.criteria", plural: "entity.criteriaPlural" },

  api: {
    get: "/api/Criteria", // static data used in page; api kept for parity (no delete)
    post: "/api/Criteria",
    put: "/api/Criteria",
    // delete intentionally omitted because Criteria cannot be deleted in your requirement
  },

  searchConfig: {
    globalSearchKeys: ["descriptionEn", "descriptionAr"],
    columnFilterKeys: ["objectiveType", "isActive"],
  },

  statsConfig: [
    {
      title: "stats.TotalCriteria",
      icon: <FileTextOutlined />,
      value: (data: any[]) => `${data.length}`,
    },
    {
      title: "stats.ActiveCriteria",
      icon: <FileTextOutlined />,
      value: (data: any[]) => data.filter((c) => c.isActive).length,
      color: "#52c41a",
    },
  ],

  tableConfig: {
    columns: [
      {
        key: "descriptionEn",
        title: "form.descriptionEn",
        dataIndex: "descriptionEn",
        type: "string",
        sortable: true,
        filterable: true,
      },
      {
        key: "descriptionAr",
        title: "form.descriptionAr",
        dataIndex: "descriptionAr",
        type: "string",
        sortable: true,
        filterable: true,
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
      },
      {
        key: "ratingScale",
        title: "form.ratingScale",
        dataIndex: "ratingScale",
        type: "string",
      },
      {
        key: "isActive",
        title: "form.isActive",
        dataIndex: "isActive",
        type: "boolean",
        filterable: true,
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
        name: "ratingScale",
        label: "form.ratingScale",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "isActive",
        label: "form.isActive",
        type: "switch",
        required: false,
        span: 12,
      },
    ],
  },

  // attach lookups so pages can reference them
  lookups: staticCriteriaLookups,
};

export default criteriaConfig;
