// src/pages/dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { ordersApi, invoicesApi, Order, Invoice } from '../../api';
import { StatCard, Badge, Card, PageHeader, fmt } from '../../components/ui';

export function DashboardPage() {
  const navigate = useNavigate();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      ordersApi.list(),
      invoicesApi.list(),
    ]).then(([o, i]) => {
      setOrders(o);
      setInvoices(i);
    }).finally(() => setLoading(false));
  }, []);

  const activeOrders    = orders.filter(o => !['shipped','cancelled'].includes(o.status));
  const needAction      = orders.filter(o => o.status === 'building');
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const totalPending    = pendingInvoices.reduce((s,i) => s + Number(i.totalEur), 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  if (loading) return <div style={{ padding: 40, color: '#9AA3B8', textAlign: 'center' }}>Загрузка...</div>;

  return (
    <div>
      <PageHeader title="Дашборд" sub="Обзор операций" />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard
          label="Активных заказов"
          value={activeOrders.length}
          sub={`${needAction.length} требуют действия`}
          color="blue"
          onClick={() => navigate('/manager/orders')}
        />
        <StatCard
          label="Инвойсов к оплате"
          value={pendingInvoices.length}
          sub={`€ ${fmt(totalPending)}`}
          color="amber"
          onClick={() => navigate('/manager/invoices')}
        />
        <StatCard
          label="Просроченных"
          value={overdueInvoices.length}
          color={overdueInvoices.length > 0 ? 'red' : 'teal'}
          onClick={() => navigate('/manager/invoices?status=overdue')}
        />
        <StatCard
          label="Сборка паллет"
          value={needAction.length}
          sub="ждут распределения"
          color={needAction.length > 0 ? 'amber' : 'teal'}
          onClick={() => navigate('/manager/orders?status=building')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Срочные заказы */}
        <Card>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #E8ECF4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A1F3D' }}>Требуют действия</div>
            <span style={{ fontSize: 11, color: '#1355C1', cursor: 'pointer' }} onClick={() => navigate('/manager/orders')}>Все заказы →</span>
          </div>
          {needAction.length === 0
            ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#9AA3B8' }}>Нет срочных задач ✓</div>
            : needAction.slice(0, 5).map(o => (
              <div
                key={o.id}
                onClick={() => navigate(`/manager/orders/${o.id}`)}
                style={{ padding: '10px 16px', borderBottom: '0.5px solid #E8ECF4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D' }}>Погрузка #{o.id}</div>
                  <div style={{ fontSize: 11, color: '#9AA3B8', marginTop: 2 }}>
                    {o.confirmedDate ?? 'Дата не согласована'} · {o.totalPallets} паллет
                  </div>
                </div>
                <Badge status={o.status} />
              </div>
            ))
          }
        </Card>

        {/* Последние инвойсы */}
        <Card>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #E8ECF4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A1F3D' }}>Последние инвойсы</div>
            <span style={{ fontSize: 11, color: '#1355C1', cursor: 'pointer' }} onClick={() => navigate('/manager/invoices')}>Все →</span>
          </div>
          {invoices.slice(0, 5).map(inv => (
            <div
              key={inv.id}
              onClick={() => navigate(`/manager/invoices/${inv.id}`)}
              style={{ padding: '10px 16px', borderBottom: '0.5px solid #E8ECF4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D' }}>{inv.invoiceNumber}</div>
                <div style={{ fontSize: 11, color: '#9AA3B8', marginTop: 2 }}>
                  € {fmt(inv.totalEur)} · до {inv.dueDate}
                </div>
              </div>
              <Badge status={inv.status} />
            </div>
          ))}
          {invoices.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#9AA3B8' }}>Инвойсов пока нет</div>
          )}
        </Card>

      </div>
    </div>
  );
}
