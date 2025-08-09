import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  IResponseWrapper,
  WhitelistPlateRequestDto,
  WhitelistPlateResponseDto,
  WhitelistPlateUpdateDto,
  WhitelistTradeLicenseRequestDto,
  WhitelistTradeLicenseResponseDto,
  WhitelistTradeLicenseUpdateDto,
} from "../../types/api";

const getAuthToken = () => {
  return "YOUR_BEARER_TOKEN_HERE";
};

export const whitelistApi = createApi({
  reducerPath: "whitelistApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["WhitelistPlate", "WhitelistTradeLicense"],
  endpoints: (builder) => ({
    getWhitelistPlates: builder.query<WhitelistPlateResponseDto[], void>({
      query: () => "WhitelistPlate",
      transformResponse: (
        response: IResponseWrapper<WhitelistPlateResponseDto[]>
      ) => response.data,
      providesTags: ["WhitelistPlate"],
    }),
    addWhitelistPlate: builder.mutation<
      WhitelistPlateResponseDto,
      WhitelistPlateRequestDto
    >({
      query: (newPlate) => ({
        url: "WhitelistPlate",
        method: "POST",
        body: newPlate,
      }),
      transformResponse: (
        response: IResponseWrapper<WhitelistPlateResponseDto>
      ) => response.data,
      invalidatesTags: ["WhitelistPlate"],
    }),
    updateWhitelistPlate: builder.mutation<
      WhitelistPlateResponseDto,
      WhitelistPlateUpdateDto
    >({
      query: (plate) => ({
        url: `WhitelistPlate`,
        method: "PUT",
        body: plate,
      }),
      transformResponse: (
        response: IResponseWrapper<WhitelistPlateResponseDto>
      ) => response.data,
      invalidatesTags: ["WhitelistPlate"],
    }),
    deleteWhitelistPlate: builder.mutation<boolean, number>({
      query: (id) => ({
        url: `WhitelistPlate/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: IResponseWrapper<boolean>) => response.data,
      invalidatesTags: ["WhitelistPlate"],
    }),

    getWhitelistTradeLicenses: builder.query<
      WhitelistTradeLicenseResponseDto[],
      void
    >({
      query: () => "WhitelistTradeLicense",
      transformResponse: (
        response: IResponseWrapper<WhitelistTradeLicenseResponseDto[]>
      ) => response.data,
      providesTags: ["WhitelistTradeLicense"],
    }),
    addWhitelistTradeLicense: builder.mutation<
      WhitelistTradeLicenseResponseDto,
      WhitelistTradeLicenseRequestDto
    >({
      query: (newLicense) => ({
        url: "WhitelistTradeLicense",
        method: "POST",
        body: newLicense,
      }),
      transformResponse: (
        response: IResponseWrapper<WhitelistTradeLicenseResponseDto>
      ) => response.data,
      invalidatesTags: ["WhitelistTradeLicense"],
    }),
    updateWhitelistTradeLicense: builder.mutation<
      WhitelistTradeLicenseResponseDto,
      WhitelistTradeLicenseUpdateDto
    >({
      query: (license) => ({
        url: `WhitelistTradeLicense/update`,
        method: "PUT",
        body: license,
      }),
      transformResponse: (
        response: IResponseWrapper<WhitelistTradeLicenseResponseDto>
      ) => response.data,
      invalidatesTags: ["WhitelistTradeLicense"],
    }),
    deleteWhitelistTradeLicense: builder.mutation<boolean, number>({
      query: (id) => ({
        url: `WhitelistTradeLicense/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: IResponseWrapper<boolean>) => response.data,
      invalidatesTags: ["WhitelistTradeLicense"],
    }),
  }),
});

export const {
  useGetWhitelistPlatesQuery,
  useAddWhitelistPlateMutation,
  useUpdateWhitelistPlateMutation,
  useDeleteWhitelistPlateMutation,
  useGetWhitelistTradeLicensesQuery,
  useAddWhitelistTradeLicenseMutation,
  useUpdateWhitelistTradeLicenseMutation,
  useDeleteWhitelistTradeLicenseMutation,
} = whitelistApi;
