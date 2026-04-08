// src/api/client.ts
// Единый HTTP-клиент с автоматическим refresh токена и выбросом при 401

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// In-memory хранилище токенов (не localStorage — безопаснее)
let _access:  string | null = null;
let _refresh: string | null = null;

export function setTokens(access: string, refresh: string) {
  _access  = access;
  _refresh = refresh;
}
export function clearTokens() {
  _access = _refresh = null;
}
export function getAccessToken() { return _access; }

// ── Авторизация через Telegram initData ───────────────────────────────────
export async function loginTelegram(initData: string) {
  const res  = await fetch(`${API_URL}/api/v1/auth/telegram`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ initData }),
  });
  if (!res.ok) throw new Error('Auth failed');
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.user as AuthUser;
}

// ── Авторизация через логин/пароль (для веб-панели без Telegram) ──────────
// В реальном проде добавить endpoint POST /auth/credentials
// Здесь — временный мок для dev-режима
export async function loginDev(telegramId: string) {
  // DEV ONLY: получаем токен напрямую передав telegram_id
  // Убрать в продакшне, заменить на OAuth или SSO
  const res = await fetch(`${API_URL}/api/v1/auth/dev-login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ telegramId }),
  });
  if (!res.ok) throw new Error('Dev login failed');
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.user as AuthUser;
}

// ── Core fetch с auth + auto-refresh ─────────────────────────────────────
export async function apiFetch<T = unknown>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await doFetch(_access);

  // Попытка обновить токен при 401
  if (res.status === 401 && _refresh) {
    try {
      const rr = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: _refresh }),
      });
      if (rr.ok) {
        const { accessToken } = await rr.json();
        _access = accessToken;
        res = await doFetch(_access);
      } else {
        clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } catch {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Multipart upload (для инвойсов) ──────────────────────────────────────
export async function apiUpload<T = unknown>(
  path:     string,
  formData: FormData,
): Promise<T> {
  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    formData,
    });

  let res = await doFetch(_access);

  if (res.status === 401 && _refresh) {
    const rr = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refresh }),
    });
    if (rr.ok) {
      const { accessToken } = await rr.json();
      _access = accessToken;
      res = await doFetch(_access);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Типы ──────────────────────────────────────────────────────────────────
export interface AuthUser {
  id:           number;
  telegramId:   string;
  displayName:  string;
  role:         'client' | 'manager' | 'admin';
  companyId:    number | null;
  languageCode: string;
}
