import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  IResponseWrapper,
  PledgeRequestDto,
  PledgeResponseDto,
  PledgeUpdateDto,
} from "../../types/api";

const getAuthToken = () => {
  return "YOUR_BEARER_TOKEN_HERE";
};

export const pledgeApi = createApi({
  reducerPath: "pledgeApi",
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
  tagTypes: ["Pledge"],
  endpoints: (builder) => ({
    getPledges: builder.query<PledgeResponseDto[], void>({
      query: () => "Pledge",
      transformResponse: (response: IResponseWrapper<PledgeResponseDto[]>) =>
        response.data,
      providesTags: ["Pledge"],
    }),
    addPledge: builder.mutation<PledgeResponseDto, PledgeRequestDto>({
      query: (newPledge) => ({
        url: "Pledge",
        method: "POST",
        body: newPledge,
      }),
      transformResponse: (response: IResponseWrapper<PledgeResponseDto>) =>
        response.data,
      invalidatesTags: ["Pledge"],
    }),
    updatePledge: builder.mutation<PledgeResponseDto, PledgeUpdateDto>({
      query: (pledge) => ({
        url: `Pledge`,
        method: "PUT",
        body: pledge,
      }),
      transformResponse: (response: IResponseWrapper<PledgeResponseDto>) =>
        response.data,
      invalidatesTags: ["Pledge"],
    }),
    deletePledge: builder.mutation<boolean, number>({
      query: (id) => ({
        url: `Pledge/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: IResponseWrapper<boolean>) => response.data,
      invalidatesTags: ["Pledge"],
    }),
  }),
});

export const {
  useGetPledgesQuery,
  useAddPledgeMutation,
  useUpdatePledgeMutation,
  useDeletePledgeMutation,
} = pledgeApi;
