import React, { useEffect, useState } from 'react';
import { getDashboardStats, getLowStock } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getLowStock()])
      .then(([s, ls]) => { setStats(s); setLowStock(ls); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const statCards = [
    { label: 'Total Products',   value: stats.total_products,   color: 'blue',   prefix: '' },
    { label: 'Total Customers',  value: stats.total_customers,  color: 'green',  prefix: '' },
    { label: 'Total Orders',     value: stats.total_orders,     color: 'yellow', prefix: '' },
    { label: 'Pending Orders',   value: stats.pending_orders,   color: 'red',    prefix: '' },
    { label: 'Low Stock Items',  value: stats.low_stock_count,  color: 'red',    prefix: '' },
    { label: 'Total Revenue',    value: `₹${stats.total_revenue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, color: 'green', prefix: '' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your inventory & orders</div>
        </div>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          {statCards.map(({ label, value, color }) => (
            <div key={label} className={`stat-card ${color}`}>
              <div className="stat-label">{label}</div>
              <div className={`stat-value ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {lowStock.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">⚠ Low Stock Alerts</span>
              <span className="badge badge-low">{lowStock.length} items</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Threshold</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(item => (
                    <tr key={item.id}>
                      <td className="name">{item.product?.name}</td>
                      <td className="mono">{item.product?.sku}</td>
                      <td>{item.product?.category || '—'}</td>
                      <td className="mono">{item.quantity}</td>
                      <td className="mono">{item.low_stock_threshold}</td>
                      <td><span className="badge badge-low">LOW</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
