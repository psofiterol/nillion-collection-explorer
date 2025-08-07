'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 pt-12 pb-12">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-16">
            <div className="inline-block mb-8">
              <h1 className="text-6xl font-light tracking-tight text-gray-900 dark:text-gray-100 mb-6">
                Nillion Storage Tools
              </h1>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            </div>
            <p className="text-2xl font-light text-gray-600 dark:text-gray-400 mb-12 leading-relaxed max-w-3xl mx-auto">
              Builder tools for creating and managing{' '}
              <a
                href="https://docs.nillion.com/build/private-storage/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-300 font-medium tracking-tight underline decoration-2 underline-offset-4 hover:decoration-gray-900 dark:hover:decoration-gray-100"
              >
                Nillion Private Storage
              </a>{' '}
              schemas, collections, and records.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => router.push('/create-collection')}
                className="group px-10 py-4 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium text-lg tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center">
                  View Collections
                  <svg
                    className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => router.push('/create-collection')}
                className="group px-10 py-4 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium text-lg tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center">
                  Create Collection Schema
                  <svg
                    className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Creation Methods */}
          <div className="mb-24 relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light tracking-wide text-gray-900 dark:text-gray-100 mb-4">
                Two Ways to Create Collections
              </h2>
              <div className="w-24 h-px bg-gray-300 dark:bg-gray-600 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 transform rotate-1 rounded-none group-hover:rotate-0 transition-transform duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 p-10 shadow-xl border border-gray-200 dark:border-gray-700 rounded-none">
                  <div className="text-5xl mb-6 text-center opacity-20">🛠️</div>
                  <h3 className="text-3xl font-light mb-6 text-gray-900 dark:text-gray-100 text-center tracking-wide">
                    Build Custom Schema
                  </h3>
                  <div className="space-y-4 mb-8 text-gray-600 dark:text-gray-400">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Visual schema builder interface</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Add fields with types and constraints</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Mark fields as secret for encryption</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Live schema preview</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/create-collection')}
                    className="w-full py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                  >
                    Start Building →
                  </button>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 transform -rotate-1 rounded-none group-hover:rotate-0 transition-transform duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 p-10 shadow-xl border border-gray-200 dark:border-gray-700 rounded-none">
                  <div className="text-5xl mb-6 text-center opacity-20">📄</div>
                  <h3 className="text-3xl font-light mb-6 text-gray-900 dark:text-gray-100 text-center tracking-wide">
                    Upload JSON Schema
                  </h3>
                  <div className="space-y-4 mb-8 text-gray-600 dark:text-gray-400">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Paste your existing JSON schema</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Automatic validation and formatting</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Perfect for developers with schemas</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Faster for complex structures</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/create-collection?tab=upload')}
                    className="w-full py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                  >
                    Upload Schema →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light tracking-wide text-gray-900 dark:text-gray-100 mb-4">
                Collection Types
              </h2>
              <div className="w-24 h-px bg-gray-300 dark:bg-gray-600 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
              <div className="text-center space-y-6">
                <div className="text-6xl opacity-10 mb-8">🌐</div>
                <h3 className="text-3xl font-light text-gray-900 dark:text-gray-100 tracking-wide">
                  Standard Collections
                </h3>
                <div className="w-16 h-px bg-gray-300 dark:bg-gray-600 mx-auto"></div>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                  <p>Managed by builders</p>
                  <p>Used for application data</p>
                  <p>Can contain encrypted or plaintext data</p>
                  <p>Support indexing and queries</p>
                </div>
              </div>

              <div className="text-center space-y-6">
                <div className="text-6xl opacity-10 mb-8">👤</div>
                <h3 className="text-3xl font-light text-gray-900 dark:text-gray-100 tracking-wide">
                  Owned Collections
                </h3>
                <div className="w-16 h-px bg-gray-300 dark:bg-gray-600 mx-auto"></div>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                  <p>Store user-owned private data</p>
                  <p>Each document has individual ACLs</p>
                  <p>Users control access permissions</p>
                  <p>Support fine-grained permission types</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
