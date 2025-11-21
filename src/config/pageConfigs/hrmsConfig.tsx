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
  // ✅ NEW: Inspector path and fine locations
  inspectorPath?: Array<{ lat: number; lng: number; timestamp: string }>;
  fineLocations?: Array<{
    id: string;
    lat: number;
    lng: number;
    fineAmount: number;
    timestamp: string;
    plateNumber: string;
  }>;
}

// Mock Data with enhanced details including paths and fine locations
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
      lat: 25.1972,
      lng: 55.2743,
      zone: "Zone A",
    },
    email: "ahmed.hassan@example.com",
    mobile: "+971501234567",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 3,
    finesIssued: 5,
    towingRequests: 2,
    leaveRequested: 0,
    // ✅ Inspector Path (movement throughout the day)
    inspectorPath: [
      { lat: 25.1972, lng: 55.2743, timestamp: "08:00 AM" },
      { lat: 25.1985, lng: 55.2755, timestamp: "09:30 AM" },
      { lat: 25.2001, lng: 55.277, timestamp: "11:00 AM" },
      { lat: 25.202, lng: 55.28, timestamp: "12:30 PM" },
      { lat: 25.2035, lng: 55.282, timestamp: "02:00 PM" },
      { lat: 25.205, lng: 55.285, timestamp: "03:30 PM" },
      { lat: 25.2065, lng: 55.287, timestamp: "05:00 PM" },
    ],
    // ✅ Fine Locations (where fines were issued)
    fineLocations: [
      {
        id: "FINE-001",
        lat: 25.199,
        lng: 55.276,
        fineAmount: 500,
        timestamp: "09:45 AM",
        plateNumber: "ABC-1234",
      },
      {
        id: "FINE-002",
        lat: 25.2015,
        lng: 55.2785,
        fineAmount: 300,
        timestamp: "11:30 AM",
        plateNumber: "XYZ-5678",
      },
      {
        id: "FINE-003",
        lat: 25.204,
        lng: 55.2835,
        fineAmount: 400,
        timestamp: "02:45 PM",
        plateNumber: "DEF-9012",
      },
    ],
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
      lat: 25.18,
      lng: 55.26,
      zone: "Zone B",
    },
    email: "fatima.khan@example.com",
    mobile: "+971502345678",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 2,
    finesIssued: 4,
    towingRequests: 1,
    leaveRequested: 0,
    inspectorPath: [
      { lat: 25.18, lng: 55.26, timestamp: "08:15 AM" },
      { lat: 25.182, lng: 55.262, timestamp: "10:00 AM" },
      { lat: 25.185, lng: 55.265, timestamp: "12:00 PM" },
      { lat: 25.188, lng: 55.268, timestamp: "02:00 PM" },
      { lat: 25.19, lng: 55.27, timestamp: "04:00 PM" },
    ],
    fineLocations: [
      {
        id: "FINE-004",
        lat: 25.1825,
        lng: 55.2635,
        fineAmount: 600,
        timestamp: "10:30 AM",
        plateNumber: "LMN-3456",
      },
      {
        id: "FINE-005",
        lat: 25.187,
        lng: 55.267,
        fineAmount: 350,
        timestamp: "01:15 PM",
        plateNumber: "PQR-7890",
      },
    ],
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
      lat: 25.15,
      lng: 55.25,
      zone: "Zone C",
    },
    email: "omar.abdullah@example.com",
    mobile: "+971503456789",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 0,
    finesIssued: 0,
    towingRequests: 0,
    leaveRequested: 1,
    inspectorPath: [],
    fineLocations: [],
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
