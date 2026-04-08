// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout }         from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage }      from './pages/LoginPage';
import { DashboardPage }  from './pages/dashboard/DashboardPage';
import { OrdersPage }     from './pages/orders/OrdersPage';
import { InvoicesPage }   from './pages/invoices/InvoicesPage';
import { ChatPage }       from './pages/chat/ChatPage';
import { ClientsPage }    from './pages/clients/ClientsPage';
import { CatalogPage }    from './pages/catalog/CatalogPage';

/**
 * Структура роутов:
 *
 * /login                  — публичная страница входа
 * /manager                — дашборд (manager | admin)
 * /manager/orders         — заказы  (manager | admin)
 * /manager/invoices       — инвойсы (manager | admin)
 * /manager/chat           — чат     (manager | admin)
 * /manager/clients        — клиенты (manager | admin)
 * /manager/catalog        — каталог (admin only)
 * *                       — редирект на /login
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Публичный */}
        <Route path="/login" element={<LoginPage />} />

        {/* Защищённые — manager + admin */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index             element={<DashboardPage />} />
          <Route path="orders"     element={<OrdersPage />} />
          <Route path="invoices"   element={<InvoicesPage />} />
          <Route path="chat"       element={<ChatPage />} />
          <Route path="clients"    element={<ClientsPage />} />

          {/* Admin only — ProtectedRoute с requireAdmin внутри Layout */}
          <Route
            path="catalog"
            element={
              <ProtectedRoute requireAdmin>
                <CatalogPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
