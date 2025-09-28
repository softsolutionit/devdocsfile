'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Icons.home },
  { name: 'Articles', href: '/dashboard/articles', icon: Icons.fileText },
  { name: 'New Article', href: '/dashboard/articles/new', icon: Icons.plus },
  { name: 'Profile', href: '/dashboard/profile', icon: Icons.user },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: Icons.shield },
  { name: 'Users', href: '/admin/users', icon: Icons.users },
  { name: 'Content', href: '/admin/content', icon: Icons.fileText },
  { name: 'Settings', href: '/admin/settings', icon: Icons.settings },
];

export function Sidebar({ onClose }) {
  const pathname = usePathname();
  const isAdmin = false; // This should come from your auth context

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <h1 className="text-xl font-bold text-white">DevDocsFile</h1>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium',
                pathname === item.href
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-6 w-6 flex-shrink-0',
                  pathname === item.href ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
          
          {isAdmin && (
            <>
              <div className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Admin
              </div>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center rounded-md px-2 py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-6 w-6 flex-shrink-0',
                      pathname === item.href ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-gray-700 p-4">
        <div className="group block w-full flex-shrink-0">
          <div className="flex items-center">
            <div>
              <Icons.userCircle className="h-9 w-9 rounded-full text-gray-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">User Name</p>
              <button className="text-xs font-medium text-gray-300 hover:text-white">
                View profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
