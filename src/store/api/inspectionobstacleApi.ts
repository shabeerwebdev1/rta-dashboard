import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  IResponseWrapper,
  InspectionObstacleRequestDto,
  InspectionObstacleResponseDto,
} from "../../types/api";

// Replace this with real token retrieval logic if needed
const getAuthToken = () => {
  return "YOUR_BEARER_TOKEN_HERE";
};

export const inspectionObstacleApi = createApi({
  reducerPath: "inspectionObstacleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["InspectionObstacle"],
  endpoints: (builder) => ({
    // GET: /api/InspectionObstacle/search
    getInspectionObstacles: builder.query<
      InspectionObstacleResponseDto[],
      void
    >({
      query: () => "InspectionObstacle/search",
      transformResponse: (
        response: IResponseWrapper<InspectionObstacleResponseDto[]>
      ) => response.data,
      providesTags: ["InspectionObstacle"],
    }),

    // POST: /api/InspectionObstacle
    addInspectionObstacle: builder.mutation<
      InspectionObstacleResponseDto,
      InspectionObstacleRequestDto
    >({
      query: (newObstacle) => ({
        url: "InspectionObstacle",
        method: "POST",
        body: newObstacle,
      }),
      transformResponse: (
        response: IResponseWrapper<InspectionObstacleResponseDto>
      ) => response.data,
      invalidatesTags: ["InspectionObstacle"],
    }),

    // PUT: /api/InspectionObstacle/markremoved/{id}
    markObstacleAsRemoved: builder.mutation<
      InspectionObstacleResponseDto,
      {
        id: number;
        data: { removedAt: string; removedBy: string; status: string };
      }
    >({
      query: ({ id, data }) => ({
        url: `InspectionObstacle/markremoved/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (
        response: IResponseWrapper<InspectionObstacleResponseDto>
      ) => response.data,
      invalidatesTags: ["InspectionObstacle"],
    }),
  }),
});

export const {
  useGetInspectionObstaclesQuery,
  useAddInspectionObstacleMutation,
  useMarkObstacleAsRemovedMutation,
} = inspectionObstacleApi;
