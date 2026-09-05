import { AuthForm } from "@/features/auth/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
