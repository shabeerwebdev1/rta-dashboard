import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const FILE_SERVER_TARGET = "https://fileserver.kandaprojects.live";

export const fileApi = createApi({
  reducerPath: "fileApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${FILE_SERVER_TARGET}/api/Files/` }),
  endpoints: (builder) => ({
    uploadFiles: builder.mutation<unknown, FormData>({
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

export const getFileUrl = (fileName: string) => `${FILE_SERVER_TARGET}/api/Files/download/${fileName}`;

export const { useUploadFilesMutation, useDeleteFileMutation } = fileApi;
