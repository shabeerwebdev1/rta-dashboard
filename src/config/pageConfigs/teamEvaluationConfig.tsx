import type { PageConfig } from "../../types/config";
import { FileTextOutlined } from "@ant-design/icons";

export const evaluationTypeOptions = [
  { value: "monthly", labelEn: "Monthly", labelAr: "شهري" },
  { value: "yearly", labelEn: "Yearly", labelAr: "سنوي" },
];

// ── Page config ───────────────────────────────────────────────────────────────
export const teamEvaluationConfig: PageConfig = {
  key: "team-evaluation",
  title: "page.title.team-evaluation",
  name: { singular: "entity.evaluation", plural: "Evaluations" },

  api: {
    get: "/api/TeamEvaluation",
    post: "/api/TeamEvaluation",
    put: "/api/TeamEvaluation",
    delete: "/api/TeamEvaluation/:id",
  },

  searchConfig: {
    // GET response fields we can actually search/filter on
    globalSearchKeys: ["evaluationType"],
    columnFilterKeys: ["evaluationType", "grade"],
    // GET response uses "evaluationDate" at the top level
    dateRangeKey: "evaluationDate",
  },

  statsConfig: [
    {
      title: "stats.TotalEvaluations",
      icon: <FileTextOutlined />,
      value: (data: any[], metadata?: any) => `${data.length} / ${metadata?.totalRecords || 0}`,
    },
  ],

  tableConfig: {
    columns: [
      {
        key: "inspectorId",
        title: "form.InspectorName",
        dataIndex: "inspectorName",
        type: "string",
        sortable: true,
      },

      {
        key: "evaluationDate",
        title: "form.evaluationDate",
        dataIndex: "evaluationDate",
        type: "date",
        sortable: true,
      },
      {
        key: "evaluationType",
        title: "form.evaluationType",
        dataIndex: "evaluationType",
        type: "tag",
        filterable: true,
      },
      {
        key: "totalScore",
        title: "form.totalScore",
        dataIndex: "totalScore",
        type: "number",
        sortable: true,
      },
      {
        key: "grade",
        title: "form.grade",
        dataIndex: "grade",
        type: "badge",
        filterable: true,
      },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "800px",
    fields: [
      { name: "inspectorIds", label: "form.inspector", type: "select", required: true, span: 12 },
      { name: "supervisorId", label: "form.supervisor", type: "select", required: false, span: 12 },
      { name: "evaluationDate", label: "form.evaluationDate", type: "date", required: true, span: 12 },
      { name: "evaluationType", label: "form.evaluationType", type: "select", required: true, span: 12 },
      {
        name: "evaluationPeriod",
        label: "form.evaluationPeriod",
        type: "dateRange",
        required: true,
        span: 24,
        fieldMapping: { from: "fromDate", to: "toDate" },
      }, // ← matches API field names
      { name: "supervisorNotes", label: "form.notes", type: "textarea", required: true, span: 24 },
    ],
  },
};

export default teamEvaluationConfig;
