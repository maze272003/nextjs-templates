'use client';

import { Menu } from 'lucide-react'; // ✅ Removed unused 'User' import
import Link from 'next/link';
import Image from 'next/image'; // ✅ Added next/image
import { navLinks } from '@/constants/navLinks';

interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

interface NavbarProps {
  onMenuClick: () => void;
  pathname: string;
  profile: ProfileData | null;
  loadingProfile: boolean;
}

export default function Navbar({ onMenuClick, pathname, profile, loadingProfile }: NavbarProps) {
  const getTitle = () => {
    const activeLink = navLinks.find(link => link.href === pathname);
    return activeLink ? activeLink.label : 'Dashboard';
  };

  const getInitials = (firstName: string | undefined, lastName: string | undefined) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const userInitials = profile ? getInitials(profile.first_name, profile.last_name) : '';

  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between border-b border-gray-100">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-600 hover:text-gray-900 p-1 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        <div className="ml-4 md:ml-0">
          <h2 className="text-xl font-semibold text-gray-800">{getTitle()}</h2>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {loadingProfile ? (
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse hidden sm:block"></div>
        ) : (
          <p className="text-sm font-medium text-gray-700 hidden sm:block truncate max-w-[120px]">
            {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Guest' : 'Guest'}
          </p>
        )}

        {loadingProfile ? (
          <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
        ) : (
          <Link href="/profile" className="block cursor-pointer flex-shrink-0">
            {profile?.profile_picture_url ? (
              <Image
                src={profile.profile_picture_url}
                alt="Profile"
                width={36}
                height={36}
                className="rounded-full object-cover border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {userInitials || 'JD'}
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
