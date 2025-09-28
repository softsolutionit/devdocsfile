'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';

export function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
