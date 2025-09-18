import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const RTA_API_TARGET = "https://devparkingapi.kandaprojects.live";


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


export const getMobileFileUrl = (filePath: string) => {
  if (!filePath) return "";
  let normalizedPath = filePath.replace(/\\/g, "/"); // Replace backslashes with forward slashes
  normalizedPath = normalizedPath.replace(/\/+/g, "/"); // Replace multiple slashes with a single slash
  normalizedPath = normalizedPath.replace(/^\/+/, ""); // Remove leading slashes

  return `${MOBILE_FILES_BASE_URL}/${normalizedPath}`;
};

export const { useUploadInspectionFilesMutation, useGetInspectionAttachmentsQuery } = inspectionFileApi;
