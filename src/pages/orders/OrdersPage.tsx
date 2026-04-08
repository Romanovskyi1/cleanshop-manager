// src/pages/orders/OrdersPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate }          from 'react-router-dom';
import { ordersApi, Order }     from '../../api';
import { PageHeader, Card, Table, Badge, Btn, Modal, fmt } from '../../components/ui';

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [newDate,  setNewDate]  = useState('');
  const [saving,   setSaving]   = useState(false);

  const load = () =>
    ordersApi.list(filter ? { status: filter } : {})
      .then(setOrders).finally(() => setLoading(false));

  useEffect(() => { load(); }, [filter]);

  const confirmDate = async () => {
    if (!selected || !newDate) return;
    setSaving(true);
    try {
      await ordersApi.confirmDate(selected.id, newDate);
      load();
      setSelected(null);
    } finally { setSaving(false); }
  };

  const STATUSES = [
    { key: '', label: 'Все' },
    { key: 'negotiating', label: 'Согласование' },
    { key: 'confirmed',   label: 'Подтверждены' },
    { key: 'building',    label: 'Сборка паллет' },
    { key: 'locked',      label: 'Зафиксированы' },
    { key: 'shipped',     label: 'Отгружены' },
  ];

  return (
    <div>
      <PageHeader title="Заказы" sub="Управление погрузками и датами" />

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: filter === s.key ? 'none' : '0.5px solid #E8ECF4',
            background: filter === s.key ? '#0A1F3D' : '#fff',
            color: filter === s.key ? '#fff' : '#3D4660', cursor: 'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      <Card>
        <Table
          keyField="id"
          rows={orders}
          empty="Заказов нет"
          onRow={setSelected}
          columns={[
            { key: 'id',           label: '#', width: 60, render: r => `#${r.id}` },
            { key: 'companyId',    label: 'Компания', render: r => `Компания #${r.companyId}` },
            { key: 'status',       label: 'Статус', render: r => <Badge status={r.status} /> },
            { key: 'proposedDate',  label: 'Предложена', render: r => r.proposedDate ?? '—' },
            { key: 'confirmedDate', label: 'Подтверждена', render: r =>
              r.confirmedDate
                ? <span style={{ fontWeight: 500, color: '#0E8A7A' }}>{r.confirmedDate}</span>
                : <span style={{ color: '#B85C00' }}>Не согласована</span>
            },
            { key: 'totalPallets', label: 'Паллет' },
            { key: 'totalAmountEur', label: 'Сумма', render: r =>
              r.totalAmountEur ? `€ ${fmt(r.totalAmountEur)}` : '—'
            },
          ]}
        />
      </Card>

      {selected && (
        <Modal title={`Заказ #${selected.id}`} onClose={() => setSelected(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[
              ['Компания',     `#${selected.companyId}`],
              ['Статус',       <Badge status={selected.status} />],
              ['Паллет',       selected.totalPallets],
              ['Сумма',        selected.totalAmountEur ? `€ ${fmt(selected.totalAmountEur)}` : '—'],
              ['Дата предложена',   selected.proposedDate  ?? '—'],
              ['Дата подтверждена', selected.confirmedDate ?? '—'],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ background: '#F5F7FB', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 11, color: '#9AA3B8', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Подтверждение / предложение даты */}
          {['draft','negotiating','confirmed'].includes(selected.status) && (
            <div style={{ borderTop: '0.5px solid #E8ECF4', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D', marginBottom: 8 }}>
                {selected.confirmedDate ? 'Изменить дату погрузки' : 'Подтвердить / предложить дату'}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={newDate || selected.confirmedDate || selected.proposedDate || ''}
                  onChange={e => setNewDate(e.target.value)}
                  style={{ height: 36, padding: '0 12px', fontSize: 13, border: '0.5px solid #E8ECF4', borderRadius: 8, outline: 'none', flex: 1 }}
                />
                <Btn size="sm" onClick={confirmDate} disabled={!newDate || saving}>
                  {saving ? 'Сохраняем...' : 'Подтвердить'}
                </Btn>
              </div>
              <div style={{ fontSize: 11, color: '#9AA3B8', marginTop: 6 }}>
                После подтверждения клиент получит Push-уведомление и окно паллет откроется за 5 дней
              </div>
            </div>
          )}

          {selected.notes && (
            <div style={{ marginTop: 16, padding: '10px 12px', background: '#F5F7FB', borderRadius: 8, fontSize: 13, color: '#3D4660' }}>
              {selected.notes}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
