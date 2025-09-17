import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const RTA_API_TARGET = "https://qaparkingapi.kandaprojects.live";
const INSPECTION_FILES_BASE_URL = "https://kandaprojects.live/documents/parking";

const MOBILE_FILES_BASE_URL = "https://kandaprojects.live/documents";

export const inspectionFileApi = createApi({
  reducerPath: "inspectionFileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${RTA_API_TARGET}/api/TBLattachment/`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("sTafteeshToken");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    //  Upload files for inspection obstacle
    uploadInspectionFiles: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "upload",
        method: "POST",
        body: formData,
      }),
    }),

    // Get all attachments by inspection
    getInspectionAttachments: builder.query<any[], { inspectionGUID: string; entityCode: string }>({
      query: ({ inspectionGUID, entityCode }) => ({
        url: `${inspectionGUID}/${entityCode}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data || [],
    }),
  }),
});

//  Helper to build a download URL for preview
export const getInspectionFileUrl = (filePath: string, fileName: string) =>
  `${INSPECTION_FILES_BASE_URL}/${filePath}/${encodeURIComponent(fileName)}`;

export const getMobileFileUrl = (filePath: string, fileName: string) =>
  `${MOBILE_FILES_BASE_URL}/${filePath}/${encodeURIComponent(fileName)}`;

export const { useUploadInspectionFilesMutation, useGetInspectionAttachmentsQuery } = inspectionFileApi;
