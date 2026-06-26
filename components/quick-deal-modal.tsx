'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Banknote, Sparkles, Send, Loader2, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import type { BarterType, Creator, DealType } from '@/types';
import { cn, formatFollowers, formatPrice } from '@/lib/utils';
import { messagesService } from '@/services/messages.service';
import { metadataService, defaultCreatorFilterMetadata } from '@/services/metadata.service';

interface QuickDealModalProps {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (result: { conversationId: string; messageId: string; offerId: string }) => void;
}

type DealOption = {
  value: DealType;
  label: string;
  icon: React.ElementType;
  description: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  iconBg: string;
};

const dealTypeOptions: DealOption[] = [
  {
    value: 'paid',
    label: 'Paid',
    icon: Banknote,
    description: 'Pay for content',
    selectedBg: 'bg-[#e7f0ea]',
    selectedBorder: 'border-[#2d6b4e]',
    selectedText: 'text-[#185c39]',
    iconBg: 'bg-[#2d6b4e]',
  },
  {
    value: 'barter',
    label: 'Barter',
    icon: Gift,
    description: 'Exchange products',
    selectedBg: 'bg-[#f7e8c8]',
    selectedBorder: 'border-[#e6aa38]',
    selectedText: 'text-[#8b5e12]',
    iconBg: 'bg-[#e6aa38]',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    icon: Sparkles,
    description: 'Cash + barter',
    selectedBg: 'bg-[#e7f0ea]',
    selectedBorder: 'border-[#2d6b4e]',
    selectedText: 'text-[#185c39]',
    iconBg: 'bg-[#2d6b4e]',
  },
];

const inputCls =
  'h-10 w-full rounded-xl border border-[#d9e0d8] bg-[#f4f2e9] px-3 text-sm text-[#1e3d2e] placeholder:text-[#8fa098] focus:border-[#2d6b4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6b4e]/15 transition-colors';
const labelCls = 'mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8fa098]';
const textareaCls =
  'w-full rounded-xl border border-[#d9e0d8] bg-[#f4f2e9] px-3 py-2.5 text-sm text-[#1e3d2e] placeholder:text-[#8fa098] focus:border-[#2d6b4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6b4e]/15 resize-none transition-colors';

