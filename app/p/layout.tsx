import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <header className="sticky top-0 z-40 border-b border-[#e0e8e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">
            Zing<span className="text-[#e3a52f]">Zing</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-[#d1ddd6] px-4 py-1.5 text-sm font-semibold text-[#496159] transition-colors hover:bg-[#f4f7f5]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#2d6b4e] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f5239]"
            >
              Join free
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
