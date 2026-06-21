import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex w-full items-center justify-between px-4 py-3 md:px-6 lg:py-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            aria-label="Toggle sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
          >
            {isMobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="14" viewBox="0 0 16 12" fill="currentColor">
                <path fillRule="evenodd" d="M.583 1A.75.75 0 011.333.25H14.667a.75.75 0 010 1.5H1.333A.75.75 0 01.583 1zm0 10a.75.75 0 01.75-.75H14.667a.75.75 0 010 1.5H1.333A.75.75 0 01.583 11zm.75-5.75a.75.75 0 100 1.5H8a.75.75 0 100-1.5H1.333z" />
              </svg>
            )}
          </button>

          <div className="hidden md:block">
            <h1 className="text-base font-semibold text-gray-800 dark:text-white/90">
              HR Anomaly Monitoring
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Deteksi anomali profil kinerja karyawan — Isolation Forest + XGBoost-SHAP
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
          >
            {theme === 'dark' ? (
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5a.75.75 0 01.75.75V7a.75.75 0 01-1.5 0V5.25A.75.75 0 0112 4.5zM4.5 12a.75.75 0 01.75-.75H7a.75.75 0 010 1.5H5.25A.75.75 0 014.5 12zm12.75 0a.75.75 0 01.75-.75H19.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12 16.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V17a.75.75 0 01.75-.75zM6.4 6.4a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06L6.4 7.46a.75.75 0 010-1.06zm9.08 9.08a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zm-9.08 1.06a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06L7.46 17.6a.75.75 0 01-1.06 0zm9.08-9.08a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
              </svg>
            ) : (
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* User pill */}
          <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
              AH
            </div>
            <div className="hidden text-xs sm:block">
              <div className="font-medium text-gray-700 dark:text-gray-300">Aldini Hegle</div>
              <div className="text-gray-400">HR Analyst</div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
            title="Keluar"
            aria-label="Logout"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-red-500 hover:bg-red-50 dark:border-gray-800 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
