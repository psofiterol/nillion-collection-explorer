'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <Link 
        href="/collections" 
        className={`font-heading transition-colors ${
          isActive('/collections') 
            ? 'text-nillion-primary' 
            : 'text-nillion-text-secondary hover:text-nillion-primary'
        }`}
      >
        Collections
      </Link>
      <Link 
        href="/create-collection" 
        className={`font-heading transition-colors ${
          isActive('/create-collection') 
            ? 'text-nillion-primary' 
            : 'text-nillion-text-secondary hover:text-nillion-primary'
        }`}
      >
        Add Collection
      </Link>
    </>
  );
}