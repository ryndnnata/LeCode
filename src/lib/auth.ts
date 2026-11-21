import { createHmac } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "lecode_admin";

export function adminToken() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "lecode-dev-secret-change-me";
  return createHmac("sha256", secret).update("lecode-admin-session").digest("hex");
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "lecode2026";
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === adminToken();
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
