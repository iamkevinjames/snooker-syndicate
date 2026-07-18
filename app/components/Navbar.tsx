import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/tournament", label: "Tournament" },
  { href: "/contact", label: "Contact Us" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-green-800/50 bg-[#07110a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-[0.25em] text-[#dff5d6] uppercase">
          Snooker Syndicate
        </Link>
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
      </div>
    </header>
  );
}
