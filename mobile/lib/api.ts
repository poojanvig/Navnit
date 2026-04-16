import { Platform } from "react-native";
import { getItem, setItem, deleteItem } from "./storage";

// Production API — change to localhost:8000 for local dev
const BASE = process.env.EXPO_PUBLIC_API_URL || "https://navnit.onrender.com";

async function getToken(): Promise<string | null> {
  try {
    return await getItem("token");
  } catch {
    return null;
  }
}

async function request<T = any>(
  path: string,
  options: {
    method?: string;
    body?: any;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      res.ok ? "Invalid response from server" : `Server error (${res.status})`
    );
  }

  if (!res.ok) {
    throw new Error(data.detail || data.msg || `Request failed (${res.status})`);
  }

  return data;
}

// --- Auth ---

export async function signup(name: string, email: string, password: string) {
  const data = await request("/api/auth/signup", {
    method: "POST",
    body: { name, email, password },
    auth: false,
  });
  await setItem("token", data.token);
  return data;
}

export async function login(email: string, password: string) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  await setItem("token", data.token);
  return data;
}

export async function getMe() {
  return request("/api/auth/me");
}

export async function logout() {
  await deleteItem("token");
}

// --- Portfolio ---

export async function requestOTP(pan: string, bo_id: string, dob: string) {
  return request("/api/portfolio/request-otp", {
    method: "POST",
    body: { pan, bo_id, dob },
  });
}

export async function verifyOTP(
  session_id: string,
  otp: string,
  num_periods: number = 6
) {
  return request("/api/portfolio/verify-otp", {
    method: "POST",
    body: { session_id, otp, num_periods },
  });
}

export async function getPortfolios() {
  return request("/api/portfolio/");
}

export async function getPortfolio(id: number) {
  return request(`/api/portfolio/${id}`);
}
