import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api';
import { useToast } from '../App';

const EMPTY_FORM = { name: '', sku: '', description: '', price: '', category: '', initial_stock: 0, low_stock_threshold: 10 };

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | product obj
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');

  const load = () => getProducts().then(setProducts).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setErr(''); setModal('create'); };
  const openEdit   = (p)  => { setForm({ name: p.name, sku: p.sku, description: p.description || '', price: p.price, category: p.category || '', initial_stock: p.inventory?.quantity ?? 0, low_stock_threshold: p.inventory?.low_stock_threshold ?? 10 }); setErr(''); setModal(p); };
  const close      = ()   => setModal(null);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      const data = { ...form, price: parseFloat(form.price), initial_stock: parseInt(form.initial_stock), low_stock_threshold: parseInt(form.low_stock_threshold) };
      if (modal === 'create') {
        await createProduct(data);
        toast('Product created');
      } else {
        await updateProduct(modal.id, data);
        toast('Product updated');
      }
      close(); load();
    } catch (e) {
      setErr(e.response?.data?.detail || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try { await deleteProduct(p.id); toast('Product deleted', 'warning'); load(); }
    catch (e) { toast(e.response?.data?.detail || 'Delete failed', 'error'); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">{products.length} total products</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading">Loading…</div> : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Threshold</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">◈</div><p>No products found</p></div></td></tr>
                  ) : filtered.map(p => {
                    const qty = p.inventory?.quantity ?? 0;
                    const thr = p.inventory?.low_stock_threshold ?? 10;
                    return (
                      <tr key={p.id}>
                        <td className="name">{p.name}</td>
                        <td className="mono">{p.sku}</td>
                        <td>{p.category || <span style={{ color: 'var(--text-2)' }}>—</span>}</td>
                        <td className="mono">₹{p.price.toFixed(2)}</td>
                        <td className="mono">{qty}</td>
                        <td className="mono">{thr}</td>
                        <td><span className={`badge ${qty <= thr ? 'badge-low' : 'badge-ok'}`}>{qty <= thr ? 'LOW' : 'OK'}</span></td>
                        <td><div className="actions-cell">
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => remove(p)}>Delete</button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? 'New Product' : 'Edit Product'}</span>
              <button className="btn btn-ghost" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="error-msg">{err}</div>}
              <div className="form-grid">
                <div className="form-group"><label>Name *</label><input name="name" value={form.name} onChange={set} placeholder="Widget Pro" /></div>
                <div className="form-group"><label>SKU *</label><input name="sku" value={form.sku} onChange={set} placeholder="WGT-001" disabled={modal !== 'create'} /></div>
                <div className="form-group"><label>Price *</label><input name="price" type="number" step="0.01" value={form.price} onChange={set} placeholder="999.00" /></div>
                <div className="form-group"><label>Category</label><input name="category" value={form.category} onChange={set} placeholder="Electronics" /></div>
                <div className="form-group"><label>Initial Stock</label><input name="initial_stock" type="number" value={form.initial_stock} onChange={set} disabled={modal !== 'create'} /></div>
                <div className="form-group"><label>Low Stock Threshold</label><input name="low_stock_threshold" type="number" value={form.low_stock_threshold} onChange={set} /></div>
                <div className="form-group span-2"><label>Description</label><textarea name="description" value={form.description} onChange={set} placeholder="Optional product description…" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
