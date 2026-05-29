import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  FileText,
  ChevronDown,
  Menu,
  X,
  Database,
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const [months, setMonths] = useState([]);
  const [openMonths, setOpenMonths] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/monthly-reports/disbursement', name: 'Disbursement Report', icon: FileText },
    { path: '/monthly-reports/recovery', name: 'Recovery Report', icon: FileText },
    { path: '/monthly-reports/due', name: 'Due Report', icon: FileText },
    { path: '/monthly-reports/overdue', name: 'Overdue Report', icon: FileText },
    { path: '/monthly-reports/consolidated', name: 'Consolidated Report', icon: FileText },
    { path: '/monthly-reports/profile', name: 'Beneficiary Profile Report', icon: FileText },
  ];

  useEffect(() => {
    let mounted = true;
    fetch('/api/months')
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (j && Array.isArray(j.sheets)) setMonths(j.sheets);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Auto-open monthly dropdown if a month route is active
  useEffect(() => {
    const isMonthActive =
      router.pathname === '/monthly-reports/[month]' ||
      months.some(
        (m) => router.pathname === `/monthly-reports/${encodeURIComponent(m)}`
      );
    if (isMonthActive) setOpenMonths(true);
  }, [router.pathname, months]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  const isActive = (path) => router.pathname === path;

  const isMonthActive = (m) => {
    const monthPath = `/monthly-reports/${encodeURIComponent(m)}`;
    return (
      router.pathname === monthPath ||
      (router.pathname === '/monthly-reports/[month]' &&
        router.query.month === m)
    );
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-5 pt-7 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-slate-100 text-sm font-semibold leading-tight">Individual Record</p>
            <p className="text-slate-500 text-xs">Master Database</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Main
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-900/30'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">{item.name}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
              )}
            </Link>
          );
        })}

        {/* Monthly Reports Accordion */}
        <div className="mt-3">
          <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Monthly Reports
          </p>

          <button
            type="button"
            onClick={() => setOpenMonths((s) => !s)}
            className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              openMonths
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
            }`}
          >
            <FileText
              className={`h-4 w-4 shrink-0 ${
                openMonths ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            />
            <span className="flex-1 text-left truncate">By Month</span>
            <span
              className="shrink-0 transition-transform duration-200"
              style={{ transform: openMonths ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </span>
          </button>

          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: openMonths ? `${months.length * 44 + 16}px` : '0px' }}
          >
            <div className="ml-4 mt-1 pl-3 border-l border-slate-800 flex flex-col gap-0.5">
              {months.length === 0 ? (
                <p className="text-xs text-slate-600 py-2 px-2">No months available</p>
              ) : (
                months.map((m) => {
                  const active = isMonthActive(m);
                  return (
                    <Link
                      key={m}
                      href={`/monthly-reports/${encodeURIComponent(m)}`}
                      className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-all duration-150 ${
                        active
                          ? 'bg-amber-500 text-white font-medium shadow-sm shadow-amber-900/30'
                          : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          active ? 'bg-white/70' : 'bg-slate-700'
                        }`}
                      />
                      <span className="truncate">{m}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-600">v0.1</span>
        <span className="text-xs text-slate-700 bg-slate-800 px-2 py-0.5 rounded-full">Beta</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-slate-950 text-slate-200 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 left-0 z-40 flex-col bg-slate-950 text-slate-200 shrink-0">
        <NavContent />
      </aside>
    </>
  );
}