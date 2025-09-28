'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © {currentYear} DevDocs. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            <span className="text-sm text-gray-500">
              Powered by{' '}
              <Link 
                href="https://softsolutionit.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
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
