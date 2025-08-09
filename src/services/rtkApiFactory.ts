import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { pageConfigs } from "../config/pageConfigs";

const baseQuery = fetchBaseQuery({
  baseUrl: "/",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const dynamicApi = createApi({
  reducerPath: "dynamicApi",
  baseQuery: baseQuery,
  tagTypes: Object.keys(pageConfigs).concat(["PermitSearch"]),
  endpoints: (builder) => {
    const endpoints: Record<string, unknown> = {};

    for (const [entity, config] of Object.entries(pageConfigs)) {
      const singular = config.name.singular.replace(/\s/g, "");
      const plural = config.name.plural.replace(/\s/g, "");

      endpoints[`get${plural}`] = builder.query({
        query: () => config.api.get,
        providesTags: [entity],
        transformResponse: (response: { data?: unknown[] }) => response.data || [],
      });

      endpoints[`add${singular}`] = builder.mutation({
        query: (body: unknown) => {
          return {
            url: config.api.post,
            method: "POST",
            body,
          };
        },
        invalidatesTags: [entity],
      });

      endpoints[`update${singular}`] = builder.mutation({
        query: ({ id, ...body }: { id: string | number; [key: string]: unknown }) => ({
          url: config.api.put.includes(":id") ? config.api.put.replace(":id", id) : config.api.put,
          method: "PUT",
          body: { id, ...body },
        }),
        invalidatesTags: [entity],
      });

      if (config.api.delete) {
        endpoints[`delete${singular}`] = builder.mutation({
          query: (id: string | number) => ({
            url: config.api.delete.replace(":id", id),
            method: "DELETE",
          }),
          invalidatesTags: [entity],
        });
      }
    }

    endpoints.searchPermits = builder.query({
      query: (params: Record<string, unknown>) => ({
        url: "/api/Permit/search",
        params,
      }),
      providesTags: ["PermitSearch"],
      transformResponse: (response: { data?: unknown[] }) => response.data || [],
    });

    return endpoints;
  },
});

export const { useLazySearchPermitsQuery } = dynamicApi;
