const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const KEYS = { token: "lqs_token", name: "lqs_name", role: "lqs_role" };

export const sessionStorageHelper = {
  read() {
    try {
      const token = localStorage.getItem(KEYS.token);
      if (!token) return null;
      return { token, name: localStorage.getItem(KEYS.name), role: localStorage.getItem(KEYS.role) };
    } catch {
      return null;
    }
  },
  write({ token, name, role }) {
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.name, name ?? "");
    localStorage.setItem(KEYS.role, role ?? "");
  },
  clear() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Small fetch wrapper. `auth: true` sends the employee JWT and signs the user out on a 401.
 * Errors always come back as ApiError with a message that is safe to show on screen.
 */
export async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const session = sessionStorageHelper.read();
    if (session) headers.Authorization = `Bearer ${session.token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Network error. Please check your connection and try again.", 0);
  }

  if (res.status === 401 && auth) {
    if (onUnauthorized) onUnauthorized();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new ApiError((data && data.message) || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export const apiUrl = (path) => `${BASE}${path}`;

/**
 * Fetches a PDF with the employee's JWT (a plain <a href> can't send an Authorization header) and
 * opens it in a new tab as a blob URL. Used for admin quotation review, where the PDF route requires
 * login, unlike the public customer-facing PDF link.
 */
export async function openAuthedPdf(path) {
  const session = sessionStorageHelper.read();
  const headers = session ? { Authorization: `Bearer ${session.token}` } : {};

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { headers });
  } catch {
    throw new ApiError("Network error. Please check your connection and try again.", 0);
  }
  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }
  if (!res.ok) {
    throw new ApiError("Could not load the PDF.", res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  // Revoke well after the new tab has had time to load it, rather than immediately.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
