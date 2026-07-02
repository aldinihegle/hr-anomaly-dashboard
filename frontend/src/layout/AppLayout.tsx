import type { ReactNode } from 'react';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import Backdrop from './Backdrop';

function LayoutInner({ children }: { children: ReactNode }) {
  const { isExpanded, isMobileOpen } = useSidebar();
  return (
    <div className="min-h-screen flex flex-col w-full">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out
          ${isExpanded ? 'lg:pl-[290px]' : 'lg:pl-[90px]'}
          ${isMobileOpen ? 'pl-0' : ''}
        `}
      >
        <AppHeader />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
