import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => 
    localStorage.getItem('sidebarCollapsed') === 'true'
  );
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const onThemeChange = (event) => setTheme(event.detail);
    window.addEventListener('themechange', onThemeChange);
    return () => window.removeEventListener('themechange', onThemeChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: nextTheme }));
    setTheme(nextTheme);
  };

  const navigation = useMemo(() => {
    const items = [
      { label: 'Dashboard', to: '/dashboard', icon: '▦' },
      { label: 'Feedback', to: '/feedback', icon: '✎' },
    ];

    if (['super_admin', 'company_admin'].includes(user?.role)) {
      items.push({ label: 'Reports', to: '/reports', icon: '▤' });
    }

    if (['super_admin', 'company_admin'].includes(user?.role)) {
      items.push({ label: 'Employees', to: '/employees', icon: '◉' });
    }

    if (user?.role === 'super_admin') {
      items.push(
        { label: 'Users', to: '/users', icon: '◇' },
        { label: 'Companies', to: '/companies', icon: '□' }
      );
    }

    if (['super_admin', 'company_admin'].includes(user?.role)) {
      items.push({ label: 'Departments', to: '/departments', icon: '≡' });
    }

    return items;
  }, [user?.role]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 lg:flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 px-4 py-5 text-white shadow-2xl transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72 max-w-[86vw] lg:sticky lg:top-0 lg:h-screen lg:max-w-none lg:translate-x-0 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
        aria-label="Sidebar"
      >
        <div className="mb-6 flex items-center justify-between gap-3 px-2">
          {!sidebarCollapsed && (
            <button type="button" onClick={() => navigate('/dashboard')} className="min-h-0 p-0 text-left hover:opacity-90">
              <span className="block text-xl font-bold tracking-tight">Feedback-Rating App</span>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Mtandt Group</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-white shadow-lg transition-all duration-250 hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-white shadow-lg transition-all duration-250 hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5 lg:hidden" onClick={closeSidebar} aria-label="Close menu">
              ×
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-active' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-800/50 p-4">
          {!sidebarCollapsed && (
            <>
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="truncate text-xs uppercase tracking-wide text-slate-400 mt-1">{user?.role?.replace('_', ' ')}</p>
              <button type="button" onClick={handleLogout} className="mt-4 w-full sidebar-logout-btn">Logout</button>
            </>
          )}
          {sidebarCollapsed && (
            <button type="button" onClick={handleLogout} className="sidebar-icon mx-auto" title="Logout">
              🚪
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setSidebarOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-lg transition-all duration-250 hover:bg-slate-50 hover:shadow-xl hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'Welcome'}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="btn-neutral hidden sm:inline-flex"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button type="button" onClick={handleLogout} className="btn-danger hidden sm:inline-flex">Logout</button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] lg:hidden" aria-label="Mobile quick navigation">
        {navigation.slice(0, 4).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-active' : ''}`}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default DashboardLayout;
