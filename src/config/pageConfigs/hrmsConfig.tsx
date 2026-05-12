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
  inspectionSummary?: {
    fine: number;
    warning: number;
    routine: number;
  };
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

  warningLocations?: Array<{
    id: string;
    lat: number;
    lng: number;
    timestamp: string;
  }>;

  routineLocations?: Array<{
    id: string;
    lat: number;
    lng: number;
    timestamp: string;
  }>;

  towingLocations?: Array<{
    id: string;
    lat: number;
    lng: number;
    timestamp: string;
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
      // 29 Boulevard area – Downtown, directly on Mohammed Bin Rashid Blvd side
      lat: 25.192211,
      lng: 55.272594,
      zone: "Zone A",
    },
    email: "ahmed.hassan@example.com",
    mobile: "+971501234567",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 3,
    finesIssued: 5,
    towingRequests: 2,
    leaveRequested: 0,
    inspectionSummary: {
      fine: 3,
      warning: 1,
      routine: 1,
    },
    // Path follows Sheikh Mohammed bin Rashid Boulevard loop around Burj/Dubai Mall
    inspectorPath: [
      // 29 Boulevard (southwest part of the loop)
      { lat: 25.192211, lng: 55.272594, timestamp: "08:00 AM" },
      // Boulevard Central Towers – on the same boulevard
      { lat: 25.191707, lng: 55.273487, timestamp: "09:30 AM" },
      // Address Residences – frontage on the boulevard
      { lat: 25.197197, lng: 55.272188, timestamp: "11:00 AM" },
      // Burj Khalifa frontage on the boulevard
      { lat: 25.197139, lng: 55.274111, timestamp: "12:30 PM" },
      // Mohammed bin Rashid Boulevard further towards Dubai Mall
      { lat: 25.2012013, lng: 55.2778617, timestamp: "02:00 PM" },
      // Dubai Mall car-park access side on the road
      { lat: 25.1987, lng: 55.28, timestamp: "03:30 PM" },
      // Back near 1 Sheikh Mohammed bin Rashid Blvd
      { lat: 25.1970306, lng: 55.2742217, timestamp: "05:00 PM" },
    ],
    // Ahmed Hassan (101) — all markers snapped to his actual path

    fineLocations: [
      { id: "FINE-1", lat: 25.19221, lng: 55.27259, fineAmount: 500, timestamp: "08:15 AM", plateNumber: "DXB-1000" },
      { id: "FINE-2", lat: 25.19195, lng: 55.2731, fineAmount: 500, timestamp: "08:40 AM", plateNumber: "DXB-1001" },
      { id: "FINE-3", lat: 25.1918, lng: 55.2737, fineAmount: 500, timestamp: "09:00 AM", plateNumber: "DXB-1002" },
      { id: "FINE-4", lat: 25.192, lng: 55.2734, fineAmount: 500, timestamp: "09:20 AM", plateNumber: "DXB-1003" },
      { id: "FINE-5", lat: 25.194, lng: 55.2723, fineAmount: 500, timestamp: "09:50 AM", plateNumber: "DXB-1004" },
      { id: "FINE-6", lat: 25.196, lng: 55.2722, fineAmount: 500, timestamp: "10:10 AM", plateNumber: "DXB-1005" },
      { id: "FINE-7", lat: 25.1972, lng: 55.2722, fineAmount: 500, timestamp: "10:30 AM", plateNumber: "DXB-1006" },
      { id: "FINE-8", lat: 25.19714, lng: 55.2738, fineAmount: 500, timestamp: "10:50 AM", plateNumber: "DXB-1007" },
      { id: "FINE-9", lat: 25.1973, lng: 55.2743, fineAmount: 500, timestamp: "11:10 AM", plateNumber: "DXB-1008" },
      { id: "FINE-10", lat: 25.198, lng: 55.275, fineAmount: 500, timestamp: "11:30 AM", plateNumber: "DXB-1009" },
      { id: "FINE-11", lat: 25.199, lng: 55.276, fineAmount: 500, timestamp: "11:50 AM", plateNumber: "DXB-1010" },
      { id: "FINE-12", lat: 25.2002, lng: 55.277, fineAmount: 500, timestamp: "12:10 PM", plateNumber: "DXB-1011" },
      { id: "FINE-13", lat: 25.2012, lng: 55.2779, fineAmount: 500, timestamp: "12:30 PM", plateNumber: "DXB-1012" },
      { id: "FINE-14", lat: 25.2005, lng: 55.2785, fineAmount: 500, timestamp: "01:00 PM", plateNumber: "DXB-1013" },
      { id: "FINE-15", lat: 25.1995, lng: 55.2792, fineAmount: 500, timestamp: "01:30 PM", plateNumber: "DXB-1014" },
      { id: "FINE-16", lat: 25.1987, lng: 55.2798, fineAmount: 500, timestamp: "02:00 PM", plateNumber: "DXB-1015" },
      { id: "FINE-17", lat: 25.1982, lng: 55.2795, fineAmount: 500, timestamp: "02:30 PM", plateNumber: "DXB-1016" },
      { id: "FINE-18", lat: 25.1976, lng: 55.2788, fineAmount: 500, timestamp: "03:00 PM", plateNumber: "DXB-1017" },
      { id: "FINE-19", lat: 25.1972, lng: 55.278, fineAmount: 500, timestamp: "03:15 PM", plateNumber: "DXB-1018" },
      { id: "FINE-20", lat: 25.19703, lng: 55.27422, fineAmount: 500, timestamp: "04:45 PM", plateNumber: "DXB-1019" },
    ],

    warningLocations: [
      { id: "WARN-1", lat: 25.1921, lng: 55.2727, timestamp: "08:30 AM" },
      { id: "WARN-2", lat: 25.19175, lng: 55.27355, timestamp: "09:10 AM" },
      { id: "WARN-3", lat: 25.195, lng: 55.27225, timestamp: "09:45 AM" },
      { id: "WARN-4", lat: 25.19715, lng: 55.2721, timestamp: "10:20 AM" },
      { id: "WARN-5", lat: 25.19716, lng: 55.27415, timestamp: "10:55 AM" },
      { id: "WARN-6", lat: 25.1985, lng: 55.2752, timestamp: "11:20 AM" },
      { id: "WARN-7", lat: 25.2, lng: 55.2768, timestamp: "11:50 AM" },
      { id: "WARN-8", lat: 25.201, lng: 55.2778, timestamp: "12:20 PM" },
      { id: "WARN-9", lat: 25.2, lng: 55.2787, timestamp: "01:10 PM" },
      { id: "WARN-10", lat: 25.1988, lng: 55.2796, timestamp: "02:10 PM" },
      { id: "WARN-11", lat: 25.1974, lng: 55.2786, timestamp: "03:10 PM" },
      { id: "WARN-12", lat: 25.19705, lng: 55.2743, timestamp: "04:30 PM" },
    ],

    routineLocations: [
      { id: "ROUTINE-1", lat: 25.19222, lng: 55.2726, timestamp: "08:05 AM" },
      { id: "ROUTINE-2", lat: 25.1919, lng: 55.2732, timestamp: "08:50 AM" },
      { id: "ROUTINE-3", lat: 25.19172, lng: 55.27348, timestamp: "09:15 AM" },
      { id: "ROUTINE-4", lat: 25.1935, lng: 55.2723, timestamp: "09:35 AM" },
      { id: "ROUTINE-5", lat: 25.1972, lng: 55.27218, timestamp: "10:05 AM" },
      { id: "ROUTINE-6", lat: 25.19714, lng: 55.2739, timestamp: "10:40 AM" },
      { id: "ROUTINE-7", lat: 25.1975, lng: 55.2745, timestamp: "11:05 AM" },
      { id: "ROUTINE-8", lat: 25.1986, lng: 55.2755, timestamp: "11:25 AM" },
      { id: "ROUTINE-9", lat: 25.1998, lng: 55.2766, timestamp: "11:45 AM" },
      { id: "ROUTINE-10", lat: 25.201, lng: 55.2776, timestamp: "12:05 PM" },
      { id: "ROUTINE-11", lat: 25.2002, lng: 55.2784, timestamp: "01:20 PM" },
      { id: "ROUTINE-12", lat: 25.1992, lng: 55.279, timestamp: "02:00 PM" },
      { id: "ROUTINE-13", lat: 25.1984, lng: 55.2797, timestamp: "02:45 PM" },
      { id: "ROUTINE-14", lat: 25.1975, lng: 55.2783, timestamp: "03:20 PM" },
      { id: "ROUTINE-15", lat: 25.19703, lng: 55.2744, timestamp: "04:40 PM" },
    ],

    towingLocations: [
      { id: "TOW-1", lat: 25.19195, lng: 55.27348, timestamp: "09:30 AM" },
      { id: "TOW-2", lat: 25.19714, lng: 55.27411, timestamp: "12:30 PM" },
      { id: "TOW-3", lat: 25.2012, lng: 55.27786, timestamp: "02:00 PM" },
      { id: "TOW-4", lat: 25.1987, lng: 55.28, timestamp: "03:30 PM" },
      { id: "TOW-5", lat: 25.19703, lng: 55.27422, timestamp: "05:00 PM" },
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
      // Dusit Thani on Sheikh Zayed Road corridor
      lat: 25.20611,
      lng: 55.27278,
      zone: "Zone B",
    },
    email: "fatima.khan@example.com",
    mobile: "+971502345678",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 2,
    finesIssued: 4,
    towingRequests: 1,
    leaveRequested: 0,
    inspectionSummary: {
      fine: 3,
      warning: 1,
      routine: 0,
    },
    // Path runs along Sheikh Zayed Road (SZR) hotel strip
    inspectorPath: [
      // Safa Park / SZR stretch (south-west)
      { lat: 25.2048, lng: 55.2708, timestamp: "08:15 AM" },
      // Dusit Thani Dubai – directly on SZR
      { lat: 25.20611, lng: 55.27278, timestamp: "10:00 AM" },
      // Financial Centre Metro Station – SZR viaduct
      { lat: 25.211142, lng: 55.275616, timestamp: "12:00 PM" },
      // Jumeirah Emirates Towers – SZR side
      { lat: 25.217636, lng: 55.282818, timestamp: "02:00 PM" },
      // Blue Tower / HHHR Tower on SZR
      { lat: 25.2212194, lng: 55.2807389, timestamp: "03:30 PM" },
      // Fairmont Dubai further along SZR
      { lat: 25.22621, lng: 55.284489, timestamp: "05:15 PM" },
    ],
    fineLocations: [
      {
        id: "FINE-004",
        // Near Dusit Thani service road
        lat: 25.2065,
        lng: 55.2731,
        fineAmount: 600,
        timestamp: "10:30 AM",
        plateNumber: "LMN-3456",
      },
      {
        id: "FINE-005",
        // Service road near Financial Centre / Emirates Towers
        lat: 25.214,
        lng: 55.2785,
        fineAmount: 350,
        timestamp: "01:15 PM",
        plateNumber: "PQR-7890",
      },
      {
        id: "FINE-006",
        // Slip road near Fairmont Dubai
        lat: 25.2259,
        lng: 55.2839,
        fineAmount: 450,
        timestamp: "04:15 PM",
        plateNumber: "GHI-2234",
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
      // Just a placeholder zone point
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
    inspectionSummary: {
      fine: 0,
      warning: 0,
      routine: 0,
    },
    inspectorPath: [],
    fineLocations: [],
  },
  {
    id: "ATT-2025-004",
    inspectorId: 104,
    inspectorName: "Hassan Ali",
    inspectorNameAr: "حسن علي",
    supervisorName: "Sara Ahmed",
    date: "2025-11-20",
    checkInTime: "08:05 AM",
    checkOutTime: "04:45 PM",
    status: "Present",
    location: {
      // Jumeirah Street – coastal main road
      lat: 25.222784,
      lng: 55.255984,
      zone: "Zone C",
    },
    email: "hassan.ali@example.com",
    mobile: "+971504567890",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 4,
    finesIssued: 6,
    towingRequests: 1,
    leaveRequested: 0,
    inspectionSummary: {
      fine: 3,
      warning: 1,
      routine: 2,
    },
    // Path along Jumeirah Street / beach road
    inspectorPath: [
      // Jumeirah Beach section
      { lat: 25.2219, lng: 55.2559, timestamp: "08:05 AM" },
      // 130 Jumeirah Street
      { lat: 25.222784, lng: 55.255984, timestamp: "09:30 AM" },
      // Mid-block along Jumeirah St (interpolated)
      { lat: 25.226, lng: 55.261, timestamp: "11:00 AM" },
      // 25 Street, Jumeirah (intersection point)
      { lat: 25.229665, lng: 55.266484, timestamp: "01:00 PM" },
      // Slightly further inland but still on arterial road
      { lat: 25.233, lng: 55.27, timestamp: "03:00 PM" },
      // Returning towards original section
      { lat: 25.2235, lng: 55.2575, timestamp: "04:45 PM" },
    ],
    fineLocations: [
      {
        id: "FINE-007",
        lat: 25.2231,
        lng: 55.2564,
        fineAmount: 300,
        timestamp: "09:50 AM",
        plateNumber: "JKL-7788",
      },
      {
        id: "FINE-008",
        lat: 25.2272,
        lng: 55.2622,
        fineAmount: 200,
        timestamp: "11:25 AM",
        plateNumber: "MNO-9922",
      },
      {
        id: "FINE-009",
        lat: 25.2302,
        lng: 55.2671,
        fineAmount: 550,
        timestamp: "02:10 PM",
        plateNumber: "RST-4411",
      },
    ],
  },
  {
    id: "ATT-2025-005",
    inspectorId: 105,
    inspectorName: "Salim Noor",
    inspectorNameAr: "سليم نور",
    supervisorName: "Mohammed Ali",
    date: "2025-11-20",
    checkInTime: "08:30 AM",
    checkOutTime: "05:10 PM",
    status: "Present",
    location: {
      // Al Rigga Street – Deira
      lat: 25.264136,
      lng: 55.322118,
      zone: "Zone D",
    },
    email: "salim.noor@example.com",
    mobile: "+971505678901",
    shift: "Morning Shift (8:00 AM - 4:00 PM)",
    obstacles: 1,
    finesIssued: 3,
    towingRequests: 0,
    leaveRequested: 0,
    inspectionSummary: {
      fine: 3,
      warning: 0,
      routine: 0,
    },
    // Path along Deira main roads: City Centre Deira -> Deira core -> Al Rigga -> Corniche
    inspectorPath: [
      // City Centre Deira access roads
      { lat: 25.2698368, lng: 55.2992563, timestamp: "08:30 AM" },
      // Deira central district roads
      { lat: 25.266666, lng: 55.316666, timestamp: "10:00 AM" },
      // Al Rigga Street
      { lat: 25.264136, lng: 55.322118, timestamp: "12:00 PM" },
      // Al Rigga Road continuation
      { lat: 25.2614072, lng: 55.3249034, timestamp: "02:30 PM" },
      // Baniyas Road near Corniche Deira
      { lat: 25.279471, lng: 55.303825, timestamp: "04:00 PM" },
      // Corniche Deira waterfront road
      { lat: 25.287836, lng: 55.319207, timestamp: "05:10 PM" },
    ],
    fineLocations: [
      {
        id: "FINE-010",
        lat: 25.2652,
        lng: 55.3201,
        fineAmount: 250,
        timestamp: "10:40 AM",
        plateNumber: "UVX-3001",
      },
      {
        id: "FINE-011",
        lat: 25.2625,
        lng: 55.3236,
        fineAmount: 400,
        timestamp: "01:15 PM",
        plateNumber: "YZA-7643",
      },
      {
        id: "FINE-012",
        lat: 25.2832,
        lng: 55.3115,
        fineAmount: 320,
        timestamp: "04:25 PM",
        plateNumber: "BCD-5520",
      },
    ],
  },
];

// Configuration
export const hrmsConfig: PageConfig = {
  key: "hrms",
  title: "page.title.hrms",
  name: { singular: "entity.hrms", plural: "HRMS Records" },

  api: {
    get: "/api/HRMS/Attendance/GetAll",
    post: "/api/hrms/attendance",
    postContentType: "application/json",
    put: "/api/hrms/attendance/{id}",
    delete: "",
  },

  searchConfig: {
    globalSearchKeys: ["inspectorName"],
    columnFilterKeys: ["status"],
    dateRangeKey: "addOn",
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
      { key: "date", title: "form.date", type: "date", width: 150 },
      { key: "inspectorName", title: "form.inspectorName", type: "string", width: 220 },
      // { key: "supervisorName", title: "form.supervisorName", type: "string", width: 220 },
      { key: "checkInTime", title: "form.checkInTime", type: "string", width: 140 },
      { key: "checkOutTime", title: "form.checkOutTime", type: "string", width: 140 },
      // { key: "status", title: "form.status", type: "string", filterable: true, width: 130 },
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
