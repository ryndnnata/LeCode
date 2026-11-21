"use client";

import { useActionState } from "react";
import { KeyRound, Loader2, Lock } from "lucide-react";
import { loginAction, type ActionResult } from "@/app/actions/admin";

const initialState: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-3.5">
      <div>
        <label htmlFor="admin-password" className="label">
          Password admin
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input pl-9"
            placeholder="••••••••"
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {pending ? "Memeriksa…" : "Masuk ke dashboard"}
      </button>
    </form>
  );
}
