"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(result.message ?? "Không thể đăng nhập.");
      setSubmitting(false);
      return;
    }
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
    window.location.assign(nextPath);
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submitLogin}>
        <div className="login-brand"><span className="brand-mark">12</span><span>Week Year</span></div>
        <div><h1>Sign In</h1></div>
        <label className="field"><span>Tên đăng nhập</span><input name="username" autoComplete="username" inputMode="text" autoCapitalize="none" spellCheck={false} required autoFocus /></label>
        <label className="field"><span>Mật khẩu</span><span className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" inputMode="text" autoCapitalize="none" spellCheck={false} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button full" type="submit" disabled={submitting}><LogIn size={18} /> {submitting ? "Đang đăng nhập…" : "Đăng nhập"}</button>
      </form>
    </main>
  );
}
