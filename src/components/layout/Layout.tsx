'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation'; // <-- 1. Import usePathname
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname(); // <-- 2. Kunin ang current path

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 3. Ipasa ang pathname bilang prop */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} pathname={pathname} />

      <div className="flex-1 flex flex-col">
        {/* 3. Ipasa ang pathname bilang prop */}
        <Navbar onMenuClick={toggleSidebar} pathname={pathname} />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}