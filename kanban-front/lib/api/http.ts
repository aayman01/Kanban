import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "./types";
import { getAccessToken } from "./token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3010/api/v1";

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isAuthCredentialRequest(url?: string) {
  if (!url) return false;
  return (
    url.includes("/public/auth/login") ||
    url.includes("/public/auth/register") ||
    url.includes("/public/auth/refresh")
  );
}

function messageFromUnknown(error: AxiosError<ApiResponse<unknown>>) {
  const status = error.response?.status ?? 0;
  if (status >= 500 || status === 0) {
    return "Something went wrong. Please try again.";
  }
  const payload = error.response?.data;
  if (payload && typeof payload === "object" && "message" in payload) {
    return String(payload.message);
  }
  return error.message || "Request failed";
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = http
      .post("/public/auth/refresh")
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;
    if (payload && typeof payload === "object" && "success" in payload) {
      if (!payload.success) {
        throw new ApiError(payload.message ?? "Request failed", response.status);
      }
      response.data = payload.data;
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status ?? 0;
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthCredentialRequest(original.url)
    ) {
      original._retry = true;
      const refreshed = await refreshSession();
      if (refreshed) {
        return http.request(original);
      }
    }

    throw new ApiError(messageFromUnknown(error), status);
  },
);
