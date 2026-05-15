// src/components/layout/Layout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, isAdmin } from '../../store/auth';
import styles from './Layout.module.css';

const NAV = [
  { to: '/manager',           icon: '▦', label: 'Дашборд',  exact: true },
  { to: '/manager/orders',    icon: '🚛', label: 'Заказы' },
  { to: '/manager/invoices',  icon: '📄', label: 'Инвойсы' },
  { to: '/manager/chat',      icon: '💬', label: 'Чат' },
  { to: '/manager/clients',   icon: '🏢', label: 'Клиенты' },
  { to: '/manager/catalog',   icon: '📦', label: 'Каталог' },
];

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();
  const admin            = isAdmin(user);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.wrap}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>CS</span>
          <div>
            <div className={styles.logoName}>CleanShop</div>
            <div className={styles.logoRole}>
              {admin ? 'Администратор' : 'Менеджер'}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ''}`
              }
            >
              <span className={styles.navIcon}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.displayName}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerBreadcrumb} id="breadcrumb" />
          <div className={styles.headerRight}>
            <span className={styles.headerUser}>{user?.displayName}</span>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
