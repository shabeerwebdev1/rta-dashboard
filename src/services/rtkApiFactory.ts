/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { serializeParams } from "../hooks/useTableParams";
import { RTA_API_TARGET, EXTERNAL_FILES_URL } from "../config/envConfig";

// const RTA_API_TARGET = "https://devparkingapi.kandaprojects.live";

// const MOBILE_FILES_BASE_URL = "https://kandaprojects.live/documents";

// const MOBILE_FILES_BASE_URL = "http://10.0.1.85:9000/documents"; // K and A SERVER 85

// const RTA_API_TARGET = `http://10.0.1.85:9010`;   // K and A SERVER 85

/////RTA stagging URl

// const MOBILE_FILES_BASE_URL = "http://10.14.64.104:9000/documents";  // RTA SERVER

// const RTA_API_TARGET = `http://10.14.64.104:9010`; // RTA SERVER

//helper to get inspections images url
export const getMobileFileUrl = (filePath: string) => {
  if (!filePath) return "";
  let normalizedPath = filePath.replace(/\\/g, "/");
  normalizedPath = normalizedPath.replace(/\/+/g, "/");
  normalizedPath = normalizedPath.replace(/^\/+/, "");

  return `${EXTERNAL_FILES_URL}/${normalizedPath}`;
};

//helper to get images  from localserver
export const getFileUrl = (fileName: string) => {
  if (!fileName) return "";
  if (fileName.includes("%5C")) {
    return `${RTA_API_TARGET}/api/Files/download/${fileName}`;
  }
  const fixedFileName = fileName.replace(/[\\/]+/g, "\\\\");
  return encodeURI(`${RTA_API_TARGET}/api/Files/download/${fixedFileName}`);
};

const baseQuery = fetchBaseQuery({
  baseUrl: RTA_API_TARGET,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("sTafteeshToken");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
  paramsSerializer: serializeParams,
});

const transformListResponse = (response: any) => ({
  data: response.data || [],
  total: response.totalCount || 0,
});

