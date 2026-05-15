// src/pages/LoginPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate }          from 'react-router-dom';
import { useAuthStore }         from '../store/auth';
import { loginDev, loginCredentials, setTokens }  from '../api/client';

export function LoginPage() {
  const { login, user, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [devId,    setDevId]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credErr,  setCredErr]  = useState('');
  const [credLoad, setCredLoad] = useState(false);
  const isDev = import.meta.env.DEV;

  // Если открыто в Telegram — авторизуемся автоматически
  useEffect(() => {
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.initData) {
      twa.ready();
      login(twa.initData);
    }
  }, []);

  // После успешного входа — редирект
  useEffect(() => {
    if (user) navigate('/manager', { replace: true });
  }, [user]);

  const handleCredLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setCredErr('');
    setCredLoad(true);
    try {
      const u = await loginCredentials(username.trim(), password.trim());
      useAuthStore.getState().setUser(u);
    } catch (e: unknown) {
      setCredErr(e instanceof Error ? e.message : 'Ошибка входа');
    } finally {
      setCredLoad(false);
    }
  };

  const handleDevLogin = async () => {
    if (!devId.trim()) return;
    try {
      const u = await loginDev(devId.trim());
      useAuthStore.getState().setUser(u);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0A1F3D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        padding: '40px 36px', width: 380,
        textAlign: 'center',
      }}>
        {/* Логотип */}
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: '#1355C1', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff',
        }}>CS</div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#0A1F3D', marginBottom: 4 }}>
          CleanShop B2B
        </div>
        <div style={{ fontSize: 14, color: '#9AA3B8', marginBottom: 32 }}>
          Панель менеджера
        </div>

        {isLoading && (
          <div style={{ fontSize: 14, color: '#9AA3B8', marginBottom: 16 }}>
            Авторизация через Telegram...
          </div>
        )}

        {error && (
          <div style={{
            background: '#FFE5E8', borderRadius: 8,
            padding: '10px 14px', fontSize: 13,
            color: '#C0152A', marginBottom: 16, textAlign: 'left',
          }}>
            {error}
          </div>
        )}

        {/* Форма логин/пароль — если не в TMA */}
        {!isLoading && !(window as any).Telegram?.WebApp?.initData && (
          <div>
            {credErr && (
              <div style={{
                background: '#FFE5E8', borderRadius: 8,
                padding: '10px 14px', fontSize: 13,
                color: '#C0152A', marginBottom: 12, textAlign: 'left',
              }}>
                {credErr}
              </div>
            )}
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Логин"
              autoComplete="username"
              onKeyDown={e => e.key === 'Enter' && handleCredLogin()}
              style={{
                width: '100%', height: 42, padding: '0 12px', fontSize: 14,
                border: '0.5px solid #E8ECF4', borderRadius: 8,
                outline: 'none', color: '#3D4660', marginBottom: 10,
                boxSizing: 'border-box',
              }}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Пароль"
              autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handleCredLogin()}
              style={{
                width: '100%', height: 42, padding: '0 12px', fontSize: 14,
                border: '0.5px solid #E8ECF4', borderRadius: 8,
                outline: 'none', color: '#3D4660', marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleCredLogin}
              disabled={credLoad}
              style={{
                width: '100%', height: 44, background: '#1355C1',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 600, cursor: credLoad ? 'default' : 'pointer',
                opacity: credLoad ? 0.7 : 1,
              }}
            >
              {credLoad ? 'Вход...' : 'Войти'}
            </button>
          </div>
        )}

        {/* Dev-вход (только в DEV-режиме) */}
        {isDev && (
          <div style={{ borderTop: '0.5px solid #E8ECF4', paddingTop: 20, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#9AA3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Dev-режим — войти по Telegram ID
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={devId}
                onChange={e => setDevId(e.target.value)}
                placeholder="987654321 (менеджер)"
                onKeyDown={e => e.key === 'Enter' && handleDevLogin()}
                style={{
                  flex: 1, height: 36, padding: '0 12px', fontSize: 13,
                  border: '0.5px solid #E8ECF4', borderRadius: 8,
                  outline: 'none', color: '#3D4660',
                }}
              />
              <button onClick={handleDevLogin} style={{
                height: 36, padding: '0 16px', background: '#0A1F3D',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>Войти</button>
            </div>
            <div style={{ fontSize: 11, color: '#9AA3B8', marginTop: 6 }}>
              Менеджер: 987654321 · Клиент: 123456789
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
