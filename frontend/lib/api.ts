import axios from "axios";

const API_URL = "http://localhost:8000/api/v1"; // Hardcoded for MVP, ideally env var

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Dynamic import to avoid circular dependency if possible, or usually toast works fine
        const { toast } = require("sonner");

        if (error.response) {
            const { status, data } = error.response;

            // 401 Unauthorized - Token expired or invalid
            if (status === 401) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("token");
                    if (!window.location.pathname.includes("/auth")) {
                        toast.error("Session expired. Please login again.");
                        window.location.href = "/auth/login";
                    }
                }
            }

            // 403 Forbidden - Permission denied OR Credential issues
            if (status === 403) {
                // If the error message indicates a credential issue, treat it like a 401
                if (data.detail === "Could not validate credentials") {
                    if (typeof window !== "undefined") {
                        localStorage.removeItem("token");
                        window.location.href = "/auth/login";
                    }
                    return Promise.reject(error);
                }

                toast.error("⛔ Permission Denied", {
                    description: data.detail || "You do not have permission to perform this action.",
                    duration: 5000,
                    style: { background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }
                });
            }
        }
        return Promise.reject(error);
    }
);

export default api;
