import React, { createContext, useContext, useState, useCallback } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';

// ── Toast Context ────────────────────────────────────────────────────────────
export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { to: '/',          icon: '▦',  label: 'Dashboard'  },
  { to: '/products',  icon: '◈',  label: 'Products'   },
  { to: '/customers', icon: '◉',  label: 'Customers'  },
  { to: '/orders',    icon: '◎',  label: 'Orders'     },
  { to: '/inventory', icon: '◫',  label: 'Inventory'  },
];

function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>INVNTRY</h1>
        <p>MGMT SYSTEM v1.0</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">Menu</div>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/products"  element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
