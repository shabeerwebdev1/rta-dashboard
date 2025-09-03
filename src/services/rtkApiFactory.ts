import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { serializeParams } from "../hooks/useTableParams";

const RTA_API_TARGET = "https://devparkingapi.kandaprojects.live";

const baseQuery = fetchBaseQuery({
  baseUrl: RTA_API_TARGET,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth_token");
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
  ],
  endpoints: (builder) => ({
    getLookups: builder.query({
      query: (ids: number[]) => ({
        url: "/api/VLookups",
        method: "POST",
        body: ids, // 👈 must be an array like [100] or [100,200,300]
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

    // Whitelist Plates
    getPlates: builder.query({
      query: (params) => ({ url: "/api/WhitelistPlate", params }),
      transformResponse: transformListResponse,
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
      transformResponse: transformListResponse,
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
      transformResponse: transformListResponse,
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
      query: ({ id, ...body }) => ({ url: `/api/Pledge/${id}`, method: "PUT", body }),
      invalidatesTags: ["Pledge"],
    }),
    deletePledge: builder.mutation({
      query: (id) => ({ url: `/api/Pledge/${id}`, method: "DELETE" }),
      invalidatesTags: ["Pledge"],
    }),

    // Inspection Obstacles
    getInspectionObstacles: builder.query({
      query: (params) => ({ url: "/api/InspectionObstacle", params }),
      transformResponse: transformListResponse,
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
      query: (obstacleCode) => ({
        url: `/api/InspectionObstacle/markremoved/${obstacleCode}`,
        method: "PUT",
      }),
      invalidatesTags: ["InspectionObstacle"],
    }),

    // Disputes
    getDisputes: builder.query({
      query: (params) => ({ url: "/api/Dispute/GetAll", params }),
      transformResponse: transformListResponse,
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
      invalidatesTags: ["Dispute"],
    }),

    // Search Endpoints
    searchPermits: builder.query({
      query: (params) => ({ url: "/api/Permit/search", params }),
      providesTags: ["PermitSearch"],
      transformResponse: (response: any) => ({ data: response.data || [], total: response.data?.length || 0 }),
    }),

    // FIXED: searchFines query to handle the correct response structure
    searchFines: builder.query({
      query: (params) => ({ url: "/api/Inspection", params }),
      providesTags: ["FineSearch"],
      transformResponse: (response: any) => {
        //  API response structure: { totalCount, pageNumber, pageSize, statusCode, successful, en_Msg, ar_Msg, data: [...] }
        if (!response) return { data: [], total: 0 };
        // Return both data and total for proper pagination
        return {
          data: response.data || [],
          total: response.totalCount || 0,
        };
      },
    }),

    searchParkonics: builder.query({
      query: (params) => ({ url: "/api/Parkonic", params }),
      providesTags: ["ParkonicSearch"],
      transformResponse: transformListResponse,
    }),

    // Parkonic Review
    reviewParkonic: builder.mutation({
      query: (body) => ({ url: "/api/Parkonic/Review", method: "PUT", body }),
      invalidatesTags: ["ParkonicSearch"],
    }),

    // Web Dashboard

    getSupervisorDashboard: builder.query({
      query: (supervisorId: string) => `/api/WebDashboard/GetBySupervisor/${supervisorId}`,
      providesTags: ["WebDashboard"],
    }),
  }),
});

export const {
  useGetPlatesQuery,
  useLazyGetPlateByIdQuery,
  useAddPlateMutation,
  useUpdatePlateMutation,
  useDeletePlateMutation,
  useGetTradeLicensesQuery,
  useLazyGetTradeLicenseByIdQuery,
  useAddTradeLicenseMutation,
  useUpdateTradeLicenseMutation,
  useDeleteTradeLicenseMutation,
  useGetPledgesQuery,
  useLazyGetPledgeByIdQuery,
  useAddPledgeMutation,
  useUpdatePledgeMutation,
  useDeletePledgeMutation,
  useGetInspectionObstaclesQuery,
  useLazyGetInspectionObstacleByIdQuery,
  useAddInspectionObstacleMutation,
  useUpdateInspectionObstacleMutation,
  useSearchPermitsQuery,
  useSearchFinesQuery,
  useSearchParkonicsQuery,
  useReviewParkonicMutation,
  useLazyGetLookupsQuery,
  useGetDisputesQuery,
  useLazyGetDisputeByIdQuery,
  useAddDisputeMutation,
  useUpdateDisputeMutation,
  useUpdateDisputeStatusMutation,
  useGetSupervisorDashboardQuery,
} = dynamicApi;
