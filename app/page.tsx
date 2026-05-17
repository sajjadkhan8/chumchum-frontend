"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  Star,
  ArrowRight,
  Play,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Zap,
  Shield,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { CreatorCard } from "@/components/creator-card";
import { BrandBanner } from "@/components/brand-banner";
import { BrandLogo } from "@/components/brand-logo";
import { creators } from "@/data/creators";
import { formatFollowers } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { BRAND } from "@/lib/brand";

const categories = [
  { id: "fashion", name: "Fashion", icon: "👗", count: 245 },
  { id: "tech", name: "Tech", icon: "💻", count: 189 },
  { id: "food", name: "Food", icon: "🍕", count: 312 },
  { id: "beauty", name: "Beauty", icon: "💄", count: 278 },
  { id: "fitness", name: "Fitness", icon: "💪", count: 156 },
  { id: "travel", name: "Travel", icon: "✈️", count: 198 },
  { id: "gaming", name: "Gaming", icon: "🎮", count: 167 },
  { id: "lifestyle", name: "Lifestyle", icon: "🌟", count: 234 },
];

const stats = [
  { label: "Active Creators", value: "5,000+", icon: Users },
  { label: "Campaigns Completed", value: "25,000+", icon: Zap },
  { label: "Brands Trust Us", value: "500+", icon: Shield },
];

export default function Home() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const trendingRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const trendingCreators = creators.slice(0, 8);
  const risingStars = creators.filter((c) => c.isTrending).slice(0, 6);
  const verifiedCreators = creators.filter((c) => c.isVerified).slice(0, 4);

  const handleScroll = () => {
    if (trendingRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trendingRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (trendingRef.current) {
      const scrollAmount = 320;
      trendingRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <BrandBanner variant="dark" priority className="mb-8 h-40 w-full sm:h-52" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="mb-4 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Saudi Arabia&apos;s First Influencer Marketplace
              </Badge>
            </motion.div>

            <motion.h1
              className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Connect with{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Top Creators
              </span>
              <br />
              in Saudi Arabia
            </motion.h1>

            <motion.p
              className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {BRAND.tagline} Find the perfect influencer for your brand or showcase your talent
              to thousands of businesses. Quick deals, instant messaging, and
              secure payments.
            </motion.p>

            <motion.div
              className="mx-auto mb-8 flex max-w-xl flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search creators, niches, or skills..."
                  className="h-12 pl-10 pr-4 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/brand/explore">
                  Explore Creators
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">
                    {stat.value}
                  </span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Browse Categories
              </h2>
              <p className="mt-1 text-muted-foreground">
                Find creators in your industry
              </p>
            </div>
            <Button variant="ghost" className="hidden md:flex" asChild>
              <Link href="/brand/explore">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/brand/explore?category=${category.id}`}>
                  <Card className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
                    <CardContent className="flex flex-col items-center p-4 text-center">
                      <span className="mb-2 text-3xl">{category.icon}</span>
                      <span className="font-medium text-foreground">
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {category.count} creators
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Creators Carousel */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Trending Creators
                </h2>
                <p className="text-muted-foreground">
                  Most booked this week
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={trendingRef}
            onScroll={handleScroll}
            className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4"
          >
            {trendingCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                className="w-[280px] flex-shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CreatorCard creator={creator} variant="compact" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rising Stars Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/30">
                <Star className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Rising Stars
                </h2>
                <p className="text-muted-foreground">
                  Emerging talent with great potential
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/brand/explore?filter=rising">
                Discover More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {risingStars.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CreatorCard creator={creator} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="scroll-mt-24 bg-gradient-to-b from-background to-muted/50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              How ZingZing Works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Get started in minutes with our simple, streamlined process
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse & Discover",
                description:
                  "Explore thousands of verified creators filtered by niche, location, price, and engagement rates.",
                icon: Search,
              },
              {
                step: "02",
                title: "Connect & Negotiate",
                description:
                  "Send a Quick Deal offer or message creators directly. Discuss requirements and finalize terms.",
                icon: Users,
              },
              {
                step: "03",
                title: "Execute & Pay",
                description:
                  "Track deliverables, approve content, and release secure payments upon completion.",
                icon: Shield,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.15 }}
              >
                <Card className="relative overflow-hidden border-border/50">
                  <CardContent className="p-6">
                    <span className="absolute -right-4 -top-4 text-8xl font-bold text-primary/5">
                      {item.step}
                    </span>
                    <div className="relative">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Verified Creators */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Verified Creators
                </h2>
                <p className="text-muted-foreground">
                  Trusted professionals with proven track records
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {verifiedCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CreatorCard creator={creator} variant="compact" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-panel py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <BrandBanner variant="light" className="mb-8 h-32 w-full sm:h-40" />
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Join thousands of brands and creators already using ZingZing to
              grow their business.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link href="/signup">
                  Sign Up as Creator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/signup">Find Creators</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-brand-panel py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4">
                <BrandLogo withText={false} iconSize={42} />
              </div>
              <p className="text-sm text-white/75">
                Saudi Arabia&apos;s first influencer marketplace connecting brands
                with verified creators.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">For Brands</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/brand/explore" className="hover:text-primary">
                    Find Creators
                  </Link>
                </li>
                <li>
                  <Link href="/brand/orders" className="hover:text-primary">
                    Manage Campaigns
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">
                For Creators
              </h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/signup" className="hover:text-primary">
                    Join as Creator
                  </Link>
                </li>
                <li>
                  <Link
                    href="/creator/dashboard"
                    className="hover:text-primary"
                  >
                    Creator Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-primary">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Support</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    About ZingZing
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-primary">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-white/15 pt-8 text-center text-sm text-white/60">
            <p>&copy; 2026 ZingZing. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
