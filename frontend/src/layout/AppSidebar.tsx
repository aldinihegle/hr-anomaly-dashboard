import { useEffect, useState } from 'react';
import { useSidebar } from '../context/SidebarContext';
import { LayoutDashboard, PieChart, BarChart3, Activity, Users, UserPlus, HelpCircle } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  {
    name: 'Overview',
    href: '#overview',
    icon: <LayoutDashboard className="size-5" />,
  },
  {
    name: 'Distribusi Risiko',
    href: '#risiko',
    icon: <PieChart className="size-5" />,
  },
  {
    name: 'Akar Masalah',
    href: '#shap',
    icon: <BarChart3 className="size-5" />,
  },
  {
    name: 'Analisis Demografi',
    href: '#demografi',
    icon: <Activity className="size-5" />,
  },
  {
    name: 'Data Karyawan',
    href: '#karyawan',
    icon: <Users className="size-5" />,
  },
  {
    name: 'Analisis Anomali',
    href: '#tabel',
    icon: <BarChart3 className="size-5" />,
  },
  {
    name: 'Tambah Karyawan',
    href: '#tambah',
    icon: <UserPlus className="size-5" />,
  },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen } = useSidebar();
  const showText = isExpanded || isMobileOpen;

  const [currentHash, setCurrentHash] = useState(window.location.hash || '#overview');

  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '#overview');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col overflow-y-hidden border-r border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-zinc-950 lg:translate-x-0
        ${isExpanded || isMobileOpen ? 'w-[290px]' : 'w-[90px]'}
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
              <div className="text-base font-bold font-jakarta text-slate-800 dark:text-white/90">HR Anomaly</div>
              <div className="text-[11px] font-inter uppercase tracking-wide text-slate-400">Monitoring Dashboard</div>
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
              className={`mb-4 text-xs font-inter font-semibold uppercase leading-[20px] text-slate-400 ${
                !showText ? 'lg:justify-center' : 'justify-start'
              } flex`}
            >
              {showText ? 'Menu' : '•••'}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {NAV.map((item) => {
                const isActive = currentHash === item.href;
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all font-inter ${
                        !showText ? 'lg:justify-center' : 'lg:justify-start'
                      } ${
                        isActive 
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-semibold' 
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                      }`}
                    >
                      <span className={`${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                        {item.icon}
                      </span>
                      {showText && <span>{item.name}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>

      {/* Footer info */}
      <div className="mt-auto pb-6">
        <a 
          href="#onboarding"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-zinc-900/50 dark:hover:text-slate-200 ${
            !showText ? 'justify-center' : 'justify-start'
          }`}
          title="Bantuan & Onboarding"
        >
          <HelpCircle className="size-5 shrink-0" />
          {showText && <span className="font-inter font-medium">Bantuan</span>}
        </a>
      </div>
    </aside>
  );
}
