import { AuthForm } from "@/features/auth/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
