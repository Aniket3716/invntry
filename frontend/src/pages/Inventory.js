import React, { useEffect, useState } from 'react';
import { getInventory, updateInventory } from '../api';
import { useToast } from '../App';

export default function Inventory() {
  const toast = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [modal, setModal]        = useState(null);
  const [form, setForm]          = useState({ quantity: 0, low_stock_threshold: 10 });
  const [saving, setSaving]      = useState(false);
  const [err, setErr]            = useState('');
  const [search, setSearch]      = useState('');
  const [filter, setFilter]      = useState('all'); // all | low

  const load = () => getInventory().then(setInventory).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openEdit = (item) => {
    setForm({ quantity: item.quantity, low_stock_threshold: item.low_stock_threshold });
    setErr('');
    setModal(item);
  };
  const close = () => setModal(null);

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      await updateInventory(modal.product_id, {
        quantity: parseInt(form.quantity),
        low_stock_threshold: parseInt(form.low_stock_threshold),
      });
      toast('Inventory updated');
      close();
      load();
    } catch (e) {
      setErr(e.response?.data?.detail || 'Update failed');
    } finally { setSaving(false); }
  };

  let displayed = inventory.filter(item => {
    const matchSearch =
      (item.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.product?.sku  || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'low' && item.quantity <= item.low_stock_threshold);
    return matchSearch && matchFilter;
  });

  const lowCount = inventory.filter(i => i.quantity <= i.low_stock_threshold).length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">
            {inventory.length} products tracked
            {lowCount > 0 && <span className="badge badge-low" style={{ marginLeft: 10 }}>{lowCount} low</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Search product / SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 220 }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Items</option>
            <option value="low">Low Stock Only</option>
          </select>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading">Loading…</div> : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty in Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="empty-icon">◫</div>
                          <p>{filter === 'low' ? 'No low-stock items' : 'No inventory records found'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : displayed.map(item => {
                    const isLow = item.quantity <= item.low_stock_threshold;
                    return (
                      <tr key={item.id}>
                        <td className="name">{item.product?.name || '—'}</td>
                        <td className="mono">{item.product?.sku || '—'}</td>
                        <td>{item.product?.category || <span style={{ color: 'var(--text-2)' }}>—</span>}</td>
                        <td className="mono">₹{(item.product?.price ?? 0).toFixed(2)}</td>
                        <td>
                          <span
                            className="mono"
                            style={{ color: isLow ? 'var(--red)' : 'var(--accent)', fontWeight: 700 }}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className="mono">{item.low_stock_threshold}</td>
                        <td>
                          <span className={`badge ${isLow ? 'badge-low' : 'badge-ok'}`}>
                            {isLow ? 'LOW' : 'OK'}
                          </span>
                        </td>
                        <td className="mono">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>
                            Update Stock
                          </button>
                        </td>
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
              <span className="modal-title">Update Stock — {modal.product?.name}</span>
              <button className="btn btn-ghost" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="error-msg">{err}</div>}

              <div style={{
                background: 'var(--bg-0)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                marginBottom: 20,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', marginBottom: 4 }}>SKU</div>
                  <div className="mono" style={{ fontSize: 13 }}>{modal.product?.sku}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', marginBottom: 4 }}>CURRENT QTY</div>
                  <div className="mono" style={{ fontSize: 13, color: modal.quantity <= modal.low_stock_threshold ? 'var(--red)' : 'var(--accent)' }}>
                    {modal.quantity}
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>New Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={form.low_stock_threshold}
                    onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))}
                  />
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 12 }}>
                ⚠ Setting quantity directly overwrites the current stock. Use this for manual adjustments, restocking, or corrections.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
