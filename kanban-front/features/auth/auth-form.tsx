"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/http";
import { useAuth } from "@/features/auth/use-auth";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type Mode = "login" | "register";

type Props = {
  mode: Mode;
};

export function AuthForm({ mode }: Props) {
  const { status, login, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setPending(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      router.replace("/");
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  if (status === "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <Link
        href="/"
        className="mb-8 flex items-center justify-center rounded-xl bg-card text-2xl font-bold px-2"
      >
        Kanban<span className="text-primary">App</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6">
        <h1 className="text-lg font-semibold">
          {isLogin ? "Log in" : "Create an account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? "Welcome back." : "Start organizing work."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            suffix={
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((open) => !open)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            }
          />
          {error ? <p className="text-sm text-[#E07A5F]">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Please wait…"
              : isLogin
                ? "Log in"
                : "Sign up"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isLogin ? "No account? " : "Already have an account? "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="text-foreground hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
