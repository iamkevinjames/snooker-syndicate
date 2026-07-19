"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuthContext } from "../context/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/tournament", label: "Tournament" },
  { href: "/contact", label: "Contact Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuthContext();

  const loginHref = useMemo(() => {
    const nextPath = pathname && pathname !== "/login" ? pathname : "/";
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-green-800/50 bg-[#07110a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[0.25em] text-[#dff5d6] uppercase"
        >
          Snooker Syndicate
        </Link>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <nav className="flex gap-4 text-sm sm:gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#b9d7b2] transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-sm text-[#8fa58b]">Loading...</span>
            ) : user ? (
              <>
                <span className="max-w-[14rem] truncate rounded-full border border-green-800/30 bg-[#0d1710] px-3 py-2 text-sm text-[#dff5d6]">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void signOut();
                  }}
                  className="rounded-full border border-green-700/40 px-4 py-2 text-sm font-semibold text-[#dff5d6] transition hover:border-green-500 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href={loginHref}
                className="rounded-full border border-green-600 bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
