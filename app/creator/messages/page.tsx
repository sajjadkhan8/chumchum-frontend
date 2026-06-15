import { Suspense } from "react";
import { MessagesPageContent } from "@/components/messages/messages-page-content";

export default function CreatorMessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf5]" />}>
      <MessagesPageContent />
    </Suspense>
  );
}
