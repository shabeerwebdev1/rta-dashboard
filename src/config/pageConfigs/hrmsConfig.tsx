import type { PageConfig } from "../../types/config";
import { SearchOutlined } from "@ant-design/icons";

// Define the Data Shape
export interface InspectorAttendanceDTO {
  id: string;
  inspectorId: number;
  inspectorName: string;
  inspectorNameAr: string;
  supervisorName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  status: "Present" | "Absent" | "Leave";
  location: {
    lat: number;
    lng: number;
    zone: string;
  };
  // Additional details for drawer
  email?: string;
  mobile?: string;
  shift?: string;
  obstacles?: number;
  finesIssued?: number;
  towingRequests?: number;
  leaveRequested?: number;
}

// Mock Data with enhanced details
export const MOCK_INSPECTORS_DATA: InspectorAttendanceDTO[] = [
  {
    id: "ATT-2025-001",
    inspectorId: 101,
    inspectorName: "Ahmed Hassan",
    inspectorNameAr: "أحمد حسن",
    supervisorName: "Mohammed Ali",
    date: "2025-11-20",
    checkInTime: "08:00 AM",
    checkOutTime: "05:00 PM",
    status: "Present",
    location: {
      lat: 12.9716,
      lng: 77.5946,
      zone: "Zone A",
    },
    email: "ahmed.hassan@example.com",
    mobile: "+971501234567",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 3,
    finesIssued: 5,
    towingRequests: 2,
    leaveRequested: 0,
  },
  {
    id: "ATT-2025-002",
    inspectorId: 102,
    inspectorName: "Fatima Khan",
    inspectorNameAr: "فاطمة خان",
    supervisorName: "Sara Ahmed",
    date: "2025-11-20",
    checkInTime: "08:15 AM",
    checkOutTime: "05:15 PM",
    status: "Present",
    location: {
      lat: 12.98,
      lng: 77.6,
      zone: "Zone B",
    },
    email: "fatima.khan@example.com",
    mobile: "+971502345678",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 2,
    finesIssued: 4,
    towingRequests: 1,
    leaveRequested: 0,
  },
  {
    id: "ATT-2025-003",
    inspectorId: 103,
    inspectorName: "Omar Abdullah",
    inspectorNameAr: "عمر عبدالله",
    supervisorName: "Mohammed Ali",
    date: "2025-11-20",
    checkInTime: "09:00 AM",
    checkOutTime: "",
    status: "Absent",
    location: {
      lat: 12.95,
      lng: 77.58,
      zone: "Zone C",
    },
    email: "omar.abdullah@example.com",
    mobile: "+971503456789",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 0,
    finesIssued: 0,
    towingRequests: 0,
    leaveRequested: 1,
  },
  {
    id: "ATT-2025-004",
    inspectorId: 104,
    inspectorName: "Layla Ibrahim",
    inspectorNameAr: "ليلى إبراهيم",
    supervisorName: "Sara Ahmed",
    date: "2025-11-19",
    checkInTime: "08:00 AM",
    checkOutTime: "12:00 PM",
    status: "Leave",
    location: {
      lat: 12.965,
      lng: 77.592,
      zone: "Zone A",
    },
    email: "layla.ibrahim@example.com",
    mobile: "+971504567890",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 0,
    finesIssued: 0,
    towingRequests: 0,
    leaveRequested: 1,
  },
  {
    id: "ATT-2025-005",
    inspectorId: 105,
    inspectorName: "Yusuf Rahman",
    inspectorNameAr: "يوسف رحمن",
    supervisorName: "Mohammed Ali",
    date: "2025-11-19",
    checkInTime: "08:30 AM",
    checkOutTime: "05:30 PM",
    status: "Present",
    location: {
      lat: 12.975,
      lng: 77.605,
      zone: "Zone B",
    },
    email: "yusuf.rahman@example.com",
    mobile: "+971505678901",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 4,
    finesIssued: 6,
    towingRequests: 3,
    leaveRequested: 0,
  },
  {
    id: "ATT-2025-006",
    inspectorId: 106,
    inspectorName: "Aisha Mohammed",
    inspectorNameAr: "عائشة محمد",
    supervisorName: "Sara Ahmed",
    date: "2025-11-18",
    checkInTime: "08:00 AM",
    checkOutTime: "05:00 PM",
    status: "Present",
    location: {
      lat: 12.96,
      lng: 77.585,
      zone: "Zone C",
    },
    email: "aisha.mohammed@example.com",
    mobile: "+971506789012",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 1,
    finesIssued: 3,
    towingRequests: 0,
    leaveRequested: 0,
  },
];

// Configuration
export const hrmsConfig: PageConfig = {
  key: "hrms",
  title: "page.title.hrms",
  name: { singular: "entity.hrms", plural: "HRMS Records" },

  api: {
    get: "/api/hrms/attendance",
    post: "/api/hrms/attendance",
    postContentType: "application/json",
    put: "/api/hrms/attendance/{id}",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["inspectorName", "supervisorName"],
    columnFilterKeys: ["status", "supervisorName"],
    dateRangeKey: "date",
  },

  statsConfig: [
    {
      title: "stats.TotalAttendance",
      icon: <SearchOutlined />,
      value: (data, metadata) => `${data.length} / ${metadata?.totalRecords || 0}`,
    },
  ],

  tableConfig: {
    columns: [
      { key: "date", title: "form.date", type: "date", sortable: true },
      { key: "inspectorName", title: "form.inspectorName", type: "string", sortable: true },
      { key: "supervisorName", title: "form.supervisorName", type: "string", filterable: true },
      { key: "checkInTime", title: "form.checkInTime", type: "string" },
      { key: "checkOutTime", title: "form.checkOutTime", type: "string" },
      { key: "status", title: "form.status", type: "string", filterable: true },
    ],
    viewRecord: true,
    showEdit: false,
  },

  formConfig: {
    modalWidth: "720px",
    fields: [
      {
        name: "InspectorName",
        label: "form.inspectorName",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "SupervisorName",
        label: "form.supervisorName",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "Date",
        label: "form.date",
        type: "date",
        required: true,
        span: 12,
      },
      {
        name: "CheckInTime",
        label: "form.checkInTime",
        type: "text",
        required: true,
        span: 12,
      },
      {
        name: "CheckOutTime",
        label: "form.checkOutTime",
        type: "text",
        required: false,
        span: 12,
      },
      {
        name: "Status",
        label: "form.status",
        type: "select",
        required: true,
        span: 12,
        options: ["Present", "Absent", "Leave"],
      },
    ],
  },
};
