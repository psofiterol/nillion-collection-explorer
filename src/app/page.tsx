"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-full">
      <div className="container mx-auto px-6 pt-12 pb-12">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-16">
            <div className="inline-block mb-8">
              <h1 className="text-5xl mb-6">Nillion Collection Explorer</h1>
              <div className="h-px bg-gradient-to-r from-transparent via-nillion-border to-transparent"></div>
            </div>
            <p className="text-xl mb-12 leading-relaxed max-w-3xl mx-auto text-nillion-text-secondary">
              Builder tools for creating and managing{" "}
              <a
                href="https://docs.nillion.com/build/private-storage/overview"
                target="_blank"
                rel="noopener noreferrer"
              >
                Nillion Private Storage
              </a>{" "}
              schemas, collections, and records.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => router.push("/collections")}
                className="nillion-button-outline nillion-large"
              >
                View Collections →
              </button>
              <button
                onClick={() => router.push("/create-collection")}
                className="nillion-large"
              >
                Create Collection Schema
              </button>
            </div>
          </div>

          {/* Creation Methods */}
          <div className="mb-24 relative">
            <div className="text-center mb-16">
              <h2 className="mb-4">Two Ways to Create Collections</h2>
              <div className="w-24 h-px bg-nillion-border mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="nillion-card">
                <div className="text-5xl mb-6 text-center">🛠️</div>
                <h3 className="text-center">Build Custom Schema</h3>
                <ul className="space-y-4 mb-8 text-nillion-text-secondary list-disc list-inside">
                  <li>Visual schema builder interface</li>
                  <li>Add fields with types and constraints</li>
                  <li>Mark fields as secret for encryption</li>
                  <li>Live schema preview</li>
                </ul>
                <button
                  onClick={() => router.push("/create-collection")}
                  className="w-full"
                >
                  Start Building →
                </button>
              </div>

              <div className="nillion-card">
                <div className="text-5xl mb-6 text-center">📄</div>
                <h3 className="text-center">Upload JSON Schema</h3>
                <ul className="space-y-4 mb-8 text-nillion-text-secondary list-disc list-inside">
                  <li>Paste your existing JSON schema</li>
                  <li>Automatic validation and formatting</li>
                  <li>Perfect for developers with schemas</li>
                  <li>Faster for complex structures</li>
                </ul>
                <button
                  onClick={() => router.push("/create-collection?tab=upload")}
                  className="w-full"
                >
                  Upload Schema →
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="text-center mb-16">
              <h2 className="mb-4">Collection Types</h2>
              <div className="w-24 h-px bg-nillion-border mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
              <div className="text-center space-y-6">
                <div className="text-6xl mb-8">🌐</div>
                <h3>Standard Collections</h3>
                <div className="w-16 h-px bg-nillion-border mx-auto"></div>
                <div className="space-y-4 text-nillion-text-secondary leading-relaxed">
                  <p>Managed by builders</p>
                  <p>Used for application data</p>
                  <p>Can contain encrypted or plaintext data</p>
                  <p>Support indexing and queries</p>
                </div>
              </div>

              <div className="text-center space-y-6">
                <div className="text-6xl mb-8">🚧</div>
                <h3>User Owned Collections</h3>
                <div className="w-16 h-px bg-nillion-border mx-auto"></div>
                <div className="space-y-4 text-nillion-text-secondary leading-relaxed">
                  <p>
                    <strong>🚧 Support coming soon! 🚧</strong>
                  </p>
                  <p>Store user-owned private data</p>
                  <p>Each document has individual ACLs</p>
                  <p>Users control access permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
