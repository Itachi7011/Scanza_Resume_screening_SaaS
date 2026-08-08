import axios from "axios";

const instance = axios.create({
  baseURL: "", // relative — requests go through Next.js rewrites to the right backend service
  withCredentials: true, // send/receive the httpOnly auth cookies
  timeout: 30_000,
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh a refresh-token request itself (would loop forever).
    const isAuthRoute = originalRequest?.url?.includes("/api/auth/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another request already triggered a refresh — wait for it instead
        // of firing a second concurrent refresh call.
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(instance(originalRequest)));
        });
      }

      isRefreshing = true;
      try {
        await instance.post("/api/auth/refresh");
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return instance(originalRequest);
      } catch (refreshError) {
        pendingQueue = [];
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
