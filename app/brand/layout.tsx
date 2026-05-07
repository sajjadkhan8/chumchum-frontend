import { Navbar } from '@/components/navbar';
import { BottomNav } from '@/components/bottom-nav';

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
