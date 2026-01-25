import type { PageConfig } from "../../types/config";
import { CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from "@ant-design/icons";

export const inspectionObstacleConfig: PageConfig = {
  key: "inspection-obstacles",
  title: "page.title.inspection-obstacles",
  name: { singular: "entity.inspectionObstacle", plural: "Inspection Obstacles" },
  api: {
    get: "/api/InspectionObstacle",
    post: "/api/InspectionObstacle",
    postContentType: "multipart/form-data",
    put: "/api/InspectionObstacle/markremoved/{obstacleCode}",
    delete: "",
  },
  searchConfig: {
    globalSearchKeys: [],
    columnFilterKeys: ["sourceOfObstacle", "status"],
    dateRangeKey: "createdDateTime",
  },
  statsConfig: [
    {
      title: "stats.TotalObstacles",
      icon: <SearchOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata?.totalRecords || 0}`,
    },
    {
      title: "stats.activeObstacles",
      icon: <CheckCircleOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata?.totalRecords || 0}`,
      color: "#52c41a",
    },
    {
      title: "stats.resolvedObstacles",
      icon: <CloseCircleOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata?.totalRecords || 0}`,
      color: "#faad14",
    },
  ],

  tableConfig: {
    columns: [
      { key: "zone", title: "form.zone", type: "string", sortable: true },
      { key: "area", title: "form.area", type: "string", sortable: true },
      { key: "sourceOfObstacle", title: "form.sourceOfObstacle", type: "string", filterable: true },
      { key: "createdDateTime", title: "form.createdDate", type: "date" },
      { key: "closestPaymentDevice", title: "form.closestPD", type: "string" },
    ],
    viewRecord: true,
    showEdit: false,
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "ObstacleNumber",
        label: "form.obstacleNumber",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "Zone",
        label: "form.zone",
        type: "select",
        required: true,
        span: 12,
        options: ["North", "South", "East", "West"],
      },
      {
        name: "Area",
        label: "form.area",
        type: "select",
        required: true,
        span: 12,
        options: ["Residential", "Commercial", "Industrial"],
      },
      {
        name: "SourceOfObstacle",
        label: "form.sourceOfObstacle",
        type: "select",
        required: true,
        span: 12,
        options: ["Construction", "Parked Vehicle", "Natural Obstacle", "Road Work"],
      },
      {
        name: "ClosestPaymentDevice",
        label: "form.closestPaymentDevice",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "ReportedBy",
        label: "form.reportedBy",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "Photo",
        label: "form.photo",
        type: "file",
        required: true,
        span: 24,
        fileCategory: "Obstacles",
        responseKey: "photoPath",
      },
      {
        name: "Comments",
        label: "form.comments",
        type: "textarea",
        required: false,
        span: 24,
      },
    ],
  },
};
