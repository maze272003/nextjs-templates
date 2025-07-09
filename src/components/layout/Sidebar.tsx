'use client';

import { Home, User, Settings, X } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string; // <-- 1. Tanggapin ang pathname prop
}

// 2. Gumawa ng listahan ng mga links para mas malinis
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, pathname }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 
                   md:relative md:w-64 md:translate-x-0 md:shadow-none
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h1 className="text-xl font-bold text-indigo-600">My App</h1>
          <button onClick={onClose} className="md:hidden text-gray-600 hover:text-gray-900">
            <X size={24} />
          </button>
        </div>
        <nav className="mt-4">
          <ul>
            {/* 3. I-map ang links at lagyan ng conditional styling */}
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href} className="mx-2 my-1">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 font-semibold' // Active style
                        : 'text-gray-600 hover:bg-gray-100'          // Default style
                    }`}
                  >
                    <link.icon size={20} />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}