import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, FileText } from 'lucide-react'; 

export default function Sidebar() {
  const router = useRouter();

  // Next.js ke actual file paths (routes) jo hum abhi banayenge
  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/monthly-reports/disbursement', name: 'Disbursement Report', icon: FileText },
    { path: '/monthly-reports/recovery', name: 'Recovery Report', icon: FileText },
    { path: '/monthly-reports/due', name: 'Due Report', icon: FileText },
    { path: '/monthly-reports/overdue', name: 'Overdue Report', icon: FileText },
    { path: '/monthly-reports/consolidated', name: 'Consolidated Report', icon: FileText },
    { path: '/monthly-reports/profile', name: 'Beneficiary Profile Report', icon: FileText },
  ];

  const [months, setMonths] = useState([]);
  const [openMonths, setOpenMonths] = useState(false);

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
  

  return (
  <aside className="w-64 h-screen sticky top-0 left-0 z-40 hidden lg:flex flex-col justify-between bg-slate-950 text-slate-200 overflow-y-auto pb-8 shrink-0">
      <div className="px-6 py-8">
        <div className="mb-8">
          <div className="text-slate-100 text-lg font-bold">Individual Record</div>
          <div className="text-slate-400 text-xs mt-1">Master Database</div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-amber-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 opacity-90" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div>
            <button
              type="button"
              onClick={() => setOpenMonths((s) => !s)}
              className="flex items-center justify-between w-full gap-3 px-3 py-3 rounded-lg text-sm font-medium transition text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <FileText className="h-4 w-4 opacity-90" />
                <span>Monthly Reports</span>
              </span>
              <span className="text-xs text-slate-400">{openMonths ? '▾' : '▸'}</span>
            </button>

            {openMonths && (
              <div className="mt-2 ml-3 flex flex-col gap-1">
                {months.length === 0 && <div className="text-sm text-slate-400 px-3 py-2">No months found</div>}
                {months.map((m) => (
                  <Link
                    key={m}
                    href={`/monthly-reports/${encodeURIComponent(m)}`}
                    className="px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    {m}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="border-t border-slate-800 px-6 py-5 text-xs text-slate-500">v0.1</div>
    </aside>
  );
}