'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Banknote, Sparkles, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import type { Creator, DealType } from '@/types';
import { cn, formatPrice } from '@/lib/utils';

interface QuickDealModalProps {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
}

const dealTypeOptions: { value: DealType; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: 'paid',
    label: 'Paid Deal',
    icon: Banknote,
    description: 'Pay for content creation',
  },
  {
    value: 'barter',
    label: 'Barter Deal',
    icon: Gift,
    description: 'Exchange products/services',
  },
  {
    value: 'hybrid',
    label: 'Hybrid Deal',
    icon: Sparkles,
    description: 'Combine cash and barter',
  },
];

export function QuickDealModal({ creator, isOpen, onClose }: QuickDealModalProps) {
  const [dealType, setDealType] = useState<DealType>('paid');
  const [budget, setBudget] = useState('');
  const [barterOffer, setBarterOffer] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success('Offer sent successfully!', {
      description: `${creator.name} will be notified of your ${dealType} deal request.`,
    });
    
    setIsSubmitting(false);
    onClose();
    
    // Reset form
    setDealType('paid');
    setBudget('');
    setBarterOffer('');
    setMessage('');
  };

  const availableDealTypes = dealTypeOptions.filter((option) =>
    creator.dealTypes.includes(option.value)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Quick Deal</DialogTitle>
            <DialogDescription>
              Send a collaboration offer to {creator.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={creator.avatar} alt={creator.name} />
              <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{creator.name}</p>
              <p className="text-sm text-muted-foreground">
                {creator.city} • {creator.totalFollowers.toLocaleString()} followers
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Deal Type Selection */}
          <div>
            <Label className="text-sm font-medium">Deal Type</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {availableDealTypes.map((option) => {
                const Icon = option.icon;
                const isSelected = dealType === option.value;
                
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDealType(option.value)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      isSelected
                        ? option.value === 'barter'
                          ? 'border-accent bg-accent/10'
                          : 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isSelected
                          ? option.value === 'barter'
                            ? 'text-accent-foreground'
                            : 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                    <span className="text-xs font-medium">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Budget Input (for paid and hybrid) */}
          <AnimatePresence mode="wait">
            {(dealType === 'paid' || dealType === 'hybrid') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="budget" className="text-sm font-medium">
                  Budget (PKR)
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    PKR
                  </span>
                  <Input
                    id="budget"
                    type="number"
                    placeholder={`Min ${formatPrice(creator.minPrice || 10000)}`}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="pl-12"
                  />
                </div>
                {creator.minPrice && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Creator&apos;s typical range: {formatPrice(creator.minPrice)} - {formatPrice(creator.maxPrice || creator.minPrice * 5)}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barter Offer (for barter and hybrid) */}
          <AnimatePresence mode="wait">
            {(dealType === 'barter' || dealType === 'hybrid') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="barter" className="text-sm font-medium">
                  What are you offering?
                </Label>
                <Input
                  id="barter"
                  placeholder="e.g., Free meals for 3 months, Products worth PKR 50,000"
                  value={barterOffer}
                  onChange={(e) => setBarterOffer(e.target.value)}
                  className="mt-2"
                />
                {creator.barterTypes && creator.barterTypes.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Interested in: {creator.barterTypes.join(', ')}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself and describe what you're looking for..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 min-h-[100px] resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message}
            className="w-full gap-2 rounded-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Offer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
