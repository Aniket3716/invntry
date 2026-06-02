import React, { useEffect, useState } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api';
import { useToast } from '../App';

const EMPTY = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [modal, setModal]      = useState(null);
  const [form, setForm]        = useState(EMPTY);
  const [saving, setSaving]    = useState(false);
  const [err, setErr]          = useState('');
  const [search, setSearch]    = useState('');

  const load = () => getCustomers().then(setCustomers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setErr(''); setModal('create'); };
  const openEdit   = (c)  => { setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' }); setErr(''); setModal(c); };
  const close      = ()   => setModal(null);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      if (modal === 'create') { await createCustomer(form); toast('Customer created'); }
      else { await updateCustomer(modal.id, { name: form.name, phone: form.phone, address: form.address }); toast('Customer updated'); }
      close(); load();
    } catch (e) { setErr(e.response?.data?.detail || 'Something went wrong'); }
    finally { setSaving(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete customer "${c.name}"?`)) return;
    try { await deleteCustomer(c.id); toast('Customer deleted', 'warning'); load(); }
    catch (e) { toast(e.response?.data?.detail || 'Delete failed', 'error'); }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">{customers.length} registered customers</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <button className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading">Loading…</div> : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">◉</div><p>No customers found</p></div></td></tr>
                  ) : filtered.map(c => (
                    <tr key={c.id}>
                      <td className="name">{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone || <span style={{ color: 'var(--text-2)' }}>—</span>}</td>
                      <td className="mono">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td><div className="actions-cell">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>Delete</button>
                      </div></td>
                    </tr>
                  ))}
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
              <span className="modal-title">{modal === 'create' ? 'New Customer' : 'Edit Customer'}</span>
              <button className="btn btn-ghost" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="error-msg">{err}</div>}
              <div className="form-grid">
                <div className="form-group"><label>Full Name *</label><input name="name" value={form.name} onChange={set} placeholder="Jane Smith" /></div>
                <div className="form-group"><label>Email *</label><input name="email" type="email" value={form.email} onChange={set} placeholder="jane@example.com" disabled={modal !== 'create'} /></div>
                <div className="form-group"><label>Phone</label><input name="phone" value={form.phone} onChange={set} placeholder="+1-555-0100" /></div>
                <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={set} placeholder="123 Main St" /></div>
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
