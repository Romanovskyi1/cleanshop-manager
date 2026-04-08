// src/pages/clients/ClientsPage.tsx
import { useEffect, useState } from 'react';
import { clientsApi, Company, User } from '../../api';
import { useAuthStore, isAdmin }     from '../../store/auth';
import { PageHeader, Card, Table, Badge, Btn, Modal, Input } from '../../components/ui';

export function ClientsPage() {
  const { user: me } = useAuthStore();
  const admin        = isAdmin(me);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [users,     setUsers]     = useState<User[]>([]);
  const [selected,  setSelected]  = useState<Company | null>(null);
  const [editUser,  setEditUser]  = useState<User | null>(null);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    clientsApi.companies().then(setCompanies);
    clientsApi.users().then(setUsers);
  }, []);

  const companyUsers = (companyId: number) =>
    users.filter(u => u.companyId === companyId);

  const handleRoleChange = async (u: User, role: string) => {
    setSaving(true);
    try {
      await clientsApi.updateUser(u.id, { role: role as any });
      const updated = await clientsApi.users();
      setUsers(updated);
      setEditUser(null);
    } finally { setSaving(false); }
  };

  const roleColor: Record<string, string> = {
    client: '#9AA3B8', manager: '#0E8A7A', admin: '#1355C1',
  };

  return (
    <div>
      <PageHeader title="Клиенты" sub="Компании, пользователи и роли" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Компании */}
        <Card>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #E8ECF4', fontSize: 13, fontWeight: 600, color: '#0A1F3D' }}>
            Компании ({companies.length})
          </div>
          <Table<Company>
            keyField="id"
            rows={companies}
            empty="Компаний нет"
            onRow={setSelected}
            columns={[
              { key: 'name', label: 'Название',
                render: r => <span style={{ fontWeight: 500, color: '#0A1F3D' }}>{r.name}</span> },
              { key: 'countryCode', label: 'Страна', width: 70 },
              { key: 'invoiceTerms', label: 'Условия', width: 80 },
              { key: 'isActive', label: 'Статус', width: 80,
                render: r => <Badge status={r.isActive ? 'ok' : 'cancelled'} /> },
            ]}
          />
        </Card>

        {/* Пользователи */}
        <Card>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #E8ECF4', fontSize: 13, fontWeight: 600, color: '#0A1F3D' }}>
            Пользователи ({users.length})
          </div>
          <Table<User>
            keyField="id"
            rows={users}
            empty="Пользователей нет"
            onRow={admin ? setEditUser : undefined}
            columns={[
              { key: 'displayName', label: 'Имя',
                render: r => (
                  <div>
                    <div style={{ fontWeight: 500, color: '#0A1F3D', fontSize: 13 }}>
                      {r.firstName} {r.lastName}
                    </div>
                    {r.username && <div style={{ fontSize: 11, color: '#9AA3B8' }}>@{r.username}</div>}
                  </div>
                )},
              { key: 'companyId', label: 'Компания', width: 100,
                render: r => r.companyId
                  ? companies.find(c => c.id === r.companyId)?.name.split(' ')[0] ?? `#${r.companyId}`
                  : '—' },
              { key: 'role', label: 'Роль', width: 90,
                render: r => (
                  <span style={{ fontSize: 12, fontWeight: 600, color: roleColor[r.role] ?? '#9AA3B8', textTransform: 'capitalize' }}>
                    {r.role}
                  </span>
                )},
              { key: 'isActive', label: '', width: 60,
                render: r => <Badge status={r.isActive ? 'ok' : 'cancelled'} /> },
            ]}
          />
        </Card>
      </div>

      {/* Детали компании */}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              ['ID',           selected.id],
              ['Страна',       selected.countryCode],
              ['VAT',          selected.vatNumber ?? '—'],
              ['Email',        selected.invoiceEmail ?? '—'],
              ['TG группа',    selected.telegramGroupChatId ?? 'Не настроен'],
              ['Условия',      selected.invoiceTerms],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ background: '#F5F7FB', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 11, color: '#9AA3B8', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D' }}>{String(v)}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: '#9AA3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Пользователи компании
          </div>
          {companyUsers(selected.id).map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #E8ECF4', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A1F3D' }}>{u.firstName} {u.lastName}</div>
                {u.username && <div style={{ fontSize: 11, color: '#9AA3B8' }}>@{u.username} · TG: {u.telegramId}</div>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: roleColor[u.role] ?? '#9AA3B8', textTransform: 'capitalize' }}>
                {u.role}
              </span>
            </div>
          ))}
          {companyUsers(selected.id).length === 0 && (
            <div style={{ fontSize: 13, color: '#9AA3B8' }}>Нет пользователей</div>
          )}
        </Modal>
      )}

      {/* Изменить роль пользователя */}
      {editUser && admin && (
        <Modal title={`${editUser.firstName} ${editUser.lastName}`} onClose={() => setEditUser(null)} width={380}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>Telegram ID</div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#0A1F3D' }}>{editUser.telegramId}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 8 }}>Роль</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['client','manager','admin'] as const).map(r => (
                <button key={r} onClick={() => handleRoleChange(editUser, r)}
                  disabled={saving || editUser.role === r}
                  style={{
                    flex: 1, height: 40, borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: editUser.role === r ? 'none' : '0.5px solid #E8ECF4',
                    background: editUser.role === r ? '#0A1F3D' : '#fff',
                    color: editUser.role === r ? '#fff' : '#3D4660',
                    cursor: editUser.role === r ? 'default' : 'pointer',
                    opacity: saving ? .5 : 1,
                  }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#9AA3B8' }}>
              Изменение вступит в силу при следующем входе пользователя
            </div>
          </div>

          <div style={{ background: '#FFF0D6', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#7A3C00' }}>
            ⚠ Повышение до <strong>admin</strong> даёт полный доступ включая каталог и управление другими пользователями
          </div>
        </Modal>
      )}
    </div>
  );
}
