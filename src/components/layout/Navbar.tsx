'use client';

import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  pathname: string; // <-- 1. Tanggapin ang pathname prop
}

export default function Navbar({ onMenuClick, pathname }: NavbarProps) {
  // 2. Gumawa ng logic para sa title
  const getTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      default:
        return 'My App'; // Fallback title
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex items-center">
      <button onClick={onMenuClick} className="md:hidden text-gray-700">
        <Menu size={24} />
      </button>

      <div className="ml-4">
        {/* 3. Gamitin ang dynamic title */}
        <h2 className="text-lg font-semibold">{getTitle()}</h2>
      </div>
    </header>
  );
}