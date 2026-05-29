'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, TrendingUp, Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AmbassadorCard } from '@/components/ambassador-card';
import { CreatorCard } from '@/components/creator-card';
import { BottomNav } from '@/components/bottom-nav';
import { ambassadorService, type AmbassadorBenefit } from '@/services/ambassador.service';
import { creatorsService } from '@/services/creators.service';
import type { Creator, PlatformAmbassador } from '@/types';
import Link from 'next/link';

export default function AmbassadorsBrowsePage() {
  const [showAll, setShowAll] = useState(false);
  const [ambassadors, setAmbassadors] = useState<PlatformAmbassador[]>([]);
  const [benefits, setBenefits] = useState<AmbassadorBenefit[]>([]);
  const [independentCreators, setIndependentCreators] = useState<Creator[]>([]);

  const displayedAmbassadors = useMemo(
    () => (showAll ? ambassadors : ambassadors.slice(0, 3)),
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

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-block">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Crown className="mr-1 h-3 w-3" />
                Verified & Curated
              </Badge>
            </div>
            <h1 className="mb-4 text-4xl font-bold">Platform Ambassadors</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Direct access to KSA's most trusted creators, verified by our platform.
              These curated influencers are committed to delivering quality results.
            </p>
          </motion.div>

          {/* Why Ambassadors Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 grid gap-4 md:grid-cols-3"
          >
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Pre-Verified Quality</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Each creator has been thoroughly verified for engagement and brand safety.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Reliable Partnerships</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Platform-managed relationships with professional service standards.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Dedicated Support</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our team manages the entire relationship for your peace of mind.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Platform Ambassadors Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-bold">Our Ambassadors</h2>
              <p className="text-muted-foreground">Elite creators trusted by major Saudi brands</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedAmbassadors.map((ambassador, idx) => (
                <motion.div
                  key={ambassador.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <AmbassadorCard ambassador={ambassador} />
                </motion.div>
              ))}
            </div>

            {!showAll && ambassadors.length > 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 text-center"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowAll(true)}
                >
                  View All {ambassadors.length} Ambassadors
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="mb-8 text-3xl font-bold">Why Choose Platform Ambassadors?</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="mb-3 text-4xl">{benefit.icon}</div>
                    <h3 className="mb-2 font-bold text-sm">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Also Explore Independent Creators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-bold">Also Explore Independent Creators</h2>
              <p className="text-muted-foreground">
                Browse our full creator marketplace for emerging talent and niche specialists.
              </p>
            </div>

            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {independentCreators.map((creator, idx) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <CreatorCard creator={creator} />
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/brand/explore">
                <Button size="lg" variant="outline" className="rounded-full">
                  Browse All Creators
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Platform Ambassadors vs Independent Creators</CardTitle>
                <CardDescription>Choose the right creator tier for your campaign needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-3 font-semibold">Feature</th>
                        <th className="pb-3 font-semibold text-primary">Platform Ambassadors</th>
                        <th className="pb-3 font-semibold">Independent Creators</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-3">
                      {[
                        {
                          feature: 'Platform Vetting',
                          ambassador: true,
                          independent: false,
                        },
                        {
                          feature: 'Quality Assurance',
                          ambassador: true,
                          independent: false,
                        },
                        {
                          feature: 'Dedicated Support',
                          ambassador: true,
                          independent: false,
                        },
                        {
                          feature: 'Direct Creator Control',
                          ambassador: false,
                          independent: true,
                        },
                        {
                          feature: 'Flexible Pricing',
                          ambassador: false,
                          independent: true,
                        },
                        {
                          feature: 'Niche Specialists',
                          ambassador: false,
                          independent: true,
                        },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-border last:border-0">
                          <td className="py-3 font-medium">{row.feature}</td>
                          <td className="py-3">
                            {row.ambassador ? (
                              <span className="text-primary">✓ Yes</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            {row.independent ? (
                              <span className="text-primary">✓ Yes</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 rounded-xl border border-border/50 bg-muted/30 p-8 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold">Ready to work with a Platform Ambassador?</h2>
            <p className="mb-6 text-muted-foreground">
              Contact our team to learn about exclusive partnership opportunities with verified creators.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-full">
                Request a Campaign
              </Button>
              <Button size="lg" variant="outline" className="rounded-full">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

