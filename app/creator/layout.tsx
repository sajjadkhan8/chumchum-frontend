import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 pt-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
