import axios from "axios";
import API_BASE_URL from "./api";

// Shared Axios client for requests to the WebBites backend.
// Keep per-request headers for authenticated calls and FormData uploads.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;
