"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [show, setShow] = useState(false);

  return (
    // Menutupi Navbar/Footer root layout, memakai glow latar yang sama
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-bg px-4 py-10"
      style={{
        backgroundImage: "var(--page-glow)",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-[448px] rounded-2xl border border-[#8b6dff40] bg-linear-to-b from-[#2a1f5c]/70 to-[#3b1f5c]/60 p-6 shadow-[0_20px_80px_#7c5cff30] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#8b6dff50] bg-[#5b4dff25] px-3.5 py-1.5 text-xs font-semibold text-[#c9bcff]">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
            </svg>
            Admin Portal
          </span>
          <h1 className="mb-1.5 mt-4 text-[28px] font-bold tracking-[-0.03em] text-white">
            Welcome Back
          </h1>
          <p className="m-0 text-sm text-[#cfc8ea]">
            Sign in to manage your portfolio
          </p>
        </div>

        <form action={action} className="mt-7 grid gap-5">
          <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c9c3e0]">
            Email
            <span className="flex h-[46px] items-center gap-3 rounded-xl border border-[#8b6dff40] bg-[#1a1240]/60 px-3.5 focus-within:border-[#b58aff] focus-within:shadow-[0_0_0_3px_#b58aff25]">
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="#9d93c9"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                name="email"
                type="email"
                maxLength={254}
                autoCapitalize="none"
                spellCheck={false}
                required
                autoComplete="username"
                placeholder="admin@example.com"
                className="w-full bg-transparent text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#7d74a8]"
              />
            </span>
          </label>

          <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c9c3e0]">
            Password
            <span className="flex h-[46px] items-center gap-3 rounded-xl border border-[#8b6dff40] bg-[#1a1240]/60 px-3.5 focus-within:border-[#b58aff] focus-within:shadow-[0_0_0_3px_#b58aff25]">
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="#9d93c9"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                name="password"
                type={show ? "text" : "password"}
                maxLength={128}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-transparent text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#7d74a8]"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={
                  show ? "Sembunyikan password" : "Tampilkan password"
                }
                className="cursor-pointer text-[#9d93c9] transition-colors hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {show ? (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <>
                      <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.5M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      <path d="m2 2 20 20" />
                    </>
                  )}
                </svg>
              </button>
            </span>
          </label>

          {state.error && (
            <p
              role="alert"
              className="m-0 rounded-lg border border-[#ff6e7a50] bg-[#ff6e7a15] px-3.5 py-2.5 text-[13px] text-[#ff9aa3]"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#5b4dff] to-[#b04dff] text-sm font-semibold text-white shadow-[0_10px_30px_#7c5cff40] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign In"}
            {!pending && (
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="m10 17 5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
