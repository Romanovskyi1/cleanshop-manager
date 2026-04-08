// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore, isManager } from '../store/auth';

interface Props {
  children:      React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Обёртка над роутом — пропускает только manager | admin.
 * При requireAdmin=true — только admin.
 *
 * Использование в Router:
 *   <Route path="/manager/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
 *   <Route path="/manager/catalog" element={<ProtectedRoute requireAdmin><CatalogPage /></ProtectedRoute>} />
 */
export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1F3D' }}>
        <div style={{ color: '#5585E0', fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  if (!user)              return <Navigate to="/login"   replace />;
  if (!isManager(user))   return <Navigate to="/login"   replace />;
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/manager" replace />;
  }

  return <>{children}</>;
}
