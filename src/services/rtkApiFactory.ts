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
  ],
  endpoints: (builder) => ({
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
      query: ({ id, ...params }) => ({ url: `/api/InspectionObstacle/markremoved/${id}`, method: "PUT", params }),
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

    // Search Endpoints
    searchPermits: builder.query({
      query: (params) => ({ url: "/api/Permit/search", params }),
      providesTags: ["PermitSearch"],
      transformResponse: (response: any) => ({ data: response.data || [], total: response.data?.length || 0 }),
    }),
    searchFines: builder.query({
      query: (params) => ({ url: "/api/FineManagement/search", params }),
      providesTags: ["FineSearch"],
      transformResponse: (response: any) => {
        const data = response?.data;
        return Array.isArray(data) ? data : [data];
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
  useGetDisputesQuery,
  useLazyGetDisputeByIdQuery,
  useAddDisputeMutation,
  useUpdateDisputeMutation,
  useSearchPermitsQuery,
  useLazySearchFinesQuery,
  useSearchParkonicsQuery,
  useReviewParkonicMutation,
} = dynamicApi;