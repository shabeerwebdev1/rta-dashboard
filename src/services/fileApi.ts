import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const fileApi = createApi({
  reducerPath: "fileApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/file-api/api/Files/" }),
  endpoints: (builder) => ({
    uploadFiles: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "upload-multiple",
        method: "POST",
        body: formData,
      }),
    }),
    deleteFile: builder.mutation<void, string>({
      query: (fileName) => ({
        url: `delete/${fileName}`,
        method: "GET",
      }),
    }),
  }),
});

export const getFileUrl = (fileName: string) =>
  `/file-api/api/Files/download/${fileName}`;

export const { useUploadFilesMutation, useDeleteFileMutation } = fileApi;
