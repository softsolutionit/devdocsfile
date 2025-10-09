'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/auth/user-nav';
import { Icons } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';

export function MainNav() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex px-2 md:px-10 h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold">DevDocsFile</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/articles"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Documentation
            </Link>
            <Link
              href="/articles"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Blog
            </Link>
            {session?.user && (
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-9 w-20 rounded-md bg-muted" />
          ) : session ? (
            <UserNav user={session.user} />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signin">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
