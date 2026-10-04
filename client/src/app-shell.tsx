import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './context/auth-context.js';
import { Button } from './components/ui.js';
import styles from './pages/pages.module.css';

export function AppShell() {
  const { user, signOut } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navActive : ''}`;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>🧊</span> Asset Hub
        </Link>

        <nav className={styles.nav}>
          <NavLink to="/" end className={linkClass}>Library</NavLink>
          <NavLink to="/upload" className={linkClass}>Upload</NavLink>
        </nav>

        <div className={styles.spacer} />

        {user && (
          <div className={styles.userChip}>
            <div className={styles.avatar}>{user.name.slice(0, 2).toUpperCase()}</div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userRole}>{user.role}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
          </div>
        )}
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
