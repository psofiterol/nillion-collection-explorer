import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { NavbarClient } from "./navbar-client";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Nillion Collection Explorer",
  description:
    "Demo UI for creating and managing Nillion secretvaults collections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/nillion.css" />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="d13cfe55-48d4-40bb-a481-e55dc812395b"
        ></script>
      </head>
      <body>
        <ClientProviders>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-nillion-border bg-nillion-bg">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <a href="/" className="hover:opacity-80 transition-opacity">
                      <h1 className="text-2xl mb-0 font-heading">Nillion Collection Explorer</h1>
                    </a>
                  </div>
                  <nav className="flex items-center gap-4">
                    <NavLinks />
                    <NavbarClient />
                  </nav>
                </div>
              </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              {children}
            </main>

            <footer className="border-t border-nillion-border bg-nillion-bg mt-auto">
              <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                <div className="text-center">
                  <p className="text-sm text-nillion-text-secondary">
                    Built by{" "}
                    <a
                      href="https://x.com/0ceans404"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nillion-primary hover:underline"
                    >
                      Steph
                    </a>{" "}
                    | Check out the code or report bugs on{" "}
                    <a
                      href="https://github.com/oceans404/nillion-storage-tools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nillion-primary hover:underline"
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
