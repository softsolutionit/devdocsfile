import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { MainNav } from "@/components/main-nav";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'DevDocsFile - Developer Documentation Hub',
  description: 'Comprehensive developer documentation and API references',
  keywords: 'documentation, api, developer, docs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <MainNav />
          <div className="flex-1 ">
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
