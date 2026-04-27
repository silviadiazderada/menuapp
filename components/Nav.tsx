'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '/menu', label: 'Weekly Menu', icon: '📅' },
  { href: '/recipes', label: 'Recipes', icon: '📖' },
  { href: '/pantry', label: 'Pantry', icon: '🥫' },
  { href: '/shopping', label: 'Shopping List', icon: '🛒' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-orange-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-orange-600 mr-3">🍽️ MenuApp</span>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
