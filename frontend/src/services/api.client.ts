import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
            ...options.headers 
        }
    });

    if (!response.ok) {
        const body = await response.json().catch(() => (null));
        throw new ApiError(response.status, body?.message ?? "Request Failed");
    }
    return response.json() as Promise<T>;
}