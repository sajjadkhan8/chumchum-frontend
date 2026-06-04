'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, PackageCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ordersService } from '@/services/orders.service';
import type { DealType, Package } from '@/types';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface PackageOrderModalProps {
  isOpen: boolean;
  pkg: Package | null;
  onClose: () => void;
  onCreated?: (orderId: string) => void;
}

const getInitialAmount = (pkg: Package | null) => {
  if (!pkg) return '';
  if (pkg.dealType === 'barter') return '';
  return String(pkg.hybridCashAmount || pkg.price || '');
};

export function PackageOrderModal({ isOpen, pkg, onClose, onCreated }: PackageOrderModalProps) {
  const [amount, setAmount] = useState('');
  const [barterDetails, setBarterDetails] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pkg || !isOpen) return;
    setAmount(getInitialAmount(pkg));
    setBarterDetails(pkg.barterDescription || pkg.creatorExpectations || '');
    setMessage(`Hi, I would like to order "${pkg.title}".`);
  }, [isOpen, pkg]);

  const needsAmount = pkg?.dealType === 'paid' || pkg?.dealType === 'hybrid';
  const needsBarter = pkg?.dealType === 'barter' || pkg?.dealType === 'hybrid';

  const priceSummary = useMemo(() => {
    if (!pkg) return '';
    if (pkg.dealType === 'barter') return pkg.barterValue || 'Barter deal';
    if (pkg.dealType === 'hybrid') return `${formatPrice(pkg.hybridCashAmount || pkg.price)} + barter`;
    return formatPrice(pkg.price);
  }, [pkg]);

  const handleSubmit = async () => {
    if (!pkg) return;

    if (needsAmount && (!amount || Number(amount) <= 0)) {
      toast.error('Please enter the cash amount for this order.');
      return;
    }

    if (needsBarter && !barterDetails.trim()) {
      toast.error('Please describe the barter item or service.');
      return;
    }

    if (!message.trim()) {
      toast.error('Please add a short message for the creator.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await ordersService.create({
        packageId: pkg.id,
        dealType: pkg.dealType.toUpperCase() as Uppercase<DealType>,
        amount: amount ? Number(amount) : undefined,
        barterDetails: barterDetails.trim() || undefined,
        message: message.trim(),
      });

      if (!order) {
        throw new Error('Order was created but could not be read back.');
      }

      toast.success('Order request sent', {
        description: 'The creator will see this as a pending order.',
      });
      onCreated?.(order.id);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Package</DialogTitle>
          <DialogDescription>
            Send a package order request to the creator.
          </DialogDescription>
        </DialogHeader>

        {pkg && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{pkg.title}</p>
                <Badge variant="outline" className="capitalize">{pkg.dealType}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
              <p className="mt-3 font-semibold text-primary">{priceSummary}</p>
            </div>

            {needsAmount && (
              <div className="space-y-2">
                <Label htmlFor="order-amount">Cash Amount (PKR)</Label>
                <Input
                  id="order-amount"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="15000"
                />
              </div>
            )}

            {needsBarter && (
              <div className="space-y-2">
                <Label htmlFor="order-barter">Barter Details</Label>
                <Textarea
                  id="order-barter"
                  rows={3}
                  value={barterDetails}
                  onChange={(event) => setBarterDetails(event.target.value)}
                  placeholder="Describe the product, service, or experience you will provide."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="order-message">Message</Label>
              <Textarea
                id="order-message"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Add campaign details, usage rights, deadlines, or approval notes."
              />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Sending...' : 'Send Order Request'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
