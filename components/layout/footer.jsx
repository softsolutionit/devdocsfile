'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-muted dark:text-white border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4">
              <Link 
                href="/privacy-policy" 
                className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors dark:text-white"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms-conditions" 
                className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors dark:text-white"
              >
                Terms & Conditions
              </Link>
            </div>
            <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
          <div className="text-sm text-gray-500 dark:text-white">
            © {currentYear} DevDocs. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            <span className="text-sm text-gray-500 dark:text-white">
              Powered by{' '}
              <Link 
                href="https://softsolutionit.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline dark:text-white"
              >
                SoftSolutionIT.com
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
