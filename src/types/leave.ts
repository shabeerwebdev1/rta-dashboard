// types/leave.ts
export interface LeaveRecord {
    id: string;
    leaveId: string;
    inspectorId: string;
    inspectorName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: "Approved" | "Rejected" | "Pending";
    comments?: string;
    appliedDate: string;
    processedBy?: string;
    processedDate?: string;
  }