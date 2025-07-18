'use client';

import { Home, User, Settings, MessageCircle, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // ✅ Added next/image

interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  profile: ProfileData | null;
  loadingProfile: boolean;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, pathname, profile, loadingProfile }: SidebarProps) {
  const getInitials = (firstName: string | undefined, lastName: string | undefined) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const userInitials = profile ? getInitials(profile.first_name, profile.last_name) : '';

  return (
    <>
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-75 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50
                   md:relative md:w-64 md:translate-x-0 md:shadow-none md:border-r md:border-gray-100
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-white">
          <Link href="/dashboard" className="text-xl font-extrabold text-blue-700 tracking-tight">
            My App
          </Link>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700 p-1 rounded-md transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 flex items-center space-x-3 bg-white">
          {loadingProfile ? (
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          ) : (
            <Link href="/profile" className="flex-shrink-0 block cursor-pointer">
              {profile?.profile_picture_url ? (
                <Image
                  src={profile.profile_picture_url}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-semibold shadow-sm">
                  {userInitials || <User size={24} />}
                </div>
              )}
            </Link>
          )}

          {loadingProfile ? (
            <div className="flex-grow space-y-2">
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          ) : (
            <div className="flex-grow">
              <p className="font-semibold text-gray-800 text-sm truncate">
                {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Guest User' : 'Guest User'}
              </p>
              {profile?.first_name && (
                <Link href="/profile" className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors block mt-0.5">
                  View Profile
                </Link>
              )}
            </div>
          )}
        </div>

        <nav className="mt-2 flex-grow overflow-y-auto">
          <ul>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href} className="mx-3 my-2">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform
                      ${isActive
                        ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:-translate-y-1'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:-translate-y-1'
                      }`}
                    onClick={onClose}
                  >
                    <link.icon size={20} className="flex-shrink-0" />
                    <span className="text-sm">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400 bg-white">
          &copy; {new Date().getFullYear()} My App.
        </div>
      </aside>
    </>
  );
}