export function QuickDealModal({ creator, isOpen, onClose, onCreated }: QuickDealModalProps) {
  const [dealType, setDealType] = useState<DealType>('paid');
  const [budget, setBudget] = useState('');
  const [barterDescription, setBarterDescription] = useState('');
  const [barterCategory, setBarterCategory] = useState('products');
  const [barterValue, setBarterValue] = useState('');
  const [creatorExpectation, setCreatorExpectation] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barterTypeOptions, setBarterTypeOptions] = useState<{ value: BarterType; label: string }[]>(
    defaultCreatorFilterMetadata.barterTypes
  );

  useEffect(() => {
    const loadBarterTypes = async () => {
      const metadata = await metadataService.getCreatorFilterMetadata();
      setBarterTypeOptions(metadata.barterTypes);
    };
    void loadBarterTypes();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please add a message before sending the offer.');
      return;
    }
    if ((dealType === 'paid' || dealType === 'hybrid') && !budget) {
      toast.error('Please enter a budget for paid or hybrid deals.');
      return;
    }
    if ((dealType === 'barter' || dealType === 'hybrid') && !barterDescription.trim()) {
      toast.error('Please describe your barter offer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryPlatform = creator.platforms?.[0]?.platform?.toUpperCase() ?? 'INSTAGRAM';
      const result = await messagesService.createQuickDeal({
        creatorId: creator.id,
        dealType,
        amount: budget ? Number(budget) : undefined,
        barterDetails: barterDescription || undefined,
        barterCategory,
        estimatedBarterValue: barterValue ? Number(barterValue) : undefined,
        creatorExpectation: creatorExpectation || undefined,
        message,
        platform: primaryPlatform,
      });

      toast.success('Offer sent!', {
        description: `${creator.name} will be notified of your ${dealType} deal offer.`,
      });

      setDealType('paid');
      setBudget('');
      setBarterDescription('');
      setBarterCategory('products');
      setBarterValue('');
      setCreatorExpectation('');
      setMessage('');
      onCreated?.(result);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDealTypes = dealTypeOptions.filter((opt) => creator.dealTypes.includes(opt.value));
  const cols = availableDealTypes.length === 1 ? 'grid-cols-1' : availableDealTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.75rem] p-0 sm:max-h-[90dvh] sm:max-w-lg [&>button]:text-white/70 [&>button]:hover:text-white">
        <DialogTitle className="sr-only">Send quick deal offer</DialogTitle>

        {/* Dark green header */}
        <div className="bg-[#1e3d2e] px-5 pb-5 pt-5 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#f0c56e]">
            <span className="size-1.5 rounded-full bg-[#e6aa38]" />
            Quick Deal
          </div>
          <p className="text-sm text-[#8fa098]">Send a collaboration offer to</p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-white/20 ring-offset-2 ring-offset-[#1e3d2e]">
              <AvatarImage src={creator.avatar} alt={creator.name} />
              <AvatarFallback className="bg-[#244c39] text-sm font-extrabold text-white">
                {creator.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-extrabold tracking-[-0.02em] text-white">{creator.name}</p>
              <p className="mt-0.5 text-xs text-[#8fa098]">
                {creator.city ? `${creator.city} · ` : ''}{formatFollowers(creator.totalFollowers)} followers
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="max-h-[calc(100dvh-13rem)] space-y-5 overflow-y-auto bg-white px-5 py-5 sm:max-h-[calc(90dvh-12rem)] sm:px-6 sm:py-6">

          {/* Deal type selector */}
          <div>
            <label className={labelCls}>Deal Type</label>
            <div className={cn('mt-2 grid gap-2', cols)}>
              {availableDealTypes.map((opt) => {
                const Icon = opt.icon;
                const active = dealType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDealType(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all',
                      active
                        ? cn(opt.selectedBg, opt.selectedBorder, opt.selectedText, 'shadow-sm')
                        : 'border-[#d9e0d8] bg-[#fbfaf5] text-[#526259] hover:border-[#b8c9be] hover:bg-[#f4f8f4]'
                    )}
                  >
                    <span className={cn('grid size-8 place-items-center rounded-xl text-white transition-colors', active ? opt.iconBg : 'bg-[#e7f0ea] text-[#2d6b4e]')}>
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                    <span className="text-[10px] leading-tight opacity-60">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget — paid / hybrid */}
          <AnimatePresence mode="wait">
            {(dealType === 'paid' || dealType === 'hybrid') && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label htmlFor="budget" className={labelCls}>Budget (PKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8fa098]">
                    PKR
                  </span>
                  <input
                    id="budget"
                    type="number"
                    onWheel={(event) => event.currentTarget.blur()}
                    placeholder={creator.minPrice ? String(creator.minPrice) : '25000'}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className={cn(inputCls, 'pl-12')}
                  />
                </div>
                {creator.minPrice && (
                  <p className="mt-1.5 text-[11px] text-[#8fa098]">
                    Typical range: {formatPrice(creator.minPrice)} – {formatPrice(creator.maxPrice || creator.minPrice * 5)}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barter details — barter / hybrid */}
          <AnimatePresence mode="wait">
            {(dealType === 'barter' || dealType === 'hybrid') && (
              <motion.div
                key="barter"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div>
                  <label htmlFor="barter-desc" className={labelCls}>What you&apos;re offering</label>
                  <textarea
                    id="barter-desc"
                    placeholder="Describe the product or service you're offering in exchange…"
                    value={barterDescription}
                    onChange={(e) => setBarterDescription(e.target.value)}
                    rows={3}
                    className={textareaCls}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Category</label>
                    <div className="relative">
                      <select
                        value={barterCategory}
                        onChange={(e) => setBarterCategory(e.target.value)}
                        className={cn(inputCls, 'appearance-none pr-8')}
                      >
                        {barterTypeOptions.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8fa098]" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="barter-value" className={labelCls}>Est. value (PKR)</label>
                    <input
                      id="barter-value"
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      placeholder="e.g. 15000"
                      value={barterValue}
                      onChange={(e) => setBarterValue(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="expectation" className={labelCls}>What you need from creator</label>
                  <input
                    id="expectation"
                    type="text"
                    placeholder="e.g. 1 reel + 3 stories, usage rights 30 days"
                    value={creatorExpectation}
                    onChange={(e) => setCreatorExpectation(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {creator.barterTypes && creator.barterTypes.length > 0 && (
                  <p className="text-[11px] text-[#8fa098]">
                    Creator accepts: {creator.barterTypes.join(', ')}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message */}
          <div>
            <label htmlFor="message" className={labelCls}>Message</label>
            <textarea
              id="message"
              placeholder="Introduce yourself and describe the collaboration you have in mind…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className={textareaCls}
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2d6b4e] text-sm font-bold text-white transition hover:bg-[#1f5239] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send Offer to {creator.name.split(' ')[0]}
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
