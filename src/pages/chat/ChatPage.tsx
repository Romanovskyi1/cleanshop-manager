// src/pages/chat/ChatPage.tsx
import { useEffect, useState, useRef } from 'react';
import { io, Socket }                  from 'socket.io-client';
import { clientsApi, chatApi, Company, ChatMessage } from '../../api';
import { getAccessToken }              from '../../api/client';
import { PageHeader, Btn }             from '../../components/ui';

const SENDER_LABELS: Record<string, { name: string; color: string }> = {
  client:  { name: 'Клиент',        color: '#1355C1' },
  manager: { name: 'Менеджер',       color: '#0E8A7A' },
  ai:      { name: 'ИИ-ассистент',   color: '#9AA3B8' },
};

export function ChatPage() {
  const [companies,  setCompanies]  = useState<Company[]>([]);
  const [activeId,   setActiveId]   = useState<number | null>(null);
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [text,       setText]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [mode,       setMode]       = useState<'ai' | 'human'>('ai');
  const [socket,     setSocket]     = useState<Socket | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<number | null>(null);

  // Синхронизируем ref с activeId (для замыканий в WebSocket)
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Начальная загрузка компаний и статуса
  useEffect(() => {
    clientsApi.companies().then(setCompanies);
    chatApi.status().then(s => setMode(s.mode));
  }, []);

  // WebSocket — один раз при монтировании
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const API_URL = (import.meta as any).env?.VITE_API_URL ?? '';
    const s = io(`${API_URL}/chat`, {
      auth:       { token },
      transports: ['websocket', 'polling'],
    });

    s.on('message:new', (data: ChatMessage & { companyId?: number }) => {
      const msgCompanyId = data.companyId ?? activeIdRef.current;
      setMessages(prev => {
        if (msgCompanyId === activeIdRef.current) return [...prev, data];
        return prev;
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    s.on('chat:status', ({ mode: m }: { mode: 'ai' | 'human' }) => {
      setMode(m);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // Загрузка истории при смене активной компании
  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    chatApi.history(activeId).then(msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }, [activeId]);

  const send = async () => {
    if (!activeId || !text.trim()) return;
    setSending(true);
    try {
      await chatApi.reply(activeId, text.trim());
      setText('');
      try {
        const msgs = await chatApi.history(activeId);
        setMessages(msgs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      } catch { /* WebSocket мог уже обновить */ }
    } finally { setSending(false); }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 0 }}>

      {/* Список компаний */}
      <div style={{ width: 240, borderRight: '0.5px solid #E8ECF4', background: '#fff', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #E8ECF4' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9AA3B8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Клиенты</div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: mode === 'human' ? '#0E8A7A' : '#9AA3B8',
            }} />
            <span style={{ fontSize: 11, color: '#9AA3B8' }}>
              {mode === 'human' ? 'Рабочее время' : 'ИИ-режим'}
            </span>
          </div>
        </div>
        {companies.map(c => (
          <div
            key={c.id}
            onClick={() => setActiveId(c.id)}
            style={{
              padding: '10px 14px',
              background: activeId === c.id ? '#F5F7FB' : '#fff',
              borderBottom: '0.5px solid #F5F7FB',
              cursor: 'pointer',
              borderLeft: activeId === c.id ? '2px solid #1355C1' : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{c.name}</div>
            </div>
            <div style={{ fontSize: 11, color: '#9AA3B8', marginTop: 2 }}>{c.countryCode} · {c.invoiceTerms}</div>
          </div>
        ))}
      </div>

      {/* Область сообщений */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F5F7FB' }}>
        {!activeId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA3B8', fontSize: 14 }}>
            Выберите клиента слева
          </div>
        ) : (
          <>
            <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '0.5px solid #E8ECF4', fontSize: 13, fontWeight: 500, color: '#0A1F3D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{companies.find(c => c.id === activeId)?.name ?? `Компания #${activeId}`}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: socket?.connected ? '#0E8A7A' : '#E8ECF4' }} />
                <span style={{ fontSize: 11, color: '#9AA3B8' }}>{socket?.connected ? 'Live' : 'Offline'}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map(msg => {
                const isOut = msg.senderType === 'manager';
                const s = SENDER_LABELS[msg.senderType];
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: 10, color: '#9AA3B8', marginBottom: 2, paddingLeft: isOut ? 0 : 4 }}>
                      <span style={{ color: s.color, fontWeight: 500 }}>{s.name}</span>
                      {' · '}{new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{
                      maxWidth: 360,
                      padding: '8px 12px',
                      borderRadius: isOut ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: isOut ? '#1355C1' : '#fff',
                      color: isOut ? '#fff' : '#3D4660',
                      fontSize: 13, lineHeight: 1.5,
                      border: isOut ? 'none' : '0.5px solid #E8ECF4',
                    }}>
                      {msg.text}
                    </div>
                    {msg.intent && msg.intent !== 'informational' && (
                      <div style={{ fontSize: 10, color: '#9AA3B8', marginTop: 2 }}>
                        intent: {msg.intent}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '10px 16px', background: '#fff', borderTop: '0.5px solid #E8ECF4', display: 'flex', gap: 8 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Написать сообщение... (Enter — отправить)"
                rows={2}
                style={{ flex: 1, resize: 'none', padding: '8px 12px', fontSize: 13, border: '0.5px solid #E8ECF4', borderRadius: 8, outline: 'none', fontFamily: 'inherit', color: '#3D4660' }}
              />
              <Btn onClick={send} disabled={!text.trim() || sending} style={{ alignSelf: 'flex-end' }}>
                {sending ? '...' : 'Отправить'}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
