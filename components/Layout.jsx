import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import { isTokenValid } from '../utils/auth';

export default function AppLayout({ children }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isTokenValid()) {
      router.replace('/login');
      return;
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      {/* 2. Main Content Area takes up the remaining space on the right side */}
      <main className="flex-1 p-6 overflow-x-hidden min-w-0">
        {/* Your Dashboard component mounts here safely without overlapping */}
        {children} 
      </main>

    </div>
  );
}