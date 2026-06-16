'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Crown,
  Handshake,
  MapPin,
  Megaphone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/bottom-nav';
import { ambassadorService, type AmbassadorBenefit } from '@/services/ambassador.service';
import { creatorsService } from '@/services/creators.service';
import type { Creator, PlatformAmbassador } from '@/types';
import { cn, formatFollowers, formatPrice } from '@/lib/utils';

const defaultBenefits = [
  {
    title: 'Managed creator relationship',
    description: 'ZingZing helps coordinate expectations, timelines, and quality standards before your campaign starts.',
  },
  {
    title: 'Brand-safe shortlist',
    description: 'Use ambassadors when your restaurant, hotel, cafe, or dessert brand needs a more trusted first impression.',
  },
  {
    title: 'Cleaner campaign delivery',
    description: 'Best for launch reels, tasting nights, stays, franchise openings, and high-visibility food promotions.',
  },
];

function profileImage(person: Creator) {
  return person.contentPreviews[0]?.thumbnail || person.coverImage || person.avatar;
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-white/8 px-2.5 py-2.5 backdrop-blur sm:p-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden size-9 shrink-0 place-items-center rounded-2xl bg-[#e6aa38] text-[#173b2a] sm:grid">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#d4e0d8] sm:text-[10px] sm:tracking-[0.15em]">{label}</p>
          <p className="mt-0.5 truncate text-base font-black tracking-[-0.04em] text-white sm:text-lg">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AmbassadorRow({ ambassador }: { ambassador: PlatformAmbassador }) {
  return (
    <article className="group overflow-hidden rounded-[1.45rem] border border-[#d9e0d8] bg-white shadow-[0_14px_45px_rgba(38,70,50,0.055)] transition hover:-translate-y-0.5 hover:border-[#b7c8bd] hover:shadow-[0_22px_70px_rgba(38,70,50,0.10)]">
      <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)_190px]">
        <div className="relative min-h-[190px] overflow-hidden md:min-h-full">
          <Image
            src={profileImage(ambassador)}
            alt={ambassador.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 768px) 220px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#173b2a]/80 via-transparent to-transparent" />
          <Badge className="absolute left-3 top-3 rounded-full bg-[#e6aa38] text-[11px] font-black text-[#173b2a]">
            <Crown className="mr-1 size-3" />
            Ambassador
          </Badge>
          {ambassador.isExclusive && (
            <Badge className="absolute bottom-3 left-3 rounded-full bg-white/90 text-[11px] font-black text-[#185c39]">
              Exclusive partner
            </Badge>
          )}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-12 border border-[#d9e0d8]">
                <AvatarImage src={ambassador.avatar} alt={ambassador.name} />
                <AvatarFallback className="bg-[#185c39] font-black text-white">{ambassador.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="line-clamp-1 text-xl font-black tracking-[-0.04em] text-[#173b2a]">{ambassador.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#718077]">
                  <MapPin className="size-3.5 text-[#b77a12]" />
                  {ambassador.city}
                </p>
              </div>
            </div>
            <div className="rounded-full bg-[#fff1cd] px-3 py-1.5 text-sm font-black text-[#8b5e12]">
              {ambassador.rating} rating
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#647168]">{ambassador.bio}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {ambassador.categories.slice(0, 4).map((category) => (
              <span key={category} className="rounded-full bg-[#f4f2e9] px-2.5 py-1 text-[11px] font-black text-[#607168]">
                {category}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-2 text-sm font-bold text-[#607168] sm:grid-cols-3">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
              <Users className="size-4 text-[#185c39]" />
              {formatFollowers(ambassador.totalFollowers)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
              <TrendingUp className="size-4 text-[#185c39]" />
              {ambassador.avgEngagementRate}% engagement
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
              <CalendarClock className="size-4 text-[#185c39]" />
              {ambassador.responseTime}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-[#edf0eb] bg-[#fbfaf5] p-4 md:border-l md:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">Managed from</p>
            <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-[#173b2a]">
              {formatPrice(ambassador.monthlyBase || ambassador.minPrice || 50000)}
            </p>
            <p className="mt-1 text-xs font-bold text-[#718077]">Platform support included</p>
          </div>
          <div className="grid gap-2">
            <Button asChild className="rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]">
              <Link href={`/creator/${ambassador.username}`}>
                View profile <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]">
              <Link href="/brand/offers/new">Start campaign</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CreatorMiniCard({ creator }: { creator: Creator }) {
  return (
    <Link
      href={`/creator/${creator.username}`}
      className="group rounded-[1.25rem] border border-[#d9e0d8] bg-white p-3 shadow-[0_12px_38px_rgba(38,70,50,0.05)] transition hover:-translate-y-0.5 hover:border-[#b7c8bd]"
    >
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-[1rem] bg-[#f4f2e9]">
          <Image src={profileImage(creator)} alt={creator.name} fill className="object-cover transition group-hover:scale-105" sizes="80px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-sm font-black text-[#173b2a]">{creator.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#718077]">
                <MapPin className="size-3 text-[#b77a12]" />
                {creator.city}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1cd] px-2 py-1 text-[11px] font-black text-[#8b5e12]">
              <Star className="size-3 fill-current" />
              {creator.rating}
            </span>
          </div>
          <p className="mt-2 line-clamp-1 text-xs font-bold text-[#607168]">{formatFollowers(creator.totalFollowers)} followers</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {creator.categories.slice(0, 2).map((category) => (
              <span key={category} className="rounded-full bg-[#f4f2e9] px-2 py-0.5 text-[10px] font-black text-[#607168]">
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AmbassadorsBrowsePage() {
  const [showAll, setShowAll] = useState(false);
  const [ambassadors, setAmbassadors] = useState<PlatformAmbassador[]>([]);
  const [benefits, setBenefits] = useState<AmbassadorBenefit[]>([]);
  const [independentCreators, setIndependentCreators] = useState<Creator[]>([]);

  const displayedAmbassadors = useMemo(
    () => (showAll ? ambassadors : ambassadors.slice(0, 4)),
    [ambassadors, showAll],
  );

  useEffect(() => {
    const loadData = async () => {
      const [ambassadorList, creatorList, benefitList] = await Promise.all([
        ambassadorService.listAmbassadors(24).catch(() => []),
        creatorsService.getAll().catch(() => []),
        ambassadorService.getBenefits(),
      ]);

      setAmbassadors(ambassadorList);
      setBenefits(benefitList);

      const ambassadorIds = new Set(ambassadorList.map((item) => item.id));
      setIndependentCreators(creatorList.filter((creator) => !ambassadorIds.has(creator.id)).slice(0, 6));
    };

    void loadData();
  }, []);

  const totalFollowers = useMemo(() => ambassadors.reduce((total, item) => total + item.totalFollowers, 0), [ambassadors]);
  const averageRating = useMemo(() => {
    if (!ambassadors.length) return 0;
    return ambassadors.reduce((total, item) => total + item.rating, 0) / ambassadors.length;
  }, [ambassadors]);
  const foodAmbassadors = useMemo(
    () => ambassadors.filter((item) => item.categories.some((category) => category.toLowerCase().includes('food') || category.toLowerCase().includes('restaurant'))).length,
    [ambassadors],
  );
  const renderedBenefits = benefits.length > 0 ? benefits.slice(0, 3) : defaultBenefits;

  return (
    <>
      <div className="min-h-screen bg-[#fbfaf5]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
            <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
              <motion.div initial={false} animate={{ opacity: 1 }} className="p-5 sm:p-6 lg:p-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                  <Crown className="size-3.5" />
                  Verified creator partners
                </div>
                <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4.5vw,4.1rem)] font-black leading-[0.98] tracking-[-0.06em]">
                  Ambassadors for restaurants that need trust fast.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#c7d8ce] sm:text-base">
                  Curated creators for food launches, tasting tables, hotel stays, cafe openings, ice cream drops, and high-visibility local campaigns.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-full bg-[#e6aa38] px-5 font-black text-[#173b2a] hover:bg-[#f0bb55]">
                    <Link href="/brand/offers/new">
                      Request campaign <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/8 px-5 font-black text-white hover:bg-white/12 hover:text-white">
                    <Link href="/brand/explore?search=food">
                      Explore food creators <Search className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <StatTile label="Ambassadors" value={String(ambassadors.length)} icon={BadgeCheck} />
                  <StatTile label="Reach" value={totalFollowers ? formatFollowers(totalFollowers) : 'Building'} icon={Users} />
                  <StatTile label="Avg rating" value={averageRating ? averageRating.toFixed(1) : 'New'} icon={Star} />
                </div>
              </motion.div>

              <aside className="hidden border-t border-white/10 bg-white/[0.06] p-5 sm:block sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f0c56e]">Best fit</p>
                <div className="mt-4 rounded-[1.35rem] border border-white/12 bg-[#102d20]/60 p-4">
                  <p className="text-lg font-black tracking-[-0.04em] text-white">Food-first shortlist</p>
                  <p className="mt-2 text-sm leading-6 text-[#c7d8ce]">
                    {foodAmbassadors > 0
                      ? `${foodAmbassadors} ambassadors currently map strongly to food or restaurant discovery.`
                      : 'Use ambassadors for your first few customers when trust matters more than browsing volume.'}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.15rem] border border-white/12 bg-white/8 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e0d8]">Managed</p>
                    <p className="mt-1 text-2xl font-black tracking-[-0.04em]">Yes</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/12 bg-white/8 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e0d8]">Brand safe</p>
                    <p className="mt-1 text-2xl font-black tracking-[-0.04em]">High</p>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Pre-vetted quality', copy: 'Shortlist creators with stronger delivery standards and cleaner brand fit.' },
              { icon: Handshake, title: 'Managed relationship', copy: 'Useful when restaurants need less back-and-forth and clearer expectations.' },
              { icon: Megaphone, title: 'Launch-ready reach', copy: 'Great for openings, tasting menus, stays, seasonal drops, and local buzz.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.35rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f4f2e9] text-[#b77a12]">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-black tracking-[-0.03em] text-[#173b2a]">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#647168]">{item.copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b77a12]">Curated roster</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[#173b2a]">Platform ambassadors</h2>
                </div>
                {!showAll && ambassadors.length > 4 && (
                  <Button
                    variant="outline"
                    className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]"
                    onClick={() => setShowAll(true)}
                  >
                    View all {ambassadors.length}
                  </Button>
                )}
              </div>

              {displayedAmbassadors.length > 0 ? (
                displayedAmbassadors.map((ambassador) => <AmbassadorRow key={ambassador.id} ambassador={ambassador} />)
              ) : (
                <div className="rounded-[1.45rem] border border-dashed border-[#cdd7ce] bg-white p-6 text-center shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f4f2e9] text-[#b77a12]">
                    <Crown className="size-5" />
                  </div>
                  <h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#173b2a]">Ambassadors are being curated.</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647168]">You can still browse food creators and start a campaign while the ambassador roster grows.</p>
                  <Button asChild className="mt-5 rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]">
                    <Link href="/brand/explore?search=food">Browse food creators</Link>
                  </Button>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.6rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b77a12]">Why choose them</p>
                <div className="mt-4 space-y-3">
                  {renderedBenefits.map((benefit, idx) => (
                    <div key={`${benefit.title}-${idx}`} className="rounded-[1.15rem] bg-[#fbfaf5] p-3">
                      <div className="flex gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#e7f0ea] text-sm font-black text-[#185c39]">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-[#173b2a]">{benefit.title}</h3>
                          <p className="mt-1 text-xs leading-5 text-[#647168]">{benefit.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#d9e0d8] bg-[#173b2a] p-4 text-white shadow-[0_18px_60px_rgba(23,59,42,0.14)]">
                <p className="inline-flex items-center gap-2 text-sm font-black text-[#f0c56e]">
                  <Sparkles className="size-4" />
                  Fast recommendation
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">Start with a tasting brief.</h2>
                <p className="mt-2 text-sm leading-6 text-[#c7d8ce]">For your first restaurants, invite 2-3 ambassadors for a tasting night and ask for one reel, stories, and location tags.</p>
                <Button asChild className="mt-4 w-full rounded-full bg-[#e6aa38] font-black text-[#173b2a] hover:bg-[#f0bb55]">
                  <Link href="/brand/offers/new">
                    Post tasting campaign <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </aside>
          </section>

          <section className="mt-5 rounded-[1.6rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_14px_45px_rgba(38,70,50,0.055)] sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b77a12]">Broader marketplace</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[#173b2a]">Independent creators to compare</h2>
              </div>
              <Button asChild variant="outline" className="rounded-full border-[#d9e0d8] bg-[#fbfaf5] font-black text-[#185c39] hover:bg-[#e7f0ea]">
                <Link href="/brand/explore">
                  Browse all <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {independentCreators.length > 0 ? (
                independentCreators.map((creator) => <CreatorMiniCard key={creator.id} creator={creator} />)
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-[#cdd7ce] bg-[#fbfaf5] p-5 text-sm font-bold text-[#647168] md:col-span-2 xl:col-span-3">
                  Independent creator suggestions will appear here once creators are available.
                </div>
              )}
            </div>
          </section>

          <section className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b77a12]">Ambassadors</p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-[#173b2a]">Best when trust matters.</h2>
              <div className="mt-4 space-y-2 text-sm font-bold text-[#607168]">
                {['Platform-vetted profiles', 'Managed support', 'Higher confidence for launches'].map((item) => (
                  <p key={item} className="flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                    <BadgeCheck className="size-4 text-[#185c39]" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b77a12]">Independent creators</p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-[#173b2a]">Best when variety matters.</h2>
              <div className="mt-4 space-y-2 text-sm font-bold text-[#607168]">
                {['More niche options', 'Flexible pricing', 'Direct creator discovery'].map((item) => (
                  <p key={item} className="flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                    <Wallet className="size-4 text-[#185c39]" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
