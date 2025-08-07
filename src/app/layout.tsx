import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import { NavbarClient } from './navbar-client';

export const metadata: Metadata = {
  title: 'Nillion Storage Tools',
  description:
    'Demo UI for creating and managing Nillion secretvaults collections',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="d13cfe55-48d4-40bb-a481-e55dc812395b"></script>
      </head>
      <body className="antialiased">
        <ClientProviders>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-xl border-b-2 border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                  <div className="flex items-center">
                    <a
                      href="/"
                      className="text-2xl font-light tracking-tight text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-300"
                    >
                      Nillion Storage Tools
                    </a>
                  </div>
                  <nav className="flex items-center space-x-8">
                    <a
                      href="/collections"
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 font-light tracking-wide"
                    >
                      Collections
                    </a>
                    <a
                      href="/create-collection"
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 font-light tracking-wide"
                    >
                      Add Collection
                    </a>
                    <NavbarClient />
                  </nav>
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {children}
            </main>

            <footer className="mt-auto border-t-2 border-gray-200 dark:border-gray-700 py-8">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 font-light tracking-wide">
                    Built by{' '}
                    <a
                      href="https://x.com/0ceans404"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-300 font-medium tracking-tight"
                    >
                      Steph
                    </a>{' '}
                    | Check out the code or report bugs on{' '}
                    <a
                      href="https://github.com/oceans404/nillion-storage-tools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-300 font-medium tracking-tight"
                    >
                      GitHub
                    </a>
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
