const TOKEN_KEY = "oss_access_token";
const SESSION_KEY = "oss_session_token";
const USER_KEY = "oss_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession({ accessToken, sessionToken, user }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (sessionToken) localStorage.setItem(SESSION_KEY, sessionToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || "request failed");
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export async function apiUpload(path, file) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, { method: "PUT", headers, body: file });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "upload failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}
