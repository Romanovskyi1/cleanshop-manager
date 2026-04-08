// src/pages/LoginPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate }          from 'react-router-dom';
import { useAuthStore }         from '../store/auth';
import { loginDev, setTokens }  from '../api/client';

export function LoginPage() {
  const { login, user, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [devId,  setDevId]  = useState('');
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

        {/* Telegram кнопка — только если не в TMA */}
        {!isLoading && !(window as any).Telegram?.WebApp?.initData && (
          <div style={{
            background: '#F5F7FB', borderRadius: 10,
            padding: '16px', marginBottom: 16, fontSize: 13, color: '#9AA3B8',
          }}>
            Откройте панель через Telegram-бота.<br />
            <span style={{ color: '#1355C1', fontWeight: 500 }}>@cleanshop_manager_bot</span>
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
