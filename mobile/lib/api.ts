import { Platform } from "react-native";
import { getItem, setItem, deleteItem } from "./storage";

// Set your Render URL here after deploying, or use localhost for dev
const PROD_URL = "https://navnit-api.onrender.com"; // ← update after deploy

const BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : __DEV__
      ? "http://localhost:8000"
      : PROD_URL);

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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || data.msg || "Request failed");
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
