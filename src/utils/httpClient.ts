import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = "https://devparkingapi.kandaprojects.live";

const HttpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

HttpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("Request error:", error.message);
    return Promise.reject(error);
  }
);

HttpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.warn("Bad Request:", data);
          break;
        case 401:
          console.warn("Unauthorized:", data);
          break;
        case 403:
          console.warn("Forbidden:", data);
          break;
        case 404:
          console.warn("Not Found:", data);
          break;
        case 500:
          console.error("Server Error:", data);
          break;
        default:
          console.warn(`Error [${status}]:`, data);
      }
    } else if (error.request) {
      console.error("No response from server.");
    } else {
      console.error("Axios error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default HttpClient;
