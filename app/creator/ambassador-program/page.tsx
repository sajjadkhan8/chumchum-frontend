'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Crown } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { AmbassadorEligibilityChecker } from '@/components/ambassador-eligibility-checker';
import { AmbassadorDetailedCard } from '@/components/ambassador-detailed-card';
import { useAuthStore } from '@/store/auth-store';
import { useAmbassadorStore } from '@/store/ambassador-store';
import { ambassadorService, type AmbassadorBenefit } from '@/services/ambassador.service';
import { creatorsService } from '@/services/creators.service';
import type { Creator } from '@/types';
import Link from 'next/link';

const panelClass =
  'rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6';

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

  const applicationStatus = currentCreator ? getApplicationStatus(currentCreator.id) : null;

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
        <div className="min-h-screen bg-[#fbfaf5] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[#e6eceb] text-[#2d6b4e]">
              <AlertCircle className="size-8" />
            </div>
            <h1 className="mb-2 text-3xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">Creators Only</h1>
            <p className="mb-6 text-[#87938b]">
              Sign in as a creator to access the Platform Ambassador program.
            </p>
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2d6b4e] px-6 font-bold text-white transition-colors hover:bg-[#1f5239]"
            >
              Sign In
            </Link>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#fbfaf5] px-4 pb-10 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 text-center"
          >
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#e8c98a] bg-[#fdf3dc] px-3 py-1 text-xs font-bold text-[#9b6712]">
              <Crown className="size-3" />
              Exclusive Program
            </span>
            <h1 className="mb-3 text-4xl font-extrabold tracking-[-0.045em] text-[#1e3d2e]">
              Platform Ambassador Program
            </h1>
            <p className="mx-auto max-w-2xl text-base text-[#87938b]">
              Join our network of verified creators. Earn guaranteed monthly income,
              access exclusive brands, and grow your influence with platform support.
            </p>
          </motion.div>

          {/* Application Status Section */}
          {currentCreator && applicationStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className={panelClass}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {applicationStatus.status === 'approved' ? (
                      <div className="grid size-10 place-items-center rounded-xl bg-[#e4f1e8] text-[#2d6b4e]">
                        <CheckCircle2 className="size-5" />
                      </div>
                    ) : applicationStatus.status === 'rejected' ? (
                      <div className="grid size-10 place-items-center rounded-xl bg-[#fce8e6] text-[#c0392b]">
                        <AlertCircle className="size-5" />
                      </div>
                    ) : (
                      <div className="grid size-10 place-items-center rounded-xl bg-[#fdf3dc] text-[#9b6712]">
                        <Clock className="size-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-[#1e3d2e]">
                        {applicationStatus.status === 'approved'
                          ? 'Welcome to the Program!'
                          : applicationStatus.status === 'rejected'
                            ? 'Application Rejected'
                            : `Application Status: ${applicationStatus.status.replace(/_/g, ' ')}`}
                      </p>
                      <p className="text-xs text-[#87938b]">
                        Last updated on {new Date(applicationStatus.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {applicationStatus.status === 'approved' && (
                    <span className="rounded-full bg-[#2d6b4e] px-3 py-1 text-[10px] font-extrabold text-white">
                      Active
                    </span>
                  )}
                </div>

                {applicationStatus.status === 'approved' && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#e4f1e8] border border-[#c2dac9] p-3.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2d6b4e]" />
                    <p className="text-sm text-[#1e5c3e]">
                      You're now part of our ambassador network. Check your dashboard for exclusive opportunities.
                    </p>
                  </div>
                )}

                {applicationStatus.status === 'rejected' && applicationStatus.rejectionReason && (
                  <>
                    <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fce8e6] border border-[#f0c8c5] p-3.5">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#c0392b]" />
                      <p className="text-sm text-[#8b2020]">{applicationStatus.rejectionReason}</p>
                    </div>
                    <p className="mt-3 text-sm text-[#87938b]">
                      Please improve the mentioned areas and feel free to reapply after 30 days.
                    </p>
                  </>
                )}

                {(applicationStatus.status === 'submitted' || applicationStatus.status === 'under_review') && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7a8f82]">Verification Progress</p>
                    <div className="space-y-2">
                      {[
                        { step: 'Identity Verification', completed: applicationStatus.verificationSteps.identityVerified },
                        { step: 'Engagement Verification', completed: applicationStatus.verificationSteps.engagementVerified },
                        { step: 'Content Review', completed: applicationStatus.verificationSteps.contentReviewPassed },
                        { step: 'Background Check', completed: applicationStatus.verificationSteps.backgroundCheckPassed },
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {step.completed ? (
                            <CheckCircle2 className="size-4 text-[#2d6b4e]" />
                          ) : (
                            <Clock className="size-4 text-[#87938b]" />
                          )}
                          <span className="text-sm text-[#87938b]">{step.step}</span>
                        </div>
                      ))}
                    </div>
                    {applicationStatus.notes && (
                      <p className="text-sm italic text-[#87938b]">
                        📝 Note: {applicationStatus.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Enhanced Gamified Eligibility & Score */}
          {currentCreator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AmbassadorDetailedCard creator={currentCreator} className="mb-6" />
              {!applicationStatus && (
                <AmbassadorEligibilityChecker creator={currentCreator} />
              )}
            </motion.div>
          )}

          {/* Benefits Section */}
          {benefits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Perks</p>
              <h2 className="mb-5 text-2xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">Program Benefits</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="rounded-[1.4rem] border border-[#d1ddd6] bg-white p-5 shadow-[0_8px_28px_rgba(38,70,50,0.06)] transition-shadow hover:shadow-[0_12px_36px_rgba(38,70,50,0.1)]"
                  >
                    <div className="mb-3 text-4xl">{benefit.icon}</div>
                    <h3 className="mb-1 text-sm font-extrabold text-[#1e3d2e]">{benefit.title}</h3>
                    <p className="text-xs leading-5 text-[#87938b]">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Program Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-5"
          >
            {/* What is it */}
            <div className={panelClass}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Overview</p>
              <h2 className="mb-4 mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">
                💼 What is the Ambassador Program?
              </h2>
              <div className="space-y-3 text-sm text-[#87938b]">
                <p>
                  Our Platform Ambassador program is designed for dedicated creators who want to unlock premium earning potential
                  and exclusive partnership opportunities. As a platform ambassador, you'll receive:
                </p>
                <ul className="space-y-1.5 pl-4">
                  {[
                    'Monthly guaranteed base income starting from PKR 1,250,000',
                    'Direct access to premium brands and enterprise clients',
                    'Dedicated account manager for personalized support',
                    'First access to exclusive and high-value campaigns',
                    'Performance bonuses and incentives',
                    'Professional platform support and content consultation',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[#2d6b4e]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Application process */}
            <div className={panelClass}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">How it works</p>
              <h2 className="mb-5 mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">
                📋 Application Process
              </h2>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Submit Application', desc: 'Complete your application with your creator profile information' },
                  { step: 2, title: 'Identity Verification', desc: 'Verify your identity with valid CNIC details' },
                  { step: 3, title: 'Metrics Review', desc: 'Our team verifies your follower count and engagement metrics' },
                  { step: 4, title: 'Content Review', desc: 'We review your content for brand safety and quality standards' },
                  { step: 5, title: 'Background Check', desc: 'Final compliance and background verification' },
                  { step: 6, title: 'Approval & Onboarding', desc: 'Get approved and start earning as a Platform Ambassador' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="grid size-10 flex-shrink-0 place-items-center rounded-full bg-[#e4f1e8] text-sm font-extrabold text-[#2d6b4e]">
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-extrabold text-[#1e3d2e]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[#87938b]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className={panelClass}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Questions</p>
              <h2 className="mb-5 mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">
                ❓ FAQ
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: 'Can I work with other platforms while being an ambassador?',
                    a: 'Ambassadors can work with other platforms, but exclusive brand deals may have non-compete clauses.',
                  },
                  {
                    q: 'How long does the application process take?',
                    a: "Typically 7-14 days from submission. We'll notify you of the status via email.",
                  },
                  {
                    q: 'What if my application is rejected?',
                    a: "You'll receive specific feedback on which areas to improve. You can reapply after 30 days.",
                  },
                  {
                    q: 'Is there a contract commitment?',
                    a: 'Yes, ambassadors commit to a minimum of 6 months, with monthly base income guarantee.',
                  },
                ].map(({ q, a }) => (
                  <div key={q} className="border-b border-[#edf1ed] pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-extrabold text-[#1e3d2e]">{q}</p>
                    <p className="mt-1 text-sm text-[#87938b]">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA Button */}
          {currentCreator && !applicationStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pb-4 text-center"
            >
              <button
                onClick={handleApplyClick}
                disabled={isSubmitting || loading}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#2d6b4e] px-8 font-extrabold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Apply for Program'}
                <ArrowRight className="size-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
