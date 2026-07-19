"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../context/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/tournament", label: "Tournament" },
  { href: "/contact", label: "Contact Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuthContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const loginHref = useMemo(() => {
    const nextPath = pathname && pathname !== "/login" ? pathname : "/";
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const renderAuthControls = () => (
    <>
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
              setMenuOpen(false);
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
          onClick={() => setMenuOpen(false)}
          className="rounded-full border border-green-600 bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          Login
        </Link>
      )}
    </>
  );

  return (
    <header className="no-print sticky top-0 z-50 border-b border-green-800/50 bg-[#07110a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[0.25em] text-[#dff5d6] uppercase"
        >
          Snooker Syndicate
        </Link>

        <div className="hidden items-center gap-4 sm:gap-6 md:flex">
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
          <div className="flex items-center gap-3">{renderAuthControls()}</div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-green-800/40 p-2 text-[#dff5d6] transition hover:border-green-600 hover:text-white md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          className="border-t border-green-800/40 px-4 py-4 md:hidden sm:px-6"
        >
          <nav className="flex flex-col gap-3 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2 text-[#b9d7b2] transition hover:bg-[#0d1710] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col items-start gap-3 border-t border-green-800/30 pt-4">
            {renderAuthControls()}
          </div>
        </div>
      ) : null}
    </header>
  );
}
