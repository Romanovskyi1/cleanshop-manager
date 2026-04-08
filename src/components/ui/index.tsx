// src/components/ui/index.tsx
// Переиспользуемые компоненты — карточки, таблица, badge, кнопка, модалка

import React from 'react';

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label:  string;
  value:  string | number;
  sub?:   string;
  color?: 'blue' | 'teal' | 'amber' | 'red';
  onClick?: () => void;
}

const colorMap = {
  blue:  { bg: '#D8E8FF', text: '#0C447C', num: '#1355C1' },
  teal:  { bg: '#D4F5F0', text: '#085041', num: '#0E8A7A' },
  amber: { bg: '#FFF0D6', text: '#7A3C00', num: '#B85C00' },
  red:   { bg: '#FFE5E8', text: '#8B0E1C', num: '#C0152A' },
};

export function StatCard({ label, value, sub, color = 'blue', onClick }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '0.5px solid #E8ECF4',
        borderRadius: 12,
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s',
      }}
    >
      <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: c.num, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9AA3B8', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
type BadgeVariant =
  | 'pending' | 'paid' | 'overdue' | 'cancelled'
  | 'draft' | 'negotiating' | 'confirmed' | 'building' | 'locked' | 'shipped'
  | 'sent' | 'failed' | 'ok' | 'low' | 'out'
  | string;

const badgeStyles: Record<string, { bg: string; color: string; label: string }> = {
  // Invoice
  pending:     { bg: '#FFF0D6', color: '#B85C00', label: 'Ожидает' },
  paid:        { bg: '#D4F5F0', color: '#085041', label: 'Оплачен' },
  overdue:     { bg: '#FFE5E8', color: '#C0152A', label: 'Просрочен' },
  cancelled:   { bg: '#E8ECF4', color: '#3D4660', label: 'Отменён' },
  // Order
  draft:       { bg: '#E8ECF4', color: '#3D4660', label: 'Черновик' },
  negotiating: { bg: '#FFF0D6', color: '#B85C00', label: 'Согласование' },
  confirmed:   { bg: '#D8E8FF', color: '#0C447C', label: 'Подтверждён' },
  building:    { bg: '#FFE5E8', color: '#C0152A', label: 'Сборка паллет' },
  locked:      { bg: '#E8ECF4', color: '#3D4660', label: 'Зафиксирован' },
  shipped:     { bg: '#0A1F3D', color: '#fff',    label: 'Отгружен' },
  // Delivery
  sent:        { bg: '#D4F5F0', color: '#085041', label: 'Доставлен' },
  failed:      { bg: '#FFE5E8', color: '#C0152A', label: 'Ошибка' },
  // Stock
  ok:          { bg: '#D4F5F0', color: '#085041', label: 'В наличии' },
  low:         { bg: '#FFF0D6', color: '#B85C00', label: 'Мало' },
  out:         { bg: '#FFE5E8', color: '#C0152A', label: 'Нет' },
};

export function Badge({ status }: { status: BadgeVariant }) {
  const s = badgeStyles[status] ?? { bg: '#E8ECF4', color: '#3D4660', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?:    'sm' | 'md';
}

const btnVariants = {
  primary:   { bg: '#1355C1', color: '#fff',    border: 'none' },
  secondary: { bg: 'transparent', color: '#1355C1', border: '0.5px solid #1355C1' },
  danger:    { bg: 'transparent', color: '#C0152A', border: '0.5px solid #C0152A' },
  ghost:     { bg: '#F5F7FB', color: '#3D4660', border: '0.5px solid #E8ECF4' },
};

export function Btn({ variant = 'primary', size = 'md', children, style, ...props }: BtnProps) {
  const v = btnVariants[variant];
  const h = size === 'sm' ? 32 : 40;
  const px = size === 'sm' ? 12 : 18;
  const fs = size === 'sm' ? 12 : 13;
  return (
    <button
      {...props}
      style={{
        height: h, padding: `0 ${px}px`, fontSize: fs,
        fontWeight: 500, borderRadius: 20,
        background: v.bg, color: v.color,
        border: v.border, cursor: 'pointer',
        transition: 'opacity .15s',
        opacity: props.disabled ? .45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
interface Column<T> {
  key:     string;
  label:   string;
  width?:  number | string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns:  Column<T>[];
  rows:     T[];
  onRow?:   (row: T) => void;
  keyField: keyof T;
  empty?:   string;
}

export function Table<T>({ columns, rows, onRow, keyField, empty }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F5F7FB', borderBottom: '0.5px solid #E8ECF4' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                padding: '10px 14px', textAlign: 'left',
                fontSize: 11, fontWeight: 600, color: '#9AA3B8',
                textTransform: 'uppercase', letterSpacing: '.06em',
                width: c.width,
              }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{
                padding: '32px', textAlign: 'center',
                fontSize: 13, color: '#9AA3B8',
              }}>
                {empty ?? 'Нет данных'}
              </td>
            </tr>
          )}
          {rows.map(row => (
            <tr
              key={String(row[keyField])}
              onClick={() => onRow?.(row)}
              style={{
                borderBottom: '0.5px solid #E8ECF4',
                cursor: onRow ? 'pointer' : 'default',
                transition: 'background .12s',
              }}
              onMouseEnter={e => { if (onRow) (e.currentTarget as HTMLElement).style.background = '#F5F7FB'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              {columns.map(c => (
                <td key={c.key} style={{ padding: '11px 14px', fontSize: 13, color: '#3D4660' }}>
                  {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: React.ReactNode;
  width?:   number;
}

export function Modal({ title, onClose, children, width = 520 }: ModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,31,61,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14,
        width, maxHeight: '90vh',
        overflow: 'auto', padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A1F3D' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#9AA3B8', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0A1F3D', margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: '#9AA3B8', margin: '4px 0 0' }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #E8ECF4',
      borderRadius: 12, overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        height: 36, padding: '0 12px', fontSize: 13,
        border: '0.5px solid #E8ECF4', borderRadius: 8,
        outline: 'none', width: '100%', color: '#3D4660',
        background: '#fff',
        ...props.style,
      }}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        height: 36, padding: '0 10px', fontSize: 13,
        border: '0.5px solid #E8ECF4', borderRadius: 8,
        background: '#fff', color: '#3D4660',
        outline: 'none', cursor: 'pointer',
        ...props.style,
      }}
    />
  );
}

export function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