export const dynamicApi = createApi({
  reducerPath: "dynamicApi",
  baseQuery: baseQuery,
  tagTypes: [
    "WhitelistPlate",
    "WhitelistTradeLicense",
    "Pledge",
    "InspectionObstacle",
    "Dispute",
    "PermitSearch",
    "FineSearch",
    "ParkonicSearch",
    "VLookups",
    "WebDashboard",
    "Zones",
    "Shifts",
    "Roles",
    "ShiftManagement",
    "LeaveDetails",
    "CallIntegration",
    "Towing",
    "ParkonicsLocation",
    "InspectionAttachments",
    "Files",
    "InboxSummary",
    "InboxSummaryMenu",
  ],

  endpoints: (builder) => ({
    getLookups: builder.query({
      query: (ids: number[]) => ({
        url: "/api/VLookups",
        method: "POST",
        body: ids,
      }),
      transformResponse: (response: any) => {
        if (!response?.data) return [];

        return response.data.flatMap(
          (catg: any) =>
            catg.ddItems?.map((item: any) => ({
              categoryId: catg.ddiCatgId,
              categoryName: catg.ddiCatgName,
              value: item.ddiCode,
              labelEn: item.ddiDispText_En,
              labelAr: item.ddiDispText_Ar,
            })) || [],
        );
      },
      providesTags: ["VLookups"],
    }),

    // File Upload and Management (from fileserver)
    uploadFiles: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "/api/Files/upload-multiple",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Files"],
    }),

    deleteFile: builder.mutation<void, string>({
      query: (fileName) => ({
        url: `/api/Files/delete/${fileName}`,
        method: "GET",
      }),
      invalidatesTags: ["Files"],
    }),

    // File Upload and Management for Inspections
    uploadInspectionFiles: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "/api/TBLattachment/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["InspectionAttachments"],
    }),

    getInspectionAttachments: builder.query<any[], { inspectionGUID: string; entityCode: string }>({
      query: ({ inspectionGUID, entityCode }) => ({
        url: `/api/TBLattachment/${inspectionGUID}/${entityCode}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data || [],
      providesTags: ["InspectionAttachments"],
    }),

    // Whitelist Plates
    getPlates: builder.query({
      query: (params) => ({ url: "/api/WhitelistPlate", params }),
      providesTags: ["WhitelistPlate"],
    }),
    getPlateById: builder.query({
      query: (id) => `/api/WhitelistPlate/${id}`,
    }),
    addPlate: builder.mutation({
      query: (body) => ({ url: "/api/WhitelistPlate", method: "POST", body }),
      invalidatesTags: ["WhitelistPlate"],
    }),
    updatePlate: builder.mutation({
      query: (body) => ({ url: "/api/WhitelistPlate", method: "PUT", body }),
      invalidatesTags: ["WhitelistPlate"],
    }),
    deletePlate: builder.mutation({
      query: (id) => ({ url: `/api/WhitelistPlate/${id}`, method: "DELETE" }),
      invalidatesTags: ["WhitelistPlate"],
    }),

    // Whitelist Trade Licenses
    getTradeLicenses: builder.query({
      query: (params) => ({ url: "/api/WhitelistTradeLicense", params }),
      transformResponse: (response: any) => ({
        data: response?.data || [],
        totalCount: response?.totalCount || 0,
        activeRecords: response?.activeRecords || 0,
        inactiveRecords: response?.inactiveRecords || 0,
        expiredRecords: response?.expiredRecords || 0,
      }),
      providesTags: ["WhitelistTradeLicense"],
    }),
    getTradeLicenseById: builder.query({
      query: (id) => `/api/WhitelistTradeLicense/${id}`,
    }),
    addTradeLicense: builder.mutation({
      query: (body) => ({ url: "/api/WhitelistTradeLicense", method: "POST", body }),
      invalidatesTags: ["WhitelistTradeLicense"],
    }),
    updateTradeLicense: builder.mutation({
      query: (body) => ({ url: "/api/WhitelistTradeLicense/update", method: "PUT", body }),
      invalidatesTags: ["WhitelistTradeLicense"],
    }),
    deleteTradeLicense: builder.mutation({
      query: (id) => ({ url: `/api/WhitelistTradeLicense/${id}`, method: "DELETE" }),
      invalidatesTags: ["WhitelistTradeLicense"],
    }),

    // Pledges
    getPledges: builder.query({
      query: (params) => ({ url: "/api/Pledge", params }),
      providesTags: ["Pledge"],
    }),
    getPledgeById: builder.query({
      query: (id) => `/api/Pledge/${id}`,
    }),
    addPledge: builder.mutation({
      query: (body) => ({ url: "/api/Pledge", method: "POST", body }),
      invalidatesTags: ["Pledge"],
    }),
    updatePledge: builder.mutation({
      query: (body) => ({ url: `/api/Pledge`, method: "PUT", body }),
      invalidatesTags: ["Pledge"],
    }),
    deletePledge: builder.mutation({
      query: (id) => ({ url: `/api/Pledge/${id}`, method: "DELETE" }),
      invalidatesTags: ["Pledge"],
    }),

    // Inspection Obstacles
    getInspectionObstacles: builder.query({
      query: (params) => ({ url: "/api/InspectionObstacle", params }),
      providesTags: ["InspectionObstacle"],
    }),
    getInspectionObstacleById: builder.query({
      query: (id) => `/api/InspectionObstacle/${id}`,
    }),
    addInspectionObstacle: builder.mutation({
      query: (body) => ({ url: "/api/InspectionObstacle", method: "POST", body }),
      invalidatesTags: ["InspectionObstacle"],
    }),
    updateInspectionObstacle: builder.mutation({
      query: (InspectionGUID) => ({
        url: `/api/InspectionObstacle/markremoved/${InspectionGUID}`,
        method: "PUT",
      }),
      invalidatesTags: ["InspectionObstacle"],
    }),

    // Disputes
    getDisputes: builder.query({
      query: (params) => ({ url: "/api/Dispute/GetAll", params }),
      transformResponse: (response: any) => ({
        data: response?.data ?? [],
        total: response?.totalCount ?? 0,
        totalCount: response?.totalCount ?? 0,
        pageNumber: response?.pageNumber,
        pageSize: response?.pageSize,
        pending: response?.pending ?? 0,
        approved: response?.approved ?? 0,
        rejected: response?.rejected ?? 0,
        inReview: response?.inReview ?? 0,
        statusCode: response?.statusCode,
        successful: response?.successful,
        en_Msg: response?.en_Msg,
        ar_Msg: response?.ar_Msg,
      }),
      providesTags: ["Dispute"],
    }),
    getParkingDisputes: builder.query({
      query: (params) => ({ url: "/api/Dispute/ParkingDisputes", params }),
      transformResponse: (response: any) => ({
        data: response?.data ?? [],
        total: response?.totalCount ?? 0,
        totalCount: response?.totalCount ?? 0,
        pageNumber: response?.pageNumber,
        pageSize: response?.pageSize,
        pending: response?.pending ?? 0,
        approved: response?.approved ?? 0,
        rejected: response?.rejected ?? 0,
        inReview: response?.inReview ?? 0,
        statusCode: response?.statusCode,
        successful: response?.successful,
        en_Msg: response?.en_Msg,
        ar_Msg: response?.ar_Msg,
      }),
      providesTags: ["Dispute"],
    }),
    getVehicleDisputes: builder.query({
      query: (params) => ({ url: "/api/Dispute/VehicleDisputes", params }),
      transformResponse: (response: any) => ({
        data: response?.data ?? [],
        total: response?.totalCount ?? 0,
        totalCount: response?.totalCount ?? 0,
        pageNumber: response?.pageNumber,
        pageSize: response?.pageSize,
        pending: response?.pending ?? 0,
        approved: response?.approved ?? 0,
        rejected: response?.rejected ?? 0,
        inReview: response?.inReview ?? 0,
        statusCode: response?.statusCode,
        successful: response?.successful,
        en_Msg: response?.en_Msg,
        ar_Msg: response?.ar_Msg,
      }),
      providesTags: ["Dispute"],
    }),

    getDisputeById: builder.query({
      query: (id) => `/api/Dispute/GetById/${id}`,
    }),
    addDispute: builder.mutation({
      query: (body) => ({ url: "/api/Dispute/Create", method: "POST", body }),
      invalidatesTags: ["Dispute"],
    }),
    updateDispute: builder.mutation({
      query: (body) => ({ url: "/api/Dispute/Update", method: "PUT", body }),
      invalidatesTags: ["Dispute"],
    }),
    updateDisputeStatus: builder.mutation({
      query: (body) => ({
        url: "/api/Dispute/UpdateStatusFields",
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        "Dispute",
        "InboxSummary", // refresh count + list
        "InboxSummaryMenu",
      ],
    }),

    //Inpection Shifts
    getInspectionShifts: builder.query({
      query: () => ({
        url: "/api/Inspection/Shifts",
      }),
    }),

    //Adhoc shift plan
    getAdhocShifts: builder.query({
      query: (body) => ({
        url: "/api/ShiftPlanMaster/GetAdhocShifts",
        method: "POST",
        body,
      }),
    }),

    publishAdhoc: builder.mutation({
      query: (body) => ({
        url: "/api/ShiftPlanMaster/PublishAdhoc",
        method: "PUT",
        body,
      }),
    }),

    // Search Endpoints
    searchPermits: builder.query({
      query: (params) => ({ url: "/api/Permit/search", params }),
      providesTags: ["PermitSearch"],
      transformResponse: (response: any) => ({ data: response.data || [], total: response.data?.length || 0 }),
    }),

    searchFines: builder.query({
      query: (params) => ({ url: "/api/Inspection/CarInspections", params }),
      providesTags: ["FineSearch"],
      transformResponse: (response: any) => {
        if (!response) return { data: [], total: 0 };

        const normalizedData = (response.data || []).map((item: any) => ({
          ...item,
          inspectionCategory: item.inspectionCategory ? parseInt(item.inspectionCategory, 10) : null,
        }));

        return {
          data: normalizedData,
          total: response.totalCount || 0,
        };
      },
    }),

    searchTrade: builder.query({
      query: (params) => ({ url: "/api/Inspection/TLInspections", params }),
      providesTags: ["FineSearch"],
      transformResponse: (response: any) => {
        if (!response) return { data: [], total: 0 };

        const normalizedData = (response.data || []).map((item: any) => ({
          ...item,
          inspectionCategory: item.inspectionCategory ? parseInt(item.inspectionCategory, 10) : null,
        }));

        return {
          data: normalizedData,
          total: response.totalCount || 0,
        };
      },
    }),

    getViolationDetails: builder.query<any[], { inspectionGUID: string; entityCode: string }>({
      query: ({ inspectionGUID, entityCode }) => ({
        url: `/api/Inspection/${inspectionGUID}/${entityCode}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data || [],
      // providesTags: ["InspectionViolation"],
    }),

    // Update Fine Cancel Status
    updateFineCancelStatus: builder.mutation({
      query: (body) => ({
        url: "/api/InspectionCancelFine/updatestatus",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["FineSearch"],
    }),

    getParkonics: builder.query({
      query: (params) => ({ url: "/api/Parkonic", params }),
      transformResponse: (response: any) => ({
        data: response?.data ?? [],
        total: response?.totalCount ?? 0,
        totalCount: response?.totalCount ?? 0,
        pageNumber: response?.pageNumber,
        pageSize: response?.pageSize,

        pending: response?.pendingRecords ?? 0,
        approved: response?.approvedRecords ?? 0,
        rejected: response?.rejectedRecords ?? 0,

        statusCode: response?.statusCode,
        successful: response?.successful,
        en_Msg: response?.en_Msg,
        ar_Msg: response?.ar_Msg,
      }),
      providesTags: ["ParkonicSearch"],
    }),
    updateParkonic: builder.mutation({
      query: (body) => ({ url: "/api/Parkonic", method: "PUT", body }),
      invalidatesTags: [
        "ParkonicSearch",
        "InboxSummary", // refresh count + list
        "InboxSummaryMenu",
      ],
    }),

    getParkonicVoilations: builder.query({
      query: (params) => ({ url: "/api/trParkonics/ParkonincsVoilations", params }),
      transformResponse: transformListResponse,
      providesTags: ["ParkonicSearch"],
    }),

    getParkonicById: builder.query({
      query: (id: string) => ({
        url: `/api/Parkonic/${id}`,
        method: "GET",
      }),
    }),

    // Web Dashboard
    getSupervisorDashboard: builder.query({
      query: (supervisorId: string) => `/api/WebDashboard/dashboard?supervisorId=${supervisorId}`,
      providesTags: ["WebDashboard"],
    }),

    // User code validation
    validatecode: builder.query({
      query: (code: string) => ({
        url: "/api/User/ValidateCode",
        method: "GET",
        params: { code },
      }),
    }),

    // Zones
    getZones: builder.query({
      query: () => "/api/VLookups/Zones",
      providesTags: ["Zones"],
      transformResponse: (response: any) => {
        return response?.data || response || [];
      },
    }),

    // Areas by ZoneId
    getAreas: builder.query({
      query: (zoneId: string) => `/api/VLookups/Areas/${zoneId}`,
      providesTags: ["Zones"],
      transformResponse: (response: any) => {
        return response?.data || response || [];
      },
    }),

    // All Areas
    getAllAreas: builder.query({
      query: () => "/api/VLookups/Areas",
      providesTags: ["Zones"],
      transformResponse: (response: any) => {
        if (response?.data) {
          return response.data;
        }
        return response || [];
      },
    }),

    // Shifts
    getShifts: builder.query({
      query: () => "/api/VLookups/Shifts",
      providesTags: ["Shifts"],
      transformResponse: (response: any) => {
        return response?.data || response || [];
      },
    }),

    getActiveShifts: builder.query({
      query: () => "/api/ShiftManagement/active",
      providesTags: ["ShiftManagement"],
      transformResponse: (response: any) => {
        return response?.data || response || [];
      },
    }),

    updateShiftManagement: builder.mutation({
      query: (body) => ({
        url: "/api/ShiftManagement",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ShiftManagement"],
    }),

    // Role Management
    getRoles: builder.query({
      query: () => "/api/RolePermission/allrole",
      providesTags: ["Roles"],
      transformResponse: (response: any) => {
        return response?.data || response || [];
      },
    }),

    getRoleById: builder.query({
      query: (roleId) => `/api/RolePermission/role/${roleId}`,
      providesTags: ["Roles"],
    }),

    updateRolePermissions: builder.mutation({
      query: (body) => ({
        url: "/api/RolePermission",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    // Leave Management
    getLeaveDetails: builder.query({
      query: (params) => ({ url: "/api/Leave", params }),
      providesTags: ["LeaveDetails"],
    }),

    updateLeaveStatus: builder.mutation({
      query: (body) => ({
        url: "/api/Leave",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["LeaveDetails"],
    }),

    // General Search
    getCarPlateDetails: builder.query({
      query: (body) => ({
        url: "/api/CallIntegration/ReadCarPlate",
        method: "POST",
        body,
      }),
      providesTags: ["CallIntegration"],
    }),

    getTradeLicenseDetails: builder.query({
      query: (body) => ({
        url: "/api/CallIntegration/ReadTL",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      providesTags: ["CallIntegration"],
    }),

    getPermitsRequest: builder.query({
      query: (body) => ({
        url: "/api/CallIntegration/PermitsRequest",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      providesTags: ["CallIntegration"],
    }),

    // Towing Approvals
    getTowingDetails: builder.query({
      query: (params) => ({ url: "/api/Towing", params }),
      transformResponse: transformListResponse,
      providesTags: ["Towing"],
    }),

    updateTowingStatus: builder.mutation({
      query: (body) => ({
        url: "/api/Towing/approval",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Towing"],
    }),

    //Towing Evidence
    getTowingEvidence: builder.query({
      query: (params) => ({ url: "/api/Towing/TowingEvidence", params }),
      transformResponse: transformListResponse,
      providesTags: ["Towing"],
    }),

    // Parkonic Location
    getParkonicsLocation: builder.query({
      query: (params) => ({ url: "/api/ParkonicsLocation", params }),
      transformResponse: (response: any) => ({
        data: response?.data || [],
        total: response?.totalCount || 0,
        totalCount: response?.totalCount || 0,
        pageNumber: response?.pageNumber,
        pageSize: response?.pageSize,
        pgnApprovedRecords: response?.pgnApprovedRecords || 0,
        pgnPendingRecords: response?.pgnPendingRecords || 0,
      }),
      providesTags: ["ParkonicsLocation"],
    }),
    getParkonicsLocationById: builder.query({
      query: (locationGuid) => ({
        url: "/api/ParkonicsLocation/getbyid",
        params: { LocationGuid: locationGuid },
      }),
    }),

    addParkonicsLocation: builder.mutation({
      query: (body) => ({ url: "/api/ParkonicsLocation", method: "POST", body }),
      invalidatesTags: ["ParkonicsLocation"],
    }),
    updateParkonicsLocation: builder.mutation({
      query: (body) => ({
        url: `/api/ParkonicsLocation/status`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        "ParkonicsLocation",
        "InboxSummary", // refresh count + list
        "InboxSummaryMenu",
      ],
    }),

    // Reports
    getHtmlReport: builder.mutation<
      Blob,
      {
        reportPath: string;
        format: "HTML4.0" | "PDF" | "EXCEL" | "EXCELOPENXML" | "WORD" | "WORDOPENXML" | "CSV" | "XML" | "MHTML";
        parameters: any;
      }
    >({
      query: (body) => ({
        url: "/api/Report",
        method: "POST",
        body,
        responseHandler: async (response) => {
          const contentType = response.headers.get("content-type");
          return response.blob();
        },
      }),
    }),

    // Shift Plan
    getShiftPlan: builder.mutation({
      query: (body) => ({
        url: "/api/ShiftPlanMaster/Plan",
        method: "POST",
        body,
      }),
    }),

    getLastBatchDetail: builder.query({
      query: () => "/api/ShiftPlanMaster/LastBatchDetail",
    }),

    getSavedScheduleDraft: builder.query({
      query: () => ({
        url: "/api/ShiftPlanMaster/GetSavedScheduleDraft",
        method: "GET",
      }),
    }),

    publishShiftPlan: builder.mutation({
      query: (payload) => ({
        url: "/api/ShiftPlanMaster/Publish",
        method: "PUT",
        body: payload,
      }),
    }),

    getInboxSummary: builder.query<any, void>({
      query: () => ({
        url: "/api/CallIntegration/inboxNotifications",
        method: "POST",
        body: {
          url: "/api/work-item/count",
          method: "GET",
          param: "",
        },
      }),
      providesTags: ["InboxSummary"], // 🔥 ADD THIS
    }),

    getInboxList: builder.query<any, { PageNumber: number; PageSize: number; notificationCode?: string }>({
      query: ({ PageNumber, PageSize, notificationCode }) => ({
        url: "/api/CallIntegration/inboxNotifications",
        method: "POST",
        body: {
          url: "/api/work-item/list?notificationCode=" + (notificationCode || ""),
          method: "GET",
          param: {
            PageNumber,
            PageSize,
            notificationCode: notificationCode || "",
          },
        },
      }),

      transformResponse: (response: any) => {
        const result = response?.data;

        return {
          Columns: result?.Columns || [],
          DataTable: result?.Result || [], // <-- FIX HERE
          TotalRecords: result?.TotalRecords || 0,
        };
      },
      providesTags: ["InboxSummary"], // 🔥 ADD THIS
    }),

    getInboxSummaryMenu: builder.query<any[], void>({
      query: () => ({
        url: "/api/CallIntegration/inboxNotifications",
        method: "POST",
        body: {
          url: "/api/work-item/summary",
          method: "GET",
          param: "",
        },
      }),
      transformResponse: (response: any) => response?.data || [],
      providesTags: ["InboxSummaryMenu"], // 🔥 ADD THIS
    }),

    getReviewOptions: builder.query<any, string>({
      query: (rcwiuri) => ({
        url: "/api/CallIntegration/inboxNotifications",
        method: "POST",
        body: {
          url: `/api/work-item/review-options?rcwiuri=${rcwiuri}`,
          method: "GET",
          param: "", // ✅ Changed from {} to ""
        },
      }),

      transformResponse: (response: any) => {
        return response?.data || null;
      },
    }),

    getReviewHistory: builder.query<any[], { entityCode: string; entityId: string }>({
      query: ({ entityCode, entityId }) => ({
        url: "/api/CallIntegration/inboxNotifications",
        method: "POST",
        body: {
          url: `/api/work-item/review-history/${entityCode}?id=${entityId}`,
          method: "GET",
          param: "", // empty string - same pattern as review-options
        },
      }),

      transformResponse: (response: any) => {
        // Assuming the real data comes in response.data as array
        // Adjust this if your actual response structure is different
        return response?.data || [];
      },
    }),

    getEntityHistory: builder.query<any[], { entityCode: string; entityId: string }>({
      query: ({ entityCode, entityId }) => ({
        url: "/api/CallIntegration/inboxNotifications",
        method: "POST",
        body: {
          url: `/api/entity/${entityCode}/history?id=${entityId}`,
          method: "GET",
          param: "", // keep same pattern
        },
      }),

      transformResponse: (response: any) => {
        return response?.data || [];
      },
    }),
  }),
});

export const {
  // File Upload for Inspections and obstacles
  useUploadInspectionFilesMutation,
  useGetInspectionAttachmentsQuery,

  // File Uploads (from local server)
  useUploadFilesMutation,
  useDeleteFileMutation,

  // Whitelist Plates
  useGetPlatesQuery,
  useLazyGetPlateByIdQuery,
  useAddPlateMutation,
  useUpdatePlateMutation,
  useDeletePlateMutation,

  // Whitelist Trade Licenses
  useGetTradeLicensesQuery,
  useLazyGetTradeLicenseByIdQuery,
  useAddTradeLicenseMutation,
  useUpdateTradeLicenseMutation,
  useDeleteTradeLicenseMutation,

  // Pledges
  useGetPledgesQuery,
  useLazyGetPledgeByIdQuery,
  useAddPledgeMutation,
  useUpdatePledgeMutation,
  useDeletePledgeMutation,

  //Inspection shifts
  useGetInspectionShiftsQuery,

  // Inspection Obstacles
  useGetInspectionObstaclesQuery,
  useLazyGetInspectionObstacleByIdQuery,
  useAddInspectionObstacleMutation,
  useUpdateInspectionObstacleMutation,

  // Search
  useSearchPermitsQuery,
  useSearchFinesQuery,
  useLazySearchFinesQuery,
  useUpdateFineCancelStatusMutation,
  useSearchTradeQuery,
  useLazySearchTradeQuery,

  //Adhoc new
  useLazyGetAdhocShiftsQuery,
  usePublishAdhocMutation,

  //Inspection Violation
  useGetViolationDetailsQuery,

  // Parkonics
  useGetParkonicsQuery,
  useUpdateParkonicMutation,
  useLazyGetLookupsQuery,
  useGetParkonicVoilationsQuery,
  useLazyGetParkonicByIdQuery,

  // Disputes
  useGetDisputesQuery,
  useGetParkingDisputesQuery,
  useGetVehicleDisputesQuery,
  useLazyGetDisputeByIdQuery,
  useAddDisputeMutation,
  useUpdateDisputeMutation,
  useUpdateDisputeStatusMutation,

  // Web Dashboard
  useGetSupervisorDashboardQuery,

  // Zones and Areas
  useLazyGetZonesQuery,
  useLazyGetAreasQuery,
  useGetAllAreasQuery,

  // Shifts
  useLazyGetShiftsQuery,
  useGetActiveShiftsQuery,
  useUpdateShiftManagementMutation,

  // User code validation
  useValidatecodeQuery,

  // Role Management
  useGetRolesQuery,
  useLazyGetRoleByIdQuery,
  useUpdateRolePermissionsMutation,

  // Leave Management
  useGetLeaveDetailsQuery,
  useUpdateLeaveStatusMutation,

  // General Search
  useLazyGetCarPlateDetailsQuery,
  useLazyGetTradeLicenseDetailsQuery,
  useLazyGetPermitsRequestQuery,

  // Towing Approvals
  useGetTowingDetailsQuery,
  useUpdateTowingStatusMutation,
  useGetTowingEvidenceQuery,

  // Parkonic Location
  useGetParkonicsLocationQuery,
  useLazyGetParkonicsLocationByIdQuery,
  useAddParkonicsLocationMutation,
  useUpdateParkonicsLocationMutation,

  // Reports
  useGetHtmlReportMutation,

  // Shift Plan
  useGetShiftPlanMutation,
  useGetSavedScheduleDraftQuery,
  useGetLastBatchDetailQuery,
  usePublishShiftPlanMutation,

  // Inbox Summary
  useGetInboxSummaryQuery,
  useGetInboxListQuery,
  useGetInboxSummaryMenuQuery,
  useLazyGetReviewOptionsQuery,
  useLazyGetReviewHistoryQuery,
  useLazyGetEntityHistoryQuery,
} = dynamicApi;
