'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { offersService } from '@/services/offers.service';
import { toast } from 'sonner';

export default function BrandOfferCreatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    brief: '',
    offerType: 'Custom',
    budgetMin: '25000',
    budgetMax: '80000',
    deliverables: '',
    requirements: '',
    deadlineDate: '',
    targetCity: '',
    targetLanguage: '',
    minFollowers: '',
    minEngagementRate: '',
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const created = await offersService.createOffer({
        title: form.title,
        brief: form.brief,
        offerType: form.offerType,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        deliverables: form.deliverables || undefined,
        requirements: form.requirements || undefined,
        deadlineDate: form.deadlineDate || undefined,
        targetCity: form.targetCity || undefined,
        targetLanguage: form.targetLanguage || undefined,
        minFollowers: form.minFollowers ? Number(form.minFollowers) : undefined,
        minEngagementRate: form.minEngagementRate ? Number(form.minEngagementRate) : undefined,
      });
      toast.success('Offer created as draft');
      router.push(`/brand/offers/${created.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create offer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-4 pb-6 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Brand Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Offer title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief">Brief</Label>
              <Textarea id="brief" rows={4} value={form.brief} onChange={(e) => setForm((p) => ({ ...p, brief: e.target.value }))} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="type">Offer type</Label>
                <Input id="type" value={form.offerType} onChange={(e) => setForm((p) => ({ ...p, offerType: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Budget min (PKR)</Label>
                <Input id="budgetMin" type="number" min={0} value={form.budgetMin} onChange={(e) => setForm((p) => ({ ...p, budgetMin: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Budget max (PKR)</Label>
                <Input id="budgetMax" type="number" min={0} value={form.budgetMax} onChange={(e) => setForm((p) => ({ ...p, budgetMax: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverables">Deliverables</Label>
              <Textarea id="deliverables" rows={3} value={form.deliverables} onChange={(e) => setForm((p) => ({ ...p, deliverables: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea id="requirements" rows={3} value={form.requirements} onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" value={form.deadlineDate} onChange={(e) => setForm((p) => ({ ...p, deadlineDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Target city</Label>
                <Input id="city" value={form.targetCity} onChange={(e) => setForm((p) => ({ ...p, targetCity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lang">Language</Label>
                <Input id="lang" value={form.targetLanguage} onChange={(e) => setForm((p) => ({ ...p, targetLanguage: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="followers">Minimum followers</Label>
                <Input id="followers" type="number" min={0} value={form.minFollowers} onChange={(e) => setForm((p) => ({ ...p, minFollowers: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engagement">Min engagement rate (%)</Label>
                <Input id="engagement" type="number" min={0} max={100} step="0.1" value={form.minEngagementRate} onChange={(e) => setForm((p) => ({ ...p, minEngagementRate: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/brand/offers')}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Create Offer'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

