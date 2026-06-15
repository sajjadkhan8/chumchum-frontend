"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Coffee,
  ChevronRight,
  Hotel,
  IceCreamBowl,
  Instagram,
  MapPin,
  Menu,
  Pizza,
  Play,
  Search,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const categories = [
  { label: "Restaurants", icon: Utensils },
  { label: "Food vloggers", icon: Camera },
  { label: "Cafes", icon: Coffee },
  { label: "Fast food", icon: Pizza },
  { label: "Desserts", icon: IceCreamBowl },
  { label: "Hotels", icon: Hotel },
  { label: "Lahore", icon: MapPin },
];

const creators = [
  { name: "Areeba Khan", niche: "Cafe finds & lifestyle", followers: "184K", position: "50% 17%" },
  { name: "Hamza Ali", niche: "Street food & film", followers: "92K", position: "84% 20%" },
  { name: "Maham Noor", niche: "Recipes & restaurant reviews", followers: "128K", position: "51% 80%" },
  { name: "Saad Raza", niche: "Hotels & travel dining", followers: "210K", position: "15% 58%" },
];

const fadeUp = {
  initial: false as const,
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55 },
};

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="ZingZing home">
      <span className={`grid size-8 place-items-center rounded-xl font-black ${light ? "bg-white text-[#2d6b4e]" : "bg-[#2d6b4e] text-white"}`}>
        Z
      </span>
      <span className={`text-lg font-extrabold tracking-[-0.04em] ${light ? "text-white" : "text-[#163b2a]"}`}>
        Zing<span className={light ? "text-[#f4bd55]" : "text-[#e3a52f]"}>Zing</span>
      </span>
    </Link>
  );
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <motion.div {...fadeUp} className="max-w-xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#b77a12]">{eyebrow}</p>
      <h2 className="text-3xl font-extrabold tracking-[-0.045em] text-[#1e3d2e] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[#5e6c64]">{copy}</p>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const shouldRedirect = hasHydrated && isAuthenticated && Boolean(user?.role);
  const redirectPath = user?.role === "creator" ? "/creator/dashboard" : "/brand/dashboard";

  useEffect(() => {
    if (shouldRedirect) router.replace(redirectPath);
  }, [redirectPath, router, shouldRedirect]);

  if (shouldRedirect) return null;

  return (
    <main className="min-h-screen bg-[#fbfaf5] text-[#1e3d2e]">
      <header className="sticky top-0 z-50 border-b border-[#dfe5dd]/80 bg-[#fbfaf5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#526259] md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[#2d6b4e]">How it works</a>
            <a href="#opportunity" className="transition-colors hover:text-[#2d6b4e]">Opportunities</a>
            <a href="#creators" className="transition-colors hover:text-[#2d6b4e]">Creators</a>
            <Link href="/pricing" className="transition-colors hover:text-[#2d6b4e]">Pricing</Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="px-3 py-2 text-sm font-bold text-[#2f5243]">Sign in</Link>
            <Link href="/signup" className="rounded-full bg-[#2d6b4e] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f5239]">
              Join ZingZing
            </Link>
          </div>
          <details className="group md:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-[#d8dfd8]" aria-label="Toggle navigation">
              <Menu className="size-5" />
            </summary>
            <nav className="absolute left-0 right-0 top-16 border-t border-[#dfe5dd] bg-[#fbfaf5] px-5 py-5 shadow-lg">
              <div className="mx-auto flex max-w-7xl flex-col gap-1 font-semibold">
                <a href="#how-it-works" className="rounded-xl px-3 py-3 hover:bg-[#e6eceb]">How it works</a>
                <a href="#opportunity" className="rounded-xl px-3 py-3 hover:bg-[#e6eceb]">Opportunities</a>
                <a href="#creators" className="rounded-xl px-3 py-3 hover:bg-[#e6eceb]">Creators</a>
                <Link href="/pricing" className="rounded-xl px-3 py-3 hover:bg-[#e6eceb]">Pricing</Link>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/login" className="rounded-full border border-[#ccd7ce] px-4 py-3 text-center">Sign in</Link>
                  <Link href="/signup" className="rounded-full bg-[#2d6b4e] px-4 py-3 text-center text-white">Join</Link>
                </div>
              </div>
            </nav>
          </details>
        </div>
      </header>

      <section className="overflow-hidden border-b border-[#e3e7e0]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d5dfd5] bg-white px-3.5 py-2 text-xs font-bold text-[#496159] shadow-sm">
              <span className="size-2 rounded-full bg-[#e6aa38]" />
              Built first for food & hospitality
            </div>
            <h1 className="max-w-2xl text-[clamp(2.75rem,7vw,5.4rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-[#1e3d2e]">
              Turn local cravings into loyal communities.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5a6b61]">
              ZingZing helps restaurants, cafes, hotels, and food creators build campaigns that bring people through the door. Built for food first, ready for every category.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/brand/explore" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2d6b4e] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1f5239]">
                Find creators <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/signup?role=creator" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#cbd7cd] bg-white px-6 py-3.5 text-sm font-bold text-[#2f5243] transition hover:border-[#2d6b4e]">
                I&apos;m a creator <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 border-t border-[#d1ddd6] pt-6">
              {[
                ["5,000+", "creators"],
                ["500+", "businesses"],
                ["25K+", "collaborations"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-xl font-extrabold tracking-tight text-[#1e3d2e]">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-[#718077]">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-4 top-12 z-10 rounded-2xl border border-white/70 bg-white/95 p-3.5 shadow-xl shadow-[#1e3d2e]/10 backdrop-blur sm:left-0">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[#f7e8c8] text-[#9b6712]"><BadgeCheck className="size-5" /></span>
                <div><p className="text-xs font-extrabold">Verified creators</p><p className="text-[11px] text-[#718077]">Real reach. Clear insights.</p></div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#f2efe5] shadow-[0_28px_80px_rgba(38,70,50,0.14)]">
              <Image
                src="/landing/hero-creator-collage.png"
                alt="A collage of Pakistani creators working across fashion, film, food, and lifestyle"
                width={1536}
                height={1024}
                loading="eager"
                className="aspect-[1.08/1] h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 right-3 rounded-2xl bg-[#e6aa38] px-4 py-3 text-[#1e3d2e] shadow-lg sm:right-8">
              <p className="text-xs font-bold">New collaboration</p>
              <p className="mt-0.5 text-sm font-extrabold">Restaurant tasting · Lahore</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-[#e3e7e0] bg-white">
        <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto px-5 py-5 lg:px-8">
          {categories.map(({ label, icon: Icon }) => (
            <Link key={label} href={`/brand/explore?search=${encodeURIComponent(label)}`} className="flex shrink-0 items-center gap-2 text-sm font-bold text-[#526259] transition hover:text-[#2d6b4e]">
              <Icon className="size-4 text-[#b47a18]" /> {label}
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="One network, two paths"
          title="From discovery to dinner tables."
          copy="Restaurants and hospitality teams can find the right local voices, while creators get clearer opportunities, deliverables, and conversations in one calm place."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <motion.article {...fadeUp} className="rounded-[1.75rem] bg-[#2d6b4e] p-7 text-white sm:p-9">
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/12"><Search className="size-5" /></span>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#b9d5c4]">For food businesses</span>
            </div>
            <h3 className="mt-16 max-w-sm text-3xl font-extrabold tracking-[-0.04em]">Find creators who make people hungry.</h3>
            <p className="mt-4 max-w-md leading-7 text-[#c2d8cb]">Discover local food vloggers, invite them to tastings, agree on deliverables, and follow every promotion without spreadsheet archaeology.</p>
            <Link href="/brand/explore" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#2d6b4e]">
              Explore creators <ArrowRight className="size-4" />
            </Link>
          </motion.article>
          <motion.article {...fadeUp} transition={{ duration: 0.55, delay: 0.08 }} className="rounded-[1.75rem] border border-[#d1ddd6] bg-[#f1eee3] p-7 sm:p-9">
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-white"><Camera className="size-5 text-[#b77a12]" /></span>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a6b4e]">For creators</span>
            </div>
            <h3 className="mt-16 max-w-sm text-3xl font-extrabold tracking-[-0.04em]">Turn your point of view into better work.</h3>
            <p className="mt-4 max-w-md leading-7 text-[#647168]">Show your strengths, package deliverables, discover fitting offers, and manage every agreement with confidence.</p>
            <Link href="/signup?role=creator" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#2d6b4e] px-5 py-3 text-sm font-bold text-white">
              Build your profile <ArrowRight className="size-4" />
            </Link>
          </motion.article>
        </div>
      </section>

      <section id="opportunity" className="bg-[#1e3d2e] px-5 py-20 text-white lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#244c39] lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div {...fadeUp} className="flex flex-col justify-center p-7 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f0c56e]">Featured opportunity</p>
            <h2 className="mt-4 max-w-lg text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">Put a new Lahore burger on everyone&apos;s feed.</h2>
            <p className="mt-5 max-w-xl leading-7 text-[#c6d8cc]">A growing fast-casual restaurant is inviting food vloggers for a tasting and a warm, honest short-form review.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold">
              {["Hosted tasting + PKR 25K", "Instagram + TikTok", "2 short videos", "Lahore creators"].map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/8 px-3 py-2">{item}</span>
              ))}
            </div>
            <Link href="/signup?role=creator" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#e8ad3c] px-5 py-3 text-sm font-extrabold text-[#1e3d2e]">
              View opportunity <ArrowRight className="size-4" />
            </Link>
          </motion.div>
          <div className="relative min-h-[340px]">
            <Image src="/landing/restaurant-opportunity.png" alt="A food vlogger recording a restaurant burger, fries, drink, and dessert" fill className="object-cover" />
            <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 p-4 text-[#1e3d2e] shadow-xl">
              <p className="flex items-center gap-1 text-xs font-extrabold"><ShieldCheck className="size-4 text-[#2d6b4e]" /> Brand verified</p>
              <p className="mt-1 text-[11px] text-[#6b7870]">Applications close in 6 days</p>
            </div>
          </div>
        </div>
      </section>

      <section id="creators" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <SectionIntro eyebrow="Food voices worth knowing" title="Creators who know what tastes good." copy="Meet food vloggers, recipe creators, cafe explorers, and hospitality storytellers building trusted local communities." />
          <Link href="/brand/explore" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#2d6b4e]">Explore everyone <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {creators.map((creator, index) => (
            <motion.article key={creator.name} {...fadeUp} transition={{ duration: 0.5, delay: index * 0.06 }} className="group overflow-hidden rounded-[1.5rem] border border-[#d1ddd6] bg-white">
              <div className="relative aspect-[0.88/1] overflow-hidden bg-[#e9ece5]">
                <Image src="/landing/hero-creator-collage.png" alt={creator.name} fill className="scale-[2.2] object-cover transition duration-500 group-hover:scale-[2.28]" style={{ objectPosition: creator.position }} />
                <span className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-[#2d6b4e] shadow"><BadgeCheck className="size-4" /></span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-extrabold tracking-tight">{creator.name}</h3>
                <p className="mt-1 text-xs font-semibold text-[#738078]">{creator.niche}</p>
                <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[#365442]"><Instagram className="size-3.5" /> {creator.followers}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e0e5df] bg-[#f0eee5] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative min-h-[430px] overflow-hidden rounded-[2rem]">
            <Image src="/landing/case-study-marketing-manager.png" alt="A Pakistani marketing manager seated in a calm studio" fill className="object-cover" />
            <span className="absolute bottom-5 left-5 grid size-12 place-items-center rounded-full bg-white text-[#2d6b4e] shadow-lg"><Play className="ml-0.5 size-5 fill-current" /></span>
          </div>
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b77a12]">Built for real working relationships</p>
            <blockquote className="mt-5 text-3xl font-extrabold leading-tight tracking-[-0.045em] text-[#1e3d2e] sm:text-5xl">
              “The right local creators helped us turn one tasting night into weeks of real customer conversations.”
            </blockquote>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#637168]">With relevant food creators and deliverables agreed up front, the restaurant launched quickly, filled tables, and built relationships for future menu drops.</p>
            <div className="mt-8 flex items-center gap-4 border-t border-[#d3d9d2] pt-6">
              <div><p className="font-extrabold">Maya Hassan</p><p className="text-sm text-[#738078]">Marketing Director, The Olive Table</p></div>
              <div className="ml-auto flex gap-5">
                <div><p className="text-lg font-extrabold">2.4×</p><p className="text-xs text-[#738078]">table inquiries</p></div>
                <div><p className="text-lg font-extrabold">12 days</p><p className="text-xs text-[#738078]">to launch</p></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8 lg:py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-7xl rounded-[2rem] bg-[#e8ad3c] px-6 py-12 text-center text-[#1e3d2e] sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Ready when you are</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-[-0.055em] sm:text-6xl">Make your next launch worth tasting.</h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-[#59471f]">Join the network where food businesses and creators meet with clarity, mutual respect, and better ideas. Other categories are welcome too.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup?role=brand" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1e3d2e] px-6 py-3.5 text-sm font-bold text-white">Join as a brand <ArrowRight className="size-4" /></Link>
            <Link href="/signup?role=creator" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1e3d2e]/25 bg-white/45 px-6 py-3.5 text-sm font-bold">Join as a creator <ArrowRight className="size-4" /></Link>
          </div>
        </motion.div>
      </section>

      <footer className="bg-[#1e3d2e] px-5 py-10 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <Wordmark light />
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#c3d4c8]">
            <Link href="/about">About</Link><Link href="/help">Help</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link>
          </div>
          <p className="text-xs text-[#9fb4a6]">© 2026 ZingZing</p>
        </div>
      </footer>
    </main>
  );
}
