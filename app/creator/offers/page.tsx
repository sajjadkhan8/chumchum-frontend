'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { offersService } from '@/services/offers.service';
import type { BrandOffer, BrandOfferReactionType } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const OFFER_TYPES = ['UGC', 'POST', 'REEL', 'STORY', 'BUNDLE', 'Custom'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export default function CreatorOffersPage() {
  const router = useRouter();

  // filters
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [offerType, setOfferType] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // data
  const [offers, setOffers] = useState<BrandOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // react dialog
  const [selectedOffer, setSelectedOffer] = useState<BrandOffer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactionType, setReactionType] = useState<BrandOfferReactionType>('interested');
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedDays, setProposedDays] = useState('');

  const loadOffers = useCallback(async (nextPage = 0, append = false) => {
    setIsLoading(true);
    try {
      const result = await offersService.getCreatorOfferFeed({
        search: search.trim() || undefined,
        city: city || undefined,
        offerType: offerType || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        page: nextPage,
        size: 20,
      });
      setOffers(append ? (prev) => [...prev, ...result.content] : result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setPage(nextPage);
    } catch {
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  }, [search, city, offerType, budgetMin, budgetMax]);

  useEffect(() => {
    void loadOffers(0);
  }, [loadOffers]);

  const activeFilterCount = [city, offerType, budgetMin, budgetMax].filter(Boolean).length;

  const clearFilters = () => {
    setCity('');
    setOfferType('');
    setBudgetMin('');
    setBudgetMax('');
  };

  const openReaction = (offer: BrandOffer) => {
    setSelectedOffer(offer);
    setReactionType('interested');
    setMessage('');
    setProposedPrice('');
    setProposedDays('');
    setIsDialogOpen(true);
  };

  const submitReaction = async () => {
    if (!selectedOffer) return;
    setIsSubmitting(true);
    try {
      await offersService.reactToOffer(selectedOffer.id, {
        reactionType: reactionType.toUpperCase() as Uppercase<BrandOfferReactionType>,
        message: message || undefined,
        proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
        proposedDeliveryDays: proposedDays ? Number(proposedDays) : undefined,
      });
      toast.success('Reaction submitted to brand');
      setIsDialogOpen(false);
      router.push('/creator/offers/reactions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit reaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Brand Offers</h1>
          <p className="text-sm text-muted-foreground">
            {totalElements > 0 ? `${totalElements} open offers from brands` : 'Find open requests from brands and send your response.'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/creator/offers/reactions">My Reactions</Link>
        </Button>
      </div>

      {/* Search + filter bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offers by title, brief…"
            onKeyDown={(e) => e.key === 'Enter' && void loadOffers(0)}
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters((p) => !p)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-0.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger><SelectValue placeholder="Any city" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any city</SelectItem>
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Offer type</Label>
                <Select value={offerType} onValueChange={setOfferType}>
                  <SelectTrigger><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    {OFFER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min budget (PKR)</Label>
                <Input type="number" min={0} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max budget (PKR)</Label>
                <Input type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Any" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => void loadOffers(0)}>Apply</Button>
              {activeFilterCount > 0 && (
                <Button size="sm" variant="ghost" onClick={() => { clearFilters(); void loadOffers(0); }}>
                  <X className="mr-1 h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && offers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading offers…</CardContent></Card>
      ) : offers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No offers found right now. Try adjusting your filters.</CardContent></Card>
      ) : (
        <>
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{offer.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{offer.brandName} • {offer.offerType}</p>
                    </div>
                    <Badge>{offer.targetCity || 'Open'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{offer.brief}</p>
                  <p className="text-sm font-medium text-primary">
                    {formatPrice(offer.budgetMin)} – {formatPrice(offer.budgetMax)} {offer.currency}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Deadline: {offer.deadlineDate || 'Open-ended'}</span>
                    {offer.targetLanguage ? <span>Lang: {offer.targetLanguage}</span> : null}
                    <span>Updated {formatRelativeTime(offer.updatedAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/creator/offers/${offer.id}`}>View Details</Link>
                    </Button>
                    <Button size="sm" onClick={() => openReaction(offer)}>React to Offer</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {page < totalPages - 1 && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => void loadOffers(page + 1, true)} disabled={isLoading}>
                {isLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>React to: {selectedOffer?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reaction type</Label>
              <div className="flex flex-wrap gap-2">
                {(['interested', 'proposal', 'question', 'decline'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={reactionType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReactionType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your approach, pitch, or question" />
            </div>
            {reactionType === 'proposal' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proposed price (PKR)</Label>
                  <Input type="number" min={0} value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery days</Label>
                  <Input type="number" min={1} value={proposedDays} onChange={(e) => setProposedDays(e.target.value)} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => void submitReaction()} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit Reaction'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
