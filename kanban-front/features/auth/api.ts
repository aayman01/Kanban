import { http } from "@/lib/api/http";
import type { AuthUser } from "@/lib/api/types";
import type { AxiosRequestConfig } from "axios";

type Credentials = {
  email: string;
  password: string;
};

export async function login(body: Credentials) {
  const { data } = await http.post<AuthUser>("/public/auth/login", body);
  return data;
}

export async function register(body: Credentials) {
  const { data } = await http.post<AuthUser>("/public/auth/register", body);
  return data;
}

export async function logout() {
  const { data } = await http.post<null>("/public/auth/logout");
  return data;
}

export async function getMe(config?: AxiosRequestConfig) {
  const { data } = await http.get<AuthUser>("/user/me", config);
  return data;
}
