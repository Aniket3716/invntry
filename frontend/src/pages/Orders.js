import React, { useEffect, useState } from 'react';
import { getOrders, createOrder, updateOrderStatus, deleteOrder, getCustomers, getProducts } from '../api';
import { useToast } from '../App';

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_BADGE = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled',
};

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders]       = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [detail, setDetail]       = useState(null);
  const [form, setForm]           = useState({ customer_id: '', notes: '', items: [] });
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const load = () => getOrders().then(setOrders).finally(() => setLoading(false));
  useEffect(() => {
    Promise.all([load(), getCustomers().then(setCustomers), getProducts().then(setProducts)]);
  }, []);

  // ── order item helpers ──────────────────────────────────────────────────
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1 }] }));
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const orderTotal = form.items.reduce((sum, item) => {
    const p = products.find(x => x.id === parseInt(item.product_id));
    return sum + (p ? p.price * (parseInt(item.quantity) || 0) : 0);
  }, 0);

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        notes: form.notes,
        items: form.items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })),
      };
      await createOrder(payload);
      toast('Order created');
      setModal(false);
      setForm({ customer_id: '', notes: '', items: [] });
      load();
    } catch (e) { setErr(e.response?.data?.detail || 'Failed to create order'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (order, status) => {
    try {
      await updateOrderStatus(order.id, status);
      toast(`Order #${order.id} → ${status}`);
      load();
    } catch (e) { toast(e.response?.data?.detail || 'Update failed', 'error'); }
  };

  const remove = async (o) => {
    if (!window.confirm(`Delete Order #${o.id}?`)) return;
    try { await deleteOrder(o.id); toast('Order deleted', 'warning'); load(); }
    catch (e) { toast(e.response?.data?.detail || 'Delete failed', 'error'); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Orders</div>
          <div className="page-subtitle">{orders.length} total orders</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setErr(''); setModal(true); }}>+ New Order</button>
      </div>

      <div className="page-body">
        {loading ? <div className="loading">Loading…</div> : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">◎</div><p>No orders yet</p></div></td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id}>
                      <td className="mono">#{o.id}</td>
                      <td className="name">{o.customer?.name || '—'}</td>
                      <td className="mono">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                      <td className="mono">₹{o.total_amount.toFixed(2)}</td>
                      <td><span className={`badge ${STATUS_BADGE[o.status]}`}>{o.status}</span></td>
                      <td className="mono">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td><div className="actions-cell">
                        <button className="btn btn-sm btn-ghost" onClick={() => setDetail(o)}>View</button>
                        <select
                          value={o.status}
                          onChange={e => changeStatus(o, e.target.value)}
                          style={{ fontSize: 12, padding: '4px 6px', width: 'auto' }}
                        >
                          {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(o)}>Del</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">New Order</span>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="error-msg">{err}</div>}
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Customer *</label>
                  <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                    <option value="">Select customer…</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                  </select>
                </div>
                <div className="form-group span-2"><label>Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional order notes…" /></div>
              </div>

              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="card-title">Order Items</span>
                <button className="btn btn-sm btn-secondary" onClick={addItem}>+ Add Item</button>
              </div>

              {form.items.map((item, i) => {
                const prod = products.find(p => p.id === parseInt(item.product_id));
                return (
                  <div key={i} className="order-item-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Product</label>
                      <select value={item.product_id} onChange={e => setItem(i, 'product_id', e.target.value)}>
                        <option value="">Select product…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.price.toFixed(2)} (stock: {p.inventory?.quantity ?? 0})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Qty</label>
                      <input type="number" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 20 }} onClick={() => removeItem(i)}>✕</button>
                  </div>
                );
              })}

              {form.items.length === 0 && <div style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '16px 0' }}>No items added yet — click "+ Add Item"</div>}

              {form.items.length > 0 && (
                <div className="order-items-total">Total: ₹{orderTotal.toFixed(2)}</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving || !form.customer_id || form.items.length === 0}>{saving ? 'Placing…' : 'Place Order'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">Order #{detail.id}</span>
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div><div style={{ color: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>CUSTOMER</div><div style={{ fontWeight: 600 }}>{detail.customer?.name}</div><div style={{ color: 'var(--text-2)', fontSize: 13 }}>{detail.customer?.email}</div></div>
                <div><div style={{ color: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>STATUS</div><span className={`badge ${STATUS_BADGE[detail.status]}`}>{detail.status}</span></div>
                <div><div style={{ color: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>PLACED</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{new Date(detail.created_at).toLocaleString()}</div></div>
                {detail.notes && <div><div style={{ color: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>NOTES</div><div style={{ fontSize: 13 }}>{detail.notes}</div></div>}
              </div>
              <table>
                <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detail.items.map(item => (
                    <tr key={item.id}>
                      <td className="name">{item.product?.name}</td>
                      <td className="mono">{item.product?.sku}</td>
                      <td className="mono">{item.quantity}</td>
                      <td className="mono">${item.unit_price.toFixed(2)}</td>
                      <td className="mono">${(item.unit_price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="order-items-total">Total: ${detail.total_amount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
