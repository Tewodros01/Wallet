import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { APP_ROUTES } from "../config/routes";
import { useAuthStore } from "../store/auth.store";
import { clearClientSession } from "./session";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (token: string) => {
  queue.forEach(({ resolve }) => resolve(token));
  queue = [];
};

const rejectQueue = (error: AxiosError) => {
  queue.forEach(({ reject }) => reject(error));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = original?.url ?? "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/telegram") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password");
    const accessToken = useAuthStore.getState().accessToken;
    const refreshToken = useAuthStore.getState().refreshToken;
    const shouldHandleUnauthorized =
      error.response?.status === 401 &&
      !original?._retry &&
      !isAuthEndpoint &&
      Boolean(accessToken) &&
      Boolean(refreshToken);

    if (shouldHandleUnauthorized) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject: (queuedError) => reject(queuedError),
          });
        });
      }

      isRefreshing = true;

      try {
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post<{
          access_token: string;
          refresh_token: string;
        }>(`${import.meta.env.VITE_API_URL as string}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        useAuthStore
          .getState()
          .setTokens(data.access_token, data.refresh_token);
        processQueue(data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        rejectQueue(error);
        clearClientSession();
        window.location.href = APP_ROUTES.signin;
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
