import { useSidebar } from '../context/SidebarContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  {
    name: 'Overview',
    href: '#overview',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    name: 'Distribusi Risiko',
    href: '#risiko',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
      </svg>
    ),
  },
  {
    name: 'SHAP Global',
    href: '#shap',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    name: 'Histogram Skor',
    href: '#histogram',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 17V9m4 8V5m4 12v-6m4 6v-9" />
      </svg>
    ),
  },
  {
    name: 'Tabel Karyawan',
    href: '#tabel',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.375-9V5.625A2.25 2.25 0 0019.125 3.375h-1.5m-13.5 0V5.625A2.25 2.25 0 005.625 3.375h-1.5" />
      </svg>
    ),
  },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const showText = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-gray-900 lg:translate-x-0
        ${isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Logo */}
      <div className={`flex items-center py-8 ${!showText ? 'justify-center' : 'justify-start'}`}>
        {showText ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white font-bold">
              HR
            </div>
            <div>
              <div className="text-base font-semibold text-gray-800 dark:text-white/90">HR Anomaly</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Monitoring Dashboard</div>
            </div>
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white font-bold">
            HR
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div>
            <h2
              className={`mb-4 text-xs uppercase leading-[20px] text-gray-400 ${
                !showText ? 'lg:justify-center' : 'justify-start'
              } flex`}
            >
              {showText ? 'Menu' : '•••'}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {NAV.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={`menu-item group menu-item-inactive ${
                      !showText ? 'lg:justify-center' : 'lg:justify-start'
                    }`}
                  >
                    <span className="menu-item-icon-size menu-item-icon-inactive">{item.icon}</span>
                    {showText && <span className="text-theme-sm">{item.name}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Footer info */}
      {showText && (
        <div className="mt-auto pb-6 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Model Aktif</div>
            <div className="mt-1">Isolation Forest + XGBoost-SHAP</div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success-500"></span>
              <span>Online · IBM HR Dataset</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
