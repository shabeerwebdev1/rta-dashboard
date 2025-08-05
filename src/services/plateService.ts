import HttpClient from "../utils/httpClient";
import API_ENDPOINTS from "./apiConfig";

export const plateService = {
  list: () => HttpClient.get(API_ENDPOINTS.plate.list),
  create: (data: any) => HttpClient.post(API_ENDPOINTS.plate.create, data),
  update: (data: any) => HttpClient.put(API_ENDPOINTS.plate.update, data),
  delete: (id: string) => HttpClient.delete(API_ENDPOINTS.plate.delete(id)),
  getById: (id: string) => HttpClient.get(API_ENDPOINTS.plate.getById(id)),
};
