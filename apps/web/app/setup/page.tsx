"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";

export default function SetupPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.get("username"), password: formData.get("password"), confirmation: formData.get("confirmation") }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(result.message ?? "Không thể tạo tài khoản.");
      setSubmitting(false);
      return;
    }
    window.location.assign("/login?created=1");
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submitSetup}>
        <div className="login-brand"><span className="brand-mark">12</span><span>Week Year</span></div>
        <div><span className="eyebrow">First-time Setup</span><h1>Create Account</h1></div>
        <label className="field"><span>Tên đăng nhập</span><input name="username" autoComplete="username" inputMode="text" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={80} required autoFocus /></label>
        <label className="field"><span>Mật khẩu</span><input name="password" type="password" autoComplete="new-password" inputMode="text" autoCapitalize="none" spellCheck={false} minLength={8} maxLength={200} required /></label>
        <label className="field"><span>Nhập lại mật khẩu</span><input name="confirmation" type="password" autoComplete="new-password" inputMode="text" autoCapitalize="none" spellCheck={false} minLength={8} maxLength={200} required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button full" type="submit" disabled={submitting}><KeyRound size={18} /> {submitting ? "Đang tạo…" : "Tạo tài khoản"}</button>
      </form>
    </main>
  );
}
