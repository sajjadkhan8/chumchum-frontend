'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, ShieldCheck } from 'lucide-react';

type AuthShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  hideMobileHeader?: boolean;
};

export function AuthWordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ZingZing home">
      <span className={`grid size-8 place-items-center rounded-xl text-sm font-black ${light ? 'bg-white text-[#2d6b4e]' : 'bg-[#2d6b4e] text-white'}`}>
        Z
      </span>
      <span className={`text-lg font-extrabold tracking-[-0.04em] ${light ? 'text-white' : 'text-[#163b2a]'}`}>
        Zing<span className={light ? 'text-[#f4bd55]' : 'text-[#e3a52f]'}>Zing</span>
      </span>
    </Link>
  );
}

export function AuthShell({ children, eyebrow, title, description, hideMobileHeader = false }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#fbfaf5] text-[#1e3d2e]">
      <div className="mx-auto grid max-w-[1600px] lg:min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,0.72fr)]">
        <section className="relative hidden overflow-hidden bg-[#1e3d2e] p-8 text-white lg:flex lg:flex-col xl:p-12">
          {!hideMobileHeader && (
            <div className="relative z-10 flex items-center justify-between">
              <AuthWordmark light />
              <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#c2d8cb] transition hover:text-white">
                <ArrowLeft className="size-4" />
                Back home
              </Link>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`relative z-10 max-w-xl pb-8 ${hideMobileHeader ? 'my-auto py-10' : 'mt-auto pt-16'}`}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-bold text-[#f0c56e]">
              <span className="size-2 rounded-full bg-[#e6aa38]" />
              {eyebrow}
            </div>
            <h1 className="text-[clamp(2.7rem,5vw,4.8rem)] font-extrabold leading-[0.98] tracking-[-0.06em] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#c2d8cb]">{description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="relative z-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#244c39] shadow-2xl shadow-black/15"
          >
            <Image
              src="/landing/hero-creator-collage.png"
              alt="Pakistani creators working across food, lifestyle, and hospitality"
              width={1536}
              height={1024}
              priority
              loading="eager"
              className="aspect-[2.15/1] w-full object-cover opacity-90"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-[#1e3d2e]/90 p-5 backdrop-blur-sm">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                  <ShieldCheck className="size-4 text-[#f0c56e]" />
                  Built for trusted collaborations
                </p>
                <p className="mt-1 text-[11px] text-[#c2d8cb]">Clear opportunities. Real local reach.</p>
              </div>
              <span className="hidden rounded-full bg-[#e6aa38] px-3 py-2 text-[11px] font-extrabold text-[#1e3d2e] xl:inline-flex">
                Food first
              </span>
            </div>
          </motion.div>

          <div className="relative z-10 mt-5 flex items-center justify-between text-[11px] font-semibold text-[#97b3a6]">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-3.5 text-[#f0c56e]" /> Verified creator network</span>
            <span>25K+ collaborations</span>
          </div>
        </section>

        <section className={`flex flex-col px-4 pb-6 sm:px-6 sm:pb-8 lg:min-h-screen lg:justify-center lg:px-10 lg:py-0 xl:px-16 ${hideMobileHeader ? 'pt-6' : 'pt-2'}`}>
          {!hideMobileHeader && (
            <div className="mx-auto flex w-full max-w-[540px] items-center justify-between px-1 py-1.5 lg:hidden">
              <AuthWordmark />
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5e6c64]">
                <ArrowLeft className="size-3.5" />
                Home
              </Link>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-full max-w-[540px] rounded-[1.75rem] border border-[#d1ddd6] bg-white p-5 shadow-[0_24px_70px_rgba(38,70,50,0.10)] sm:p-7 lg:p-8"
          >
            {children}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
