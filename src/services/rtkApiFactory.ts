import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { pageConfigs } from "../config/pageConfigs";

const baseQuery = fetchBaseQuery({
  baseUrl: "/",
  prepareHeaders: (headers, { getState }) => {
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
    const endpoints: any = {};

    for (const [entity, config] of Object.entries(pageConfigs)) {
      const singular = config.name.singular.replace(/\s/g, "");
      const plural = config.name.plural.replace(/\s/g, "");

      endpoints[`get${plural}`] = builder.query({
        query: () => config.api.get,
        providesTags: [entity],
        transformResponse: (response: any) => response.data || [],
      });

      endpoints[`add${singular}`] = builder.mutation({
        query: (body) => {
          return {
            url: config.api.post,
            method: "POST",
            body,
          };
        },
        invalidatesTags: [entity],
      });

      endpoints[`update${singular}`] = builder.mutation({
        query: ({ id, ...body }) => ({
          url: config.api.put.includes(":id")
            ? config.api.put.replace(":id", id)
            : config.api.put,
          method: "PUT",
          body: { id, ...body },
        }),
        invalidatesTags: [entity],
      });

      if (config.api.delete) {
        endpoints[`delete${singular}`] = builder.mutation({
          query: (id) => ({
            url: config.api.delete.replace(":id", id),
            method: "DELETE",
          }),
          invalidatesTags: [entity],
        });
      }
    }

    endpoints.searchPermits = builder.query({
      query: (params) => ({
        url: "/api/Permit/search",
        params,
      }),
      providesTags: ["PermitSearch"],
      transformResponse: (response: any) => response.data || [],
    });

    return endpoints;
  },
});

export const { useLazySearchPermitsQuery } = dynamicApi;
