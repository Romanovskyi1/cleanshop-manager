// src/pages/invoices/InvoicesPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate }                  from 'react-router-dom';
import { invoicesApi, Invoice, InvoiceDelivery } from '../../api';
import { PageHeader, Card, Table, Badge, Btn, Modal, Select, fmt } from '../../components/ui';

const CHANNEL_LABELS: Record<string, string> = {
  telegram_personal: 'TG личный',
  telegram_group:    'TG группа',
  email:             'Email',
};

export function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices,  setInvoices]  = useState<Invoice[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selected,  setSelected]  = useState<Invoice | null>(null);
  const [deliveries, setDeliveries] = useState<InvoiceDelivery[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    invoiceNumber: '', orderId: '', companyId: '',
    issuedAt: '', dueDate: '', subtotalEur: '',
    vatRate: '23', vatAmount: '', totalEur: '',
  });

  const load = () => invoicesApi.list(filter ? { status: filter } : {})
    .then(setInvoices).finally(() => setLoading(false));

  useEffect(() => { load(); }, [filter]);

  const openDetail = async (inv: Invoice) => {
    setSelected(inv);
    const d = await invoicesApi.deliveryStatus(inv.id);
    setDeliveries(d);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !form.invoiceNumber || !form.orderId) return;

    const fd = new FormData();
    fd.append('file', file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    setUploading(true);
    try {
      await invoicesApi.upload(fd);
      setShowUpload(false);
      setForm({ invoiceNumber:'', orderId:'', companyId:'', issuedAt:'', dueDate:'', subtotalEur:'', vatRate:'23', vatAmount:'', totalEur:'' });
      load();
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStatus = async (inv: Invoice, status: string) => {
    await invoicesApi.updateStatus(inv.id, status);
    load();
    if (selected?.id === inv.id) setSelected({ ...inv, status: status as any });
  };

  const handleResend = async (inv: Invoice) => {
    await invoicesApi.resend(inv.id);
    alert('Инвойс отправлен повторно во все каналы');
  };

  const calcVat = () => {
    const sub  = parseFloat(form.subtotalEur) || 0;
    const rate = parseFloat(form.vatRate) || 0;
    const vat  = +(sub * rate / 100).toFixed(2);
    const tot  = +(sub + vat).toFixed(2);
    setForm(f => ({ ...f, vatAmount: String(vat), totalEur: String(tot) }));
  };

  const filtered = invoices.filter(i =>
    !filter || i.status === filter
  );

  return (
    <div>
      <PageHeader
        title="Инвойсы"
        sub="Загрузка и авторассылка по трём каналам"
        action={<Btn onClick={() => setShowUpload(true)}>+ Загрузить инвойс</Btn>}
      />

      {/* Фильтр */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'pending', 'paid', 'overdue'].map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: filter === s ? 'none' : '0.5px solid #E8ECF4',
              background: filter === s ? '#0A1F3D' : '#fff',
              color: filter === s ? '#fff' : '#3D4660',
              cursor: 'pointer',
            }}
          >
            {s === '' ? 'Все' : s === 'pending' ? 'Ожидают' : s === 'paid' ? 'Оплачены' : 'Просрочены'}
          </button>
        ))}
      </div>

      <Card>
        <Table
          keyField="id"
          rows={filtered}
          empty="Инвойсов нет"
          onRow={openDetail}
          columns={[
            { key: 'invoiceNumber', label: 'Номер', render: r => <span style={{ fontWeight: 500, color: '#0A1F3D' }}>{r.invoiceNumber}</span> },
            { key: 'companyId',    label: 'Компания', render: r => `Компания #${r.companyId}` },
            { key: 'totalEur',     label: 'Сумма', render: r => `€ ${fmt(r.totalEur)}` },
            { key: 'dueDate',      label: 'Срок оплаты' },
            { key: 'status',       label: 'Статус', render: r => <Badge status={r.status} /> },
            { key: 'createdAt',    label: 'Создан', render: r => new Date(r.createdAt).toLocaleDateString('ru-RU') },
          ]}
        />
      </Card>

      {/* ── Детали инвойса ── */}
      {selected && (
        <Modal title={selected.invoiceNumber} onClose={() => setSelected(null)} width={580}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              ['Заказ',       `#${selected.orderId}`],
              ['Сумма',       `€ ${fmt(selected.totalEur)}`],
              ['Без НДС',     `€ ${fmt(selected.subtotalEur)}`],
              [`НДС ${selected.vatRate}%`, `€ ${fmt(selected.vatAmount)}`],
              ['Выставлен',   new Date(selected.issuedAt).toLocaleDateString('ru-RU')],
              ['Срок оплаты', selected.dueDate],
              ['Статус',      <Badge status={selected.status} />],
              ['Оплачен',     selected.paidAt ? new Date(selected.paidAt).toLocaleDateString('ru-RU') : '—'],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ background: '#F5F7FB', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 11, color: '#9AA3B8', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Каналы доставки */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9AA3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Рассылка</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {deliveries.length === 0
                ? <div style={{ fontSize: 13, color: '#9AA3B8' }}>Нет данных о рассылке</div>
                : deliveries.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: '#F5F7FB', borderRadius: 8 }}>
                    <div style={{ flex: 1, fontSize: 13, color: '#0A1F3D' }}>{CHANNEL_LABELS[d.channel] ?? d.channel}</div>
                    <Badge status={d.status} />
                    {d.errorMessage && <span style={{ fontSize: 11, color: '#C0152A' }}>{d.errorMessage}</span>}
                  </div>
                ))
              }
            </div>
          </div>

          {/* Действия */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selected.status === 'pending' && (
              <Btn size="sm" onClick={() => handleStatus(selected, 'paid')}>✓ Оплачен</Btn>
            )}
            {selected.status === 'pending' && (
              <Btn size="sm" variant="danger" onClick={() => handleStatus(selected, 'overdue')}>Просрочен</Btn>
            )}
            <Btn size="sm" variant="secondary" onClick={() => handleResend(selected)}>Переслать повторно</Btn>
            {selected.pdfUrl && (
              <Btn size="sm" variant="ghost" onClick={() => window.open(selected.pdfUrl!, '_blank')}>Скачать PDF</Btn>
            )}
          </div>
        </Modal>
      )}

      {/* ── Загрузка инвойса ── */}
      {showUpload && (
        <Modal title="Загрузить инвойс" onClose={() => setShowUpload(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* PDF файл */}
            <div>
              <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>PDF-файл *</div>
              <input type="file" accept="application/pdf" ref={fileRef}
                style={{ fontSize: 13, color: '#3D4660', width: '100%' }} />
            </div>

            {/* Поля */}
            {[
              { label: 'Номер инвойса *', key: 'invoiceNumber', placeholder: 'INV-2025-0047' },
              { label: 'ID заказа *',     key: 'orderId',       placeholder: '4' },
              { label: 'ID компании *',   key: 'companyId',     placeholder: '1' },
              { label: 'Дата выставления', key: 'issuedAt',     placeholder: '2025-03-10', type: 'date' },
              { label: 'Срок оплаты',     key: 'dueDate',       placeholder: '2025-04-09', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>{f.label}</div>
                <input
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ height: 36, padding: '0 12px', fontSize: 13, border: '0.5px solid #E8ECF4', borderRadius: 8, width: '100%', outline: 'none' }}
                />
              </div>
            ))}

            {/* Суммы */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Без НДС (EUR)', key: 'subtotalEur' },
                { label: 'Ставка НДС %',  key: 'vatRate' },
                { label: 'НДС (EUR)',      key: 'vatAmount' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: '#9AA3B8', marginBottom: 4 }}>{f.label}</div>
                  <input
                    type="number" value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    onBlur={calcVat}
                    style={{ height: 36, padding: '0 10px', fontSize: 13, border: '0.5px solid #E8ECF4', borderRadius: 8, width: '100%', outline: 'none' }}
                  />
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>Итого (EUR)</div>
              <input
                type="number" value={form.totalEur}
                onChange={e => setForm(p => ({ ...p, totalEur: e.target.value }))}
                style={{ height: 36, padding: '0 12px', fontSize: 14, fontWeight: 600, border: '0.5px solid #1355C1', borderRadius: 8, width: '100%', outline: 'none', color: '#0A1F3D' }}
              />
            </div>

            <div style={{ background: '#D4F5F0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#085041' }}>
              После загрузки инвойс автоматически отправится клиенту в:<br />
              <strong>Telegram (личный) · Telegram (групповой) · Email</strong>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setShowUpload(false)}>Отмена</Btn>
              <Btn onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Загружаем...' : 'Загрузить и отправить'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
