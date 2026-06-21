import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';

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
            {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-red-500 hover:bg-red-50 dark:border-gray-800 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
