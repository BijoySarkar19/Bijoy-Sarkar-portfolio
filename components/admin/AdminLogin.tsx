"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";

export function AdminLogin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        username: form.get("username"),
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
        callbackUrl: "/admin-admin/dashboard",
      });
      if (result?.error) {
        setMessage("Those credentials did not match an admin account.");
        return;
      }
      router.replace("/admin-admin/dashboard");
      router.refresh();
    } catch {
      setMessage("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      {message ? <p className="admin-alert" role="alert">{message}</p> : null}
      <div className="field"><label htmlFor="admin-username">Username</label><input id="admin-username" name="username" autoComplete="username" required minLength={2} maxLength={64} /></div>
      <div className="field"><label htmlFor="admin-email">Email</label><input id="admin-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
      <div className="field"><label htmlFor="admin-password">Password</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={128} /></div>
      <button className="button" type="submit" disabled={pending}>{pending ? "Checking…" : "Sign in"} {pending ? <KeyRound size={14} /> : <ArrowRight size={14} />}</button>
    </form>
  );
}
