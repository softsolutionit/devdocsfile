'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Icons.layoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Icons.users },
  { name: 'Articles', href: '/admin/articles', icon: Icons.fileText },
  { name: 'Comments', href: '/admin/comments', icon: Icons.messageSquare },
  { name: 'Tags', href: '/admin/tags', icon: Icons.tag },
  { name: 'Settings', href: '/admin/settings', icon: Icons.settings },
];

export function Sidebar({ onClose }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-6 w-6 flex-shrink-0',
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
        <Link href="/dashboard" className="group block w-full flex-shrink-0">
          <div className="flex items-center">
            <div>
              <Icons.arrowLeft className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Back to App
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
