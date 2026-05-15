// src/pages/catalog/CatalogPage.tsx
import { useEffect, useState } from 'react';
import { catalogApi, Product, RawProduct } from '../../api';
import { useAuthStore, isAdmin } from '../../store/auth';
import { PageHeader, Card, Table, Badge, Btn, Modal, Input, fmt } from '../../components/ui';

const CATEGORIES = ['gel','powder','concentrate','tablet','spray'];
const LANGS      = ['ru','en','de','pl'];

function emptyForm() {
  return {
    sku: '', category: 'gel',
    name: { ru:'', en:'', de:'', pl:'' },
    description: { ru:'', en:'', de:'', pl:'' },
    priceEur: '', unitsPerBox: '24', boxesPerPallet: '40',
    palletWeightKg: '', boxWeightKg: '',
    stockPallets: '0', isEco: false, isHit: false, isNew: false,
    certifications: '',
  };
}

export function CatalogPage() {
  const { user }   = useAuthStore();
  const admin      = isAdmin(user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<RawProduct | null>(null);
  const [form,     setForm]     = useState(emptyForm());
  const [saving,   setSaving]   = useState(false);
  const [stockId,    setStockId]    = useState<number | null>(null);
  const [stockVal,   setStockVal]   = useState('');
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null);

  const load = () =>
    catalogApi.list({ limit: '100', ...(search ? { search } : {}), ...(catFilter ? { category: catFilter } : {}) })
      .then(r => setProducts(r.items))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [search, catFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = async (p: Product) => {
    setLoadingEdit(p.id);
    try {
      const raw = await catalogApi.getRaw(p.id);
      setEditing(raw);
      setForm({
        sku:            raw.sku,
        category:       raw.category,
        name:           { ru: raw.name.ru??'', en: raw.name.en??'', de: raw.name.de??'', pl: raw.name.pl??'' },
        description:    { ru: raw.description?.ru??'', en: raw.description?.en??'', de: raw.description?.de??'', pl: raw.description?.pl??'' },
        priceEur:       String(raw.priceEur),
        unitsPerBox:    String(raw.unitsPerBox),
        boxesPerPallet: String(raw.boxesPerPallet),
        palletWeightKg: String(raw.palletWeightKg ?? ''),
        boxWeightKg:    String(raw.boxWeightKg ?? ''),
        stockPallets:   String(raw.stockPallets),
        isEco:  raw.isEco, isHit: raw.isHit, isNew: raw.isNew,
        certifications: raw.certifications.join(', '),
      });
      setShowForm(true);
    } catch (e: any) { alert(e.message); }
    finally { setLoadingEdit(null); }
  };

  const save = async () => {
    console.log('[save] called, editing=', editing?.id, 'form=', JSON.stringify({ boxWeightKg: form.boxWeightKg }));
    setSaving(true);
    try {
      const body = {
        category:       form.category,
        name:           form.name,
        description:    form.description,
        priceEur:       parseFloat(form.priceEur),
        unitsPerBox:    parseInt(form.unitsPerBox),
        boxesPerPallet: parseInt(form.boxesPerPallet),
        palletWeightKg: form.palletWeightKg ? parseFloat(form.palletWeightKg) : undefined,
        boxWeightKg:    form.boxWeightKg    ? parseFloat(form.boxWeightKg)    : undefined,
        stockPallets:   parseInt(form.stockPallets),
        isEco:  form.isEco, isHit: form.isHit, isNew: form.isNew,
        certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editing) await catalogApi.update(editing.id, body);
      else         await catalogApi.create(body);
      setShowForm(false);
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const updateStock = async () => {
    if (!stockId) return;
    await catalogApi.updateStock(stockId, parseInt(stockVal));
    setStockId(null);
    load();
  };

  const hide = async (id: number) => {
    if (!confirm('Скрыть товар из каталога?')) return;
    await catalogApi.remove(id);
    load();
  };

  const setN = (k: keyof ReturnType<typeof emptyForm>, v: any) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader
        title="Каталог товаров"
        sub={admin ? 'Управление ценами, остатками, составом' : 'Обновление остатков'}
        action={admin ? <Btn onClick={openCreate}>+ Добавить товар</Btn> : undefined}
      />

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <Input
          placeholder="Поиск по SKU или названию..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ height: 36, padding: '0 10px', fontSize: 13, border: '0.5px solid #E8ECF4', borderRadius: 8, background: '#fff', color: '#3D4660', outline: 'none' }}>
          <option value="">Все категории</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card>
        <Table<Product>
          keyField="id"
          rows={products}
          empty="Товаров не найдено"
          columns={[
            { key: 'sku',      label: 'SKU',    width: 120,
              render: r => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#0A1F3D' }}>{r.sku}</span> },
            { key: 'name',     label: 'Название',
              render: r => <span style={{ fontWeight: 500, color: '#0A1F3D' }}>{r.name || r.sku}</span> },
            { key: 'category', label: 'Категория', width: 110 },
            { key: 'priceEur', label: 'Цена/шт', width: 100,
              render: r => `€ ${fmt(r.priceEur)}` },
            { key: 'stockPallets', label: 'Остаток', width: 100,
              render: r => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Badge status={r.stockStatus} />
                  <span style={{ fontSize: 12, color: '#9AA3B8' }}>{r.stockPallets} пал</span>
                </div>
              )},
            { key: 'isEco', label: 'ЭКО', width: 60,
              render: r => r.isEco ? <span style={{ color: '#0E8A7A', fontWeight: 600 }}>✓</span> : '—' },
            { key: 'actions', label: '', width: 160,
              render: r => (
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <Btn size="sm" variant="ghost"
                    onClick={() => { setStockId(r.id); setStockVal(String(r.stockPallets)); }}>
                    Остаток
                  </Btn>
                  {admin && (
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(r)} disabled={loadingEdit === r.id}>
                      {loadingEdit === r.id ? '...' : 'Ред.'}
                    </Btn>
                  )}
                  {admin && <Btn size="sm" variant="danger" onClick={() => hide(r.id)}>Скрыть</Btn>}
                </div>
              )},
          ]}
        />
      </Card>

      {/* Обновить остаток */}
      {stockId !== null && (
        <Modal title="Обновить остаток" onClose={() => setStockId(null)} width={340}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>Паллет на складе</div>
            <Input type="number" value={stockVal} onChange={e => setStockVal(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setStockId(null)}>Отмена</Btn>
            <Btn onClick={updateStock}>Сохранить</Btn>
          </div>
        </Modal>
      )}

      {/* Создать / редактировать товар */}
      {showForm && (
        <Modal title={editing ? `Редактировать ${editing.sku}` : 'Новый товар'} onClose={() => setShowForm(false)} width={620}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>

            {/* SKU + категория */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>SKU *</div>
                <Input value={form.sku} onChange={e => setN('sku', e.target.value)} placeholder="GC-028-5L" disabled={!!editing} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>Категория *</div>
                <select value={form.category} onChange={e => setN('category', e.target.value)}
                  style={{ height: 36, padding: '0 10px', fontSize: 13, border: '0.5px solid #E8ECF4', borderRadius: 8, width: '100%', background: '#fff', color: '#3D4660', outline: 'none' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Названия по языкам */}
            <div>
              <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 6 }}>Название (мультиязычное) *</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LANGS.map(lang => (
                  <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, fontSize: 12, fontWeight: 600, color: '#9AA3B8', textTransform: 'uppercase' }}>{lang}</span>
                    <Input
                      value={form.name[lang as keyof typeof form.name]}
                      onChange={e => setN('name', { ...form.name, [lang]: e.target.value })}
                      placeholder={`Название на ${lang}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Цена и кратность */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Цена EUR/шт *', key: 'priceEur' },
                { label: 'Штук в коробке *', key: 'unitsPerBox' },
                { label: 'Коробок на паллете *', key: 'boxesPerPallet' },
                { label: 'Вес паллеты кг', key: 'palletWeightKg' },
                { label: 'Вес коробки кг', key: 'boxWeightKg' },
                { label: 'Остаток (паллет)', key: 'stockPallets' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: '#9AA3B8', marginBottom: 4 }}>{f.label}</div>
                  <Input type="number" value={(form as any)[f.key]} onChange={e => setN(f.key as any, e.target.value)} />
                </div>
              ))}
            </div>

            {/* Флаги */}
            <div style={{ display: 'flex', gap: 20 }}>
              {[['isEco','ЭКО'],['isHit','Хит'],['isNew','Новинка']].map(([k,l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#3D4660' }}>
                  <input type="checkbox" checked={(form as any)[k]}
                    onChange={e => setN(k as any, e.target.checked)} />
                  {l}
                </label>
              ))}
            </div>

            {/* Фото товара */}
            {editing && (
              <div>
                <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 6 }}>Фото товара (jpeg/png/webp, до 5 шт)</div>
                {editing.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {editing.images.map((url, i) => (
                      <img key={i} src={import.meta.env.VITE_API_URL + url}
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '0.5px solid #E8ECF4' }} />
                    ))}
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                  onChange={async e => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    try {
                      await catalogApi.uploadImages(editing.id, files);
                      const refreshed = await catalogApi.getRaw(editing.id);
                      setEditing(refreshed);
                      load();
                    } catch (err: any) { alert(err.message); }
                  }}
                  style={{ fontSize: 12, color: '#3D4660' }} />
              </div>
            )}
            {/* Сертификаты */}
            <div>
              <div style={{ fontSize: 12, color: '#9AA3B8', marginBottom: 4 }}>Сертификаты (через запятую)</div>
              <Input value={form.certifications} onChange={e => setN('certifications', e.target.value)} placeholder="EU Ecolabel, Vegan, Phosphate-free" />
            </div>

            {/* Предпросмотр цен */}
            {form.priceEur && form.unitsPerBox && form.boxesPerPallet && (
              <div style={{ background: '#D8E8FF', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#0C447C' }}>
                <span style={{ fontWeight: 600 }}>Предпросмотр:</span>
                {' '}€ {fmt(parseFloat(form.priceEur))} / шт
                {' · '}€ {fmt(parseFloat(form.priceEur) * parseInt(form.unitsPerBox))} / кор
                {' · '}€ {fmt(parseFloat(form.priceEur) * parseInt(form.unitsPerBox) * parseInt(form.boxesPerPallet))} / паллета
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '0.5px solid #E8ECF4' }}>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Отмена</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
