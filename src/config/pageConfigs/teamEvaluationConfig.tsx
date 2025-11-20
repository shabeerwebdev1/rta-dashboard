//
// teamEvaluationConfig.tsx (FIXED VERSION)
// Matches your required format + includes required fields + uses TSX icons
// No delete for criteria, but team evaluations may still support delete (optional)
// Fully aligns with your TeamEvaluationPage UI
//

import type { PageConfig } from "../../types/config";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

//
// 🔹 STATIC EVALUATION CRITERIA
// Criteria include: English/Arabic description, Weight, Objective Type, Rating Scale, Active Flag
//
export const staticEvaluationCriteria = [
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

//
// 🔹 STATIC LOOKUPS
// Used in dropdowns for evaluation forms
//
export const staticLookupData = {
  evaluationTypes: [
    { value: "daily", labelEn: "Daily", labelAr: "يومي" },
    { value: "weekly", labelEn: "Weekly", labelAr: "أسبوعي" },
    { value: "monthly", labelEn: "Monthly", labelAr: "شهري" },
    { value: "yearly", labelEn: "Yearly", labelAr: "سنوي" },
  ],

  grades: [
    { value: "excellent", labelEn: "Excellent", labelAr: "ممتاز", minScore: 90, maxScore: 100 },
    { value: "very-good", labelEn: "Very Good", labelAr: "جيد جداً", minScore: 80, maxScore: 89 },
    { value: "good", labelEn: "Good", labelAr: "جيد", minScore: 70, maxScore: 79 },
    { value: "satisfactory", labelEn: "Satisfactory", labelAr: "مقبول", minScore: 60, maxScore: 69 },
    { value: "needs-improvement", labelEn: "Needs Improvement", labelAr: "يحتاج تحسين", minScore: 0, maxScore: 59 },
  ],

  statuses: [
    { value: "pending", labelEn: "Pending", labelAr: "قيد الانتظار" },
    { value: "completed", labelEn: "Completed", labelAr: "مكتمل" },
    { value: "approved", labelEn: "Approved", labelAr: "معتمد" },
    { value: "rejected", labelEn: "Rejected", labelAr: "مرفوض" },
  ],

  zones: [
    { value: "downtown", labelEn: "Downtown", labelAr: "وسط المدينة" },
    { value: "business-bay", labelEn: "Business Bay", labelAr: "الخليج التجاري" },
    { value: "jumeirah", labelEn: "Jumeirah", labelAr: "جميرا" },
    { value: "deira", labelEn: "Deira", labelAr: "ديرة" },
    { value: "bur-dubai", labelEn: "Bur Dubai", labelAr: "بر دبي" },
  ],

  inspectors: [
    { value: 101, labelEn: "Ahmed Mohammed", labelAr: "أحمد محمد" },
    { value: 102, labelEn: "Fatima Al Rashid", labelAr: "فاطمة الرشيد" },
    { value: 103, labelEn: "Khalid Hassan", labelAr: "خالد حسن" },
    { value: 104, labelEn: "Mariam Al Qasimi", labelAr: "مريم القاسمي" },
    { value: 105, labelEn: "Omar Abdullah", labelAr: "عمر عبدالله" },
    { value: 106, labelEn: "Sarah Al Mazrouei", labelAr: "سارة المزروعي" },
    { value: 107, labelEn: "Rashid Al Nuaimi", labelAr: "راشد النعيمي" },
  ],

  supervisors: [
    { value: 201, labelEn: "Yousef Al Mansoori", labelAr: "يوسف المنصوري" },
    { value: 202, labelEn: "Layla Al Shamsi", labelAr: "ليلى الشامسي" },
    { value: 203, labelEn: "Mohammed Al Zaabi", labelAr: "محمد الزعابي" },
  ],
};

//
// 🔹 STATIC TEAM EVALUATIONS
// Contains: Supervisor, Inspectors (one or many), Criteria Scores, Grades, Weighted Score
//
export const staticEvaluationsData = [
  {
    id: 1,
    inspectorName: "Ahmed Mohammed",
    inspectorId: 101,
    evaluationDate: "2024-01-15",
    evaluationType: "monthly",
    totalScore: 88.5,
    grade: "very-good",
    evaluatorName: "Yousef Al Mansoori",
    supervisorName: "Yousef Al Mansoori",
    supervisorId: 201,
    zone: "downtown",
    status: "approved",
    periodFrom: "2024-01-01",
    periodTo: "2024-01-31",
    criteriaScores: [
      { criteriaId: 1, score: 4, comments: "Excellent attendance" },
      { criteriaId: 2, score: 5, comments: "Always punctual" },
      { criteriaId: 3, score: 3, comments: "Good performance" },
      { criteriaId: 4, score: 4, comments: "Very accurate inspections" },
    ],
    supervisorNotes:
      "Ahmed has shown significant improvement this month. His inspection accuracy has increased by 15%.",
    createdAt: "2024-01-15T10:30:00Z",
  },

  {
    id: 2,
    inspectorName: "Fatima Al Rashid",
    inspectorId: 102,
    evaluationDate: "2024-01-14",
    evaluationType: "monthly",
    totalScore: 92.0,
    grade: "excellent",
    evaluatorName: "Yousef Al Mansoori",
    supervisorName: "Yousef Al Mansoori",
    supervisorId: 201,
    zone: "business-bay",
    status: "approved",
    periodFrom: "2024-01-01",
    periodTo: "2024-01-31",
    criteriaScores: [
      { criteriaId: 1, score: 5, comments: "Perfect attendance" },
      { criteriaId: 2, score: 5, comments: "Always on time" },
      { criteriaId: 3, score: 4, comments: "Outstanding performance" },
      { criteriaId: 4, score: 5, comments: "Extremely accurate inspections" },
    ],
    supervisorNotes: "Fatima continues to exceed expectations. She has the highest inspection accuracy in the team.",
    createdAt: "2024-01-14T14:20:00Z",
  },

  {
    id: 3,
    inspectorName: "Khalid Hassan",
    inspectorId: 103,
    evaluationDate: "2024-01-16",
    evaluationType: "weekly",
    totalScore: 76.5,
    grade: "satisfactory",
    evaluatorName: "Yousef Al Mansoori",
    supervisorName: "Yousef Al Mansoori",
    supervisorId: 201,
    zone: "jumeirah",
    status: "completed",
    periodFrom: "2024-01-08",
    periodTo: "2024-01-14",
    criteriaScores: [
      { criteriaId: 1, score: 3, comments: "One day absence" },
      { criteriaId: 2, score: 4, comments: "Good punctuality" },
      { criteriaId: 3, score: 2, comments: "Needs improvement" },
      { criteriaId: 4, score: 3, comments: "Average accuracy" },
    ],
    supervisorNotes: "Khalid needs to focus on completing inspections on time.",
    createdAt: "2024-01-16T09:15:00Z",
  },
];

//
// 🔹 TEAM EVALUATION CONFIG (FINAL)
// Follows the exact structure you provided
//
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
    globalSearchKeys: ["inspectorName", "evaluatorName"],
    columnFilterKeys: ["evaluationType", "status", "zone", "supervisorName"],
    dateRangeKey: "evaluationDate",
  },

  statsConfig: [
    {
      title: "stats.TotalEvaluations",
      icon: <FileTextOutlined />,
      value: (data: any[], metadata?: any) =>
        `${data.length} / ${metadata?.totalRecords || 0}`,
    },
    {
      title: "stats.CompletedEvaluations",
      icon: <CheckCircleOutlined />,
      value: (data: any[], metadata?: any) =>
        `${data.filter((d) => d.status === "completed").length} / ${
          metadata?.completedRecords || 0
        }`,
      color: "#52c41a",
    },
    {
      title: "stats.PendingEvaluations",
      icon: <ClockCircleOutlined />,
      value: (data: any[], metadata?: any) =>
        `${data.filter((d) => d.status === "pending").length} / ${
          metadata?.pendingRecords || 0
        }`,
      color: "#faad14",
    },
    {
      title: "stats.ApprovedEvaluations",
      icon: <CheckCircleOutlined />,
      value: (data: any[], metadata?: any) =>
        `${data.filter((d) => d.status === "approved").length} / ${
          metadata?.approvedRecords || 0
        }`,
      color: "#1890ff",
    },
  ],

  tableConfig: {
    columns: [
      {
        key: "inspectorName",
        title: "form.inspectorName",
        dataIndex: "inspectorName",
        type: "string",
        sortable: true,
        filterable: true,
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
      {
        key: "evaluatorName",
        title: "form.evaluatorName",
        dataIndex: "evaluatorName",
        type: "string",
      },
      {
        key: "zone",
        title: "form.zone",
        dataIndex: "zone",
        type: "string",
        filterable: true,
      },
      {
        key: "status",
        title: "form.status",
        dataIndex: "status",
        type: "tag",
        filterable: true,
      },
    ],
    viewRecord: true,
  },

  formConfig: {
    modalWidth: "800px",
    fields: [
      {
        name: "inspectorIds",
        label: "form.inspector",
        type: "select",
        required: true,
        span: 12,
        mode: "multiple",
      },
      {
        name: "supervisorId",
        label: "form.supervisor",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "evaluationDate",
        label: "form.evaluationDate",
        type: "date",
        required: true,
        span: 12,
      },
      {
        name: "evaluationType",
        label: "form.evaluationType",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "evaluationPeriod",
        label: "form.evaluationPeriod",
        type: "dateRange",
        required: true,
        span: 24,
        fieldMapping: { from: "periodFrom", to: "periodTo" },
      },
      {
        name: "zone",
        label: "form.zone",
        type: "select",
        required: true,
        span: 12,
      },
      {
        name: "supervisorNotes",
        label: "form.supervisorNotes",
        type: "textarea",
        required: false,
        span: 24,
      },
    ],
  },
};

export default teamEvaluationConfig;
