'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BottomNav } from '@/components/bottom-nav';
import { AmbassadorEligibilityChecker } from '@/components/ambassador-eligibility-checker';
import { AmbassadorDetailedCard } from '@/components/ambassador-detailed-card';
import { useAuthStore } from '@/store/auth-store';
import { useAmbassadorStore } from '@/store/ambassador-store';
import { ambassadorService, type AmbassadorBenefit } from '@/services/ambassador.service';
import { creatorsService } from '@/services/creators.service';
import type { Creator } from '@/types';
import Link from 'next/link';

export default function AmbassadorProgramPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { fetchApplications, submitApplication, getApplicationStatus, loading } = useAmbassadorStore();
  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCreator, setCurrentCreator] = useState<Creator | null>(null);
  const [benefits, setBenefits] = useState<AmbassadorBenefit[]>([]);

  useEffect(() => {
    const loadPageData = async () => {
      const [creator, benefitList] = await Promise.all([
        creatorsService.getMe().catch(() => null),
        ambassadorService.getBenefits(),
      ]);
      setCurrentCreator(creator);
      setBenefits(benefitList);
    };

    void loadPageData();
  }, []);

  const resolvedApplicationStatus = currentCreator ? getApplicationStatus(currentCreator.id) : null;
  const applicationStatus =
    resolvedApplicationStatus ||
    (user?.creatorProgramStatus === 'active_ambassador' && currentCreator
      ? {
          id: 'demo-approved-ambassador',
          creatorId: currentCreator.id,
          creator: currentCreator,
          status: 'approved' as const,
          submittedAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-02-01'),
          verificationSteps: {
            identityVerified: true,
            engagementVerified: true,
            contentReviewPassed: true,
            backgroundCheckPassed: true,
          },
          notes: 'Active ambassador in good standing.',
          approvedAt: new Date('2024-02-01'),
        }
      : null);

  const handleApplyClick = async () => {
    if (!currentCreator) return;
    setIsSubmitting(true);
    try {
      await submitApplication(currentCreator.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'creator') {
    return (
      <>
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h1 className="mb-2 text-3xl font-bold">Creators Only</h1>
              <p className="mb-6 text-muted-foreground">
                Sign in as a creator to access the Platform Ambassador program.
              </p>
              <Link href="/login">
                <Button size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-block">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Crown className="mr-1 h-3 w-3" />
                Exclusive Program
              </Badge>
            </div>
            <h1 className="mb-4 text-4xl font-bold">Platform Ambassador Program</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Join our network of verified creators. Earn guaranteed monthly income,
              access exclusive brands, and grow your influence with platform support.
            </p>
          </motion.div>

          {/* Application Status Section */}
          {currentCreator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              {applicationStatus && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {applicationStatus.status === 'approved' ? (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        ) : applicationStatus.status === 'rejected' ? (
                          <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Clock className="h-6 w-6 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="capitalize">
                            {applicationStatus.status === 'approved'
                              ? 'Welcome to the Program!'
                              : applicationStatus.status === 'rejected'
                                ? 'Application Rejected'
                                : `Application Status: ${applicationStatus.status.replace(/_/g, ' ')}`}
                          </CardTitle>
                          <CardDescription>
                            Last updated on {new Date(applicationStatus.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {applicationStatus.status === 'approved' && (
                        <Badge className="bg-primary/90 text-primary-foreground">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {applicationStatus.status === 'approved' && (
                      <Alert className="bg-muted/50 border-border/50">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <AlertDescription>
                          You're now part of our ambassador network. Check your dashboard for exclusive opportunities.
                        </AlertDescription>
                      </Alert>
                    )}

                    {applicationStatus.status === 'rejected' && applicationStatus.rejectionReason && (
                      <>
                        <Alert className="border-border/50 bg-muted/30">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <AlertDescription>
                            {applicationStatus.rejectionReason}
                          </AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground">
                          Please improve the mentioned areas and feel free to reapply after 30 days.
                        </p>
                      </>
                    )}

                    {(applicationStatus.status === 'submitted' || applicationStatus.status === 'under_review') && (
                      <>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Verification Progress:</p>
                          <div className="space-y-2">
                            {[
                              { step: 'Identity Verification', completed: applicationStatus.verificationSteps.identityVerified },
                              { step: 'Engagement Verification', completed: applicationStatus.verificationSteps.engagementVerified },
                              { step: 'Content Review', completed: applicationStatus.verificationSteps.contentReviewPassed },
                              { step: 'Background Check', completed: applicationStatus.verificationSteps.backgroundCheckPassed },
                            ].map((step, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {step.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                ) : (
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm text-muted-foreground">{step.step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {applicationStatus.notes && (
                          <p className="text-sm italic text-muted-foreground">
                            📝 Note: {applicationStatus.notes}
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Enhanced Gamified Eligibility & Score */}
          {currentCreator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <AmbassadorDetailedCard creator={currentCreator} className="mb-6" />
              {!applicationStatus && (
                <AmbassadorEligibilityChecker creator={currentCreator} />
              )}
            </motion.div>
          )}

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="mb-8 text-3xl font-bold">Program Benefits</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit, idx) => (
                <Card
                  key={idx}
                  className="border-border/50 transition-shadow hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-3 text-4xl">{benefit.icon}</div>
                    <h3 className="mb-2 font-bold text-sm">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Program Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12 space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💼</span> What is the Ambassador Program?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Our Platform Ambassador program is designed for dedicated creators who want to unlock premium earning potential
                  and exclusive partnership opportunities. As a platform ambassador, you'll receive:
                </p>
                <ul className="space-y-2 pl-4">
                  <li>✓ Monthly guaranteed base income starting from PKR 1,250,000</li>
                  <li>✓ Direct access to premium brands and enterprise clients</li>
                  <li>✓ Dedicated account manager for personalized support</li>
                  <li>✓ First access to exclusive and high-value campaigns</li>
                  <li>✓ Performance bonuses and incentives</li>
                  <li>✓ Professional platform support and content consultation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📋</span> Application Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: 'Submit Application',
                      desc: 'Complete your application with your creator profile information',
                    },
                    {
                      step: 2,
                      title: 'Identity Verification',
                      desc: 'Verify your identity with valid CNIC details',
                    },
                    {
                      step: 3,
                      title: 'Metrics Review',
                      desc: 'Our team verifies your follower count and engagement metrics',
                    },
                    {
                      step: 4,
                      title: 'Content Review',
                      desc: 'We review your content for brand safety and quality standards',
                    },
                    {
                      step: 5,
                      title: 'Background Check',
                      desc: 'Final compliance and background verification',
                    },
                    {
                      step: 6,
                      title: 'Approval & Onboarding',
                      desc: 'Get approved and start earning as a Platform Ambassador',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>❓</span> FAQ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold">Can I work with other platforms while being an ambassador?</p>
                  <p className="text-muted-foreground">
                    Ambassadors can work with other platforms, but exclusive brand deals may have non-compete clauses.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">How long does the application process take?</p>
                  <p className="text-muted-foreground">
                    Typically 7-14 days from submission. We'll notify you of the status via email.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">What if my application is rejected?</p>
                  <p className="text-muted-foreground">
                    You'll receive specific feedback on which areas to improve. You can reapply after 30 days.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Is there a contract commitment?</p>
                  <p className="text-muted-foreground">
                    Yes, ambassadors commit to a minimum of 6 months, with monthly base income guarantee.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Button */}
          {currentCreator && !applicationStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Button
                size="lg"
                onClick={handleApplyClick}
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Submitting...' : 'Apply for Program'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
