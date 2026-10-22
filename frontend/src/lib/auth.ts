export type Role = "candidate" | "employer";
type AuthResult = { message?: string; user?: { id: number; email: string; role: Role }; access_token?: string };
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("iseal_access_token") : null;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const detail = data.detail; throw new Error(Array.isArray(detail) ? detail.map((item: { msg?: string }) => item.msg).join(" ") : detail || "İşlem tamamlanamadı. Lütfen tekrar deneyin."); }
  return data as T;
}
export async function submitAuth(path: "login" | "register", body: Record<string, string>): Promise<AuthResult> {
  const data = await apiRequest<AuthResult>(`/auth/${path}`, { method: "POST", body: JSON.stringify(body) });
  if (data.access_token) localStorage.setItem("iseal_access_token", data.access_token);
  return data;
}
