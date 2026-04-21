import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

const supabase = createClient(
  'https://hajlhrvxkpbgpxrmltfx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhamxocnZ4a3BiZ3B4cm1sdGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzI0MzgsImV4cCI6MjA5MjI0ODQzOH0.zV4ZYqwMJ2N7R_z2XnX65gL_iSED27GlI00ZfpDBKzQ'
);

function App() {
  const [activeTab, setActiveTab] = useState('products');
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#1a1a2e' }}>
      <div style={{ background: '#16213e', padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        <h1 style={{ color: '#00ff88', margin: 0, fontSize: 22 }}>🏪 ARShelf 管理コンソール</h1>
      </div>
      <div style={{ background: '#0f3460', display: 'flex', padding: '0 24px' }}>
        {[
          { key: 'products', label: '商品マスタ' },
          { key: 'shelves', label: '棚マスタ' },
          { key: 'inventory', label: '在庫' },
          { key: 'records', label: '実績' },
          { key: 'shelfchecks', label: '棚チェック履歴' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '12px 20px', border: 'none',
            background: activeTab === tab.key ? '#00ff88' : 'transparent',
            color: activeTab === tab.key ? '#000' : '#fff',
            cursor: 'pointer', fontWeight: activeTab === tab.key ? 'bold' : 'normal', fontSize: 14,
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ padding: 24 }}>
        {activeTab === 'products' && <ProductsTab supabase={supabase} />}
        {activeTab === 'shelves' && <ShelvesTab supabase={supabase} />}
        {activeTab === 'inventory' && <InventoryTab supabase={supabase} />}
        {activeTab === 'records' && <RecordsTab supabase={supabase} />}
        {activeTab === 'shelfchecks' && <ShelfChecksTab supabase={supabase} />}
      </div>
    </div>
  );
}

function ProductsTab({ supabase }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ barcode: '', name: '', price: '', initial_stock: '' });
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    setUploading(true);
    const fileName = `product_${Date.now()}.jpg`;
    await supabase.storage.from('product-images').upload(fileName, imageFile);
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setUploading(false);
    return data.publicUrl;
  };

  const handleSave = async () => {
    const imageUrl = await handleImageUpload();
    const record = {
      barcode: form.barcode, name: form.name,
      price: parseInt(form.price) || 0,
      initial_stock: parseInt(form.initial_stock) || 0,
      ...(imageUrl && { image_url: imageUrl }),
    };
    await supabase.from('products').upsert(record);
    setForm({ barcode: '', name: '', price: '', initial_stock: '' });
    setEditing(null); setImageFile(null);
    fetchProducts();
  };

  const handleEdit = (p) => {
    setEditing(p.barcode);
    setForm({ barcode: p.barcode, name: p.name, price: p.price, initial_stock: p.initial_stock });
  };

  const handleDelete = async (barcode) => {
    if (!window.confirm('削除しますか？')) return;
    await supabase.from('products').delete().eq('barcode', barcode);
    fetchProducts();
  };

  return (
    <div>
      <h2 style={{ color: '#00ff88' }}>商品マスタ</h2>
      <div style={{ background: '#16213e', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ color: '#fff', marginTop: 0 }}>{editing ? '編集' : '新規登録'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>バーコード</label>
            <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} disabled={!!editing} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>商品名</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>単価</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>期首在庫</label>
            <input type="number" value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ color: '#aaa', fontSize: 12 }}>商品画像</label>
          <div><input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ color: '#fff' }} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={uploading} style={btnStyle('#00ff88', '#000')}>
            {uploading ? 'アップロード中...' : editing ? '更新' : '登録'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm({ barcode: '', name: '', price: '', initial_stock: '' }); }} style={btnStyle('#888', '#fff')}>キャンセル</button>}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ background: '#0f3460' }}>
            {['画像', 'バーコード', '商品名', '単価', '期首在庫', '操作'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#00ff88' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.barcode} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px 12px' }}>
                {p.image_url && <img src={p.image_url} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
              </td>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{p.barcode}</td>
              <td style={{ padding: '8px 12px' }}>{p.name}</td>
              <td style={{ padding: '8px 12px' }}>¥{p.price?.toLocaleString()}</td>
              <td style={{ padding: '8px 12px' }}>{p.initial_stock}</td>
              <td style={{ padding: '8px 12px' }}>
                <button onClick={() => handleEdit(p)} style={btnStyle('#0066cc', '#fff')}>編集</button>
                <button onClick={() => handleDelete(p.barcode)} style={{ ...btnStyle('#cc0000', '#fff'), marginLeft: 4 }}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShelvesTab({ supabase }) {
  const [shelves, setShelves] = useState([]);
  const [form, setForm] = useState({ shelf_id: '', dan: '1', fixture_type: 'ゴンドラ', aisle: 'A', store_id: '' });
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchShelves(); }, []);

  const fetchShelves = async () => {
    const { data } = await supabase.from('shelves').select('*').order('shelf_id');
    setShelves(data || []);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    setUploading(true);
    const fileName = `shelf_${Date.now()}.jpg`;
    await supabase.storage.from('product-images').upload(fileName, imageFile);
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setUploading(false);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.shelf_id.match(/^\d{3}$/)) { alert('棚IDは3桁の数字で入力してください'); return; }
    if (!form.aisle.match(/^[A-Za-z]$/)) { alert('通路はアルファベット1文字で入力してください'); return; }
    const imageUrl = await handleImageUpload();
    const record = {
      shelf_id: form.shelf_id,
      dan: parseInt(form.dan),
      fixture_type: form.fixture_type,
      aisle: form.aisle.toUpperCase(),
      store_id: form.store_id,
      ...(imageUrl && { ideal_image_url: imageUrl }),
    };
    const { error } = await supabase.from('shelves').upsert(record);
    if (error) { alert('登録失敗: ' + error.message); return; }
    setForm({ shelf_id: '', dan: '1', fixture_type: 'ゴンドラ', aisle: 'A', store_id: '' });
    setEditing(null); setImageFile(null);
    fetchShelves();
  };

  const handleEdit = (s) => {
    setEditing(s.shelf_id);
    setForm({ shelf_id: s.shelf_id, dan: String(s.dan), fixture_type: s.fixture_type, aisle: s.aisle, store_id: s.store_id || '' });
  };

  const handleDelete = async (shelfId) => {
    if (!window.confirm('削除しますか？')) return;
    await supabase.from('shelves').delete().eq('shelf_id', shelfId);
    fetchShelves();
  };

  const fixtureTypes = ['ゴンドラ', '冷蔵ケース', '平台', '多段ケース'];

  return (
    <div>
      <h2 style={{ color: '#00ff88' }}>棚マスタ</h2>
      <div style={{ background: '#16213e', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ color: '#fff', marginTop: 0 }}>{editing ? '編集' : '新規登録'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>棚ID（3桁の数字）</label>
            <input placeholder="例: 001" value={form.shelf_id} onChange={e => setForm({ ...form, shelf_id: e.target.value })} disabled={!!editing} maxLength={3} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>段数</label>
            <select value={form.dan} onChange={e => setForm({ ...form, dan: e.target.value })} style={inputStyle}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>什器タイプ</label>
            <select value={form.fixture_type} onChange={e => setForm({ ...form, fixture_type: e.target.value })} style={inputStyle}>
              {fixtureTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>通路（アルファベット1文字）</label>
            <input placeholder="例: A" value={form.aisle} onChange={e => setForm({ ...form, aisle: e.target.value })} maxLength={1} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: 12 }}>店舗ID</label>
            <input placeholder="例: STORE01" value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ color: '#aaa', fontSize: 12 }}>完成画像（棚割り模範画像）</label>
          <div style={{ marginTop: 4 }}>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ color: '#fff' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={uploading} style={btnStyle('#00ff88', '#000')}>
            {uploading ? 'アップロード中...' : editing ? '更新' : '登録'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm({ shelf_id: '', dan: '1', fixture_type: 'ゴンドラ', aisle: 'A', store_id: '' }); }} style={btnStyle('#888', '#fff')}>キャンセル</button>}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ background: '#0f3460' }}>
            {['完成画像', '棚ID', '段数', '什器タイプ', '通路', '店舗ID', '操作'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#00ff88' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shelves.map(s => (
            <tr key={s.shelf_id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px 12px' }}>
                {s.ideal_image_url && <img src={s.ideal_image_url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />}
              </td>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 'bold' }}>{s.shelf_id}</td>
              <td style={{ padding: '8px 12px' }}>{s.dan}/5</td>
              <td style={{ padding: '8px 12px' }}>{s.fixture_type}</td>
              <td style={{ padding: '8px 12px' }}>{s.aisle}</td>
              <td style={{ padding: '8px 12px' }}>{s.store_id}</td>
              <td style={{ padding: '8px 12px' }}>
                <button onClick={() => handleEdit(s)} style={btnStyle('#0066cc', '#fff')}>編集</button>
                <button onClick={() => handleDelete(s.shelf_id)} style={{ ...btnStyle('#cc0000', '#fff'), marginLeft: 4 }}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryTab({ supabase }) {
  const [inventory, setInventory] = useState([]);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*, products(name, price)').order('barcode');
    setInventory(data || []);
  };

  return (
    <div>
      <h2 style={{ color: '#00ff88' }}>在庫一覧</h2>
      <button onClick={fetchInventory} style={{ ...btnStyle('#0066cc', '#fff'), marginBottom: 16 }}>更新</button>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ background: '#0f3460' }}>
            {['バーコード', '商品名', '店舗在庫', '倉庫在庫', '発注残', '更新日時'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#00ff88' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inventory.map(i => (
            <tr key={i.barcode} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{i.barcode}</td>
              <td style={{ padding: '8px 12px' }}>{i.products?.name || '-'}</td>
              <td style={{ padding: '8px 12px' }}>{i.stock}個</td>
              <td style={{ padding: '8px 12px' }}>{i.warehouse_stock}個</td>
              <td style={{ padding: '8px 12px' }}>{i.order_remaining}個</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#aaa' }}>
                {new Date(i.updated_at).toLocaleString('ja-JP')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecordsTab({ supabase }) {
  const [records, setRecords] = useState([]);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    const { data } = await supabase.from('stock_records').select('*').order('recorded_at', { ascending: false }).limit(200);
    setRecords(data || []);
  };

  const exportCsv = () => {
    const header = '日時,バーコード,商品名,種別,数量,方向,棚ID';
    const rows = records.map(r => {
      const direction = r.direction === 'TO_WAREHOUSE' ? '店舗→倉庫' : r.direction === 'TO_STORE' ? '倉庫→店舗' : '';
      return `${new Date(r.recorded_at).toLocaleString('ja-JP')},${r.barcode},${r.product_name},${r.type},${r.quantity},${direction},${r.shelf_id || ''}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `実績_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <h2 style={{ color: '#00ff88' }}>実績一覧</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={fetchRecords} style={btnStyle('#0066cc', '#fff')}>更新</button>
        <button onClick={exportCsv} style={btnStyle('#00ff88', '#000')}>CSVダウンロード</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ background: '#0f3460' }}>
            {['日時', 'バーコード', '商品名', '種別', '数量', '方向', '棚ID'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#00ff88' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#aaa' }}>
                {new Date(r.recorded_at).toLocaleString('ja-JP')}
              </td>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.barcode}</td>
              <td style={{ padding: '8px 12px' }}>{r.product_name}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  background: r.type === '実棚数' ? '#004400' : r.type === '発注登録' ? '#000044' : '#440000',
                  padding: '2px 8px', borderRadius: 4, fontSize: 12
                }}>{r.type}</span>
              </td>
              <td style={{ padding: '8px 12px' }}>{r.quantity}個</td>
              <td style={{ padding: '8px 12px', fontSize: 12 }}>
                {r.direction === 'TO_WAREHOUSE' ? '店舗→倉庫' : r.direction === 'TO_STORE' ? '倉庫→店舗' : ''}
              </td>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.shelf_id || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShelfChecksTab({ supabase }) {
  const [checks, setChecks] = useState([]);
  const [filterShelfId, setFilterShelfId] = useState('');

  useEffect(() => { fetchChecks(); }, []);

  const fetchChecks = async () => {
    let query = supabase.from('shelf_checks').select('*').order('checked_at', { ascending: false }).limit(100);
    if (filterShelfId) query = query.eq('shelf_id', filterShelfId);
    const { data } = await query;
    setChecks(data || []);
  };

  return (
    <div>
      <h2 style={{ color: '#00ff88' }}>棚チェック履歴</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input
          placeholder="棚IDで絞り込み"
          value={filterShelfId}
          onChange={e => setFilterShelfId(e.target.value)}
          style={{ ...inputStyle, width: 200 }}
        />
        <button onClick={fetchChecks} style={btnStyle('#0066cc', '#fff')}>検索</button>
        <button onClick={() => { setFilterShelfId(''); fetchChecks(); }} style={btnStyle('#888', '#fff')}>リセット</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {checks.map(c => (
          <div key={c.id} style={{ background: '#16213e', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: 16 }}>棚ID: {c.shelf_id}</span>
              <span style={{ color: '#aaa', fontSize: 12 }}>{new Date(c.checked_at).toLocaleString('ja-JP')}</span>
            </div>
            {c.shelves && (
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>
                通路{c.shelves.aisle} | {c.shelves.fixture_type} | {c.shelves.dan}/5段
              </div>
            )}
            {c.memo && <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>メモ: {c.memo}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ color: '#aaa', fontSize: 11, marginBottom: 4 }}>作業前</div>
                {c.before_image_url
                  ? <img src={c.before_image_url} alt="作業前" style={{ width: '100%', borderRadius: 4, objectFit: 'cover', maxHeight: 150 }} />
                  : <div style={{ background: '#0f3460', height: 100, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>なし</div>
                }
              </div>
              <div>
                <div style={{ color: '#aaa', fontSize: 11, marginBottom: 4 }}>作業後</div>
                {c.after_image_url
                  ? <img src={c.after_image_url} alt="作業後" style={{ width: '100%', borderRadius: 4, objectFit: 'cover', maxHeight: 150 }} />
                  : <div style={{ background: '#0f3460', height: 100, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>なし</div>
                }
              </div>
            </div>
          </div>
        ))}
      </div>
      {checks.length === 0 && (
        <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>データがありません</div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '8px 12px', background: '#0f3460', border: '1px solid #333',
  borderRadius: 4, color: '#fff', fontSize: 14, width: '100%', boxSizing: 'border-box',
};

const btnStyle = (bg, color) => ({
  padding: '8px 16px', background: bg, color: color, border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
});

export default App;