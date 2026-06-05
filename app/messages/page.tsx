"use client";

import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { QuickDealModal } from "@/components/quick-deal-modal";
import { creatorsService } from "@/services/creators.service";
import { messagesService } from "@/services/messages.service";
import { formatRelativeTime, formatPrice, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Message, Conversation } from "@/types";
import { toast } from "sonner";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const creatorParam = searchParams.get("creator");
  const { user } = useAuthStore();
  const isCreatorView = user?.role === "creator";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingAttachment, setIsSendingAttachment] = useState(false);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isQuickDealOpen, setIsQuickDealOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedCreatorParamRef = useRef<string | null>(null);

  const getConversationParticipant = useCallback((conversation: Conversation) => {
    if (isCreatorView) {
      return {
        id: conversation.brand.id,
        name: conversation.brand.name,
        avatar: conversation.brand.logo,
        subtitle: conversation.brand.industry,
        href: null,
      };
    }

    return {
      id: conversation.creator.id,
      name: conversation.creator.name,
      avatar: conversation.creator.avatar,
      subtitle: `@${conversation.creator.username}`,
      href: `/creator/${conversation.creator.username}`,
    };
  }, [isCreatorView]);

  const selectedParticipant = selectedConversation
    ? getConversationParticipant(selectedConversation)
    : null;
  const currentSenderId = selectedConversation
    ? isCreatorView
      ? selectedConversation.creatorId
      : selectedConversation.brandId
    : isCreatorView
      ? user?.id || "creator"
      : user?.id || "brand";

  // Filter conversations based on search
  const roleScopedConversations = useMemo(() => {
    return conversations;
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    return roleScopedConversations.filter((conv) =>
      getConversationParticipant(conv).name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, roleScopedConversations, getConversationParticipant]);

  const loadConversations = useCallback(async () => {
    if (!user || user.role === 'platform_admin') return [];

    setIsLoadingConversations(true);
    try {
      const data = await messagesService.getConversations(user.id, user.role);
      setConversations(data);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load conversations";
      toast.error(message);
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const loadMessagesForConversation = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const data = await messagesService.getMessages(conversationId);
      setMessages(data);
      await messagesService.markAsRead(conversationId);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load messages";
      toast.error(message);
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const selectConversationFromParam = useCallback(async (target: string) => {
    const data = await loadConversations();
    const existing = data.find(
      (conversation) =>
        conversation.creatorId === target || conversation.creator.username === target,
    );

    if (existing) {
      setSelectedConversation(existing);
      setShowMobileChat(true);
      return;
    }

    let creator: Awaited<ReturnType<typeof creatorsService.getById>>;
    try {
      creator = await creatorsService.getById(target);
    } catch {
      creator = null;
    }

    if (!creator) {
      try {
        creator = await creatorsService.getByUsername(target);
      } catch {
        creator = null;
      }
    }

    if (!creator) return;

    const createdConversation = await messagesService.createConversation(creator.id);
    setConversations((prev) => {
      const withoutDuplicate = prev.filter((conversation) => conversation.id !== createdConversation.id);
      return [createdConversation, ...withoutDuplicate];
    });
    setSelectedConversation(createdConversation);
    setShowMobileChat(true);
  }, [loadConversations]);

  // Auto-select conversation if creator param is present
  useEffect(() => {
    if (!creatorParam || !user || user.role !== "brand") return;
    const processingKey = `${user.id}:${creatorParam}`;
    if (processedCreatorParamRef.current === processingKey) return;
    processedCreatorParamRef.current = processingKey;

    const startConversationFromParam = async () => {
      try {
        await selectConversationFromParam(creatorParam);
      } catch (error) {
        processedCreatorParamRef.current = null;
        const message = error instanceof Error ? error.message : "Failed to start conversation";
        toast.error(message);
      }
    };

    void startConversationFromParam();
  }, [creatorParam, selectConversationFromParam, user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      void loadMessagesForConversation(selectedConversation.id);
    }
  }, [selectedConversation, loadMessagesForConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setIsSending(true);

    const messageText = newMessage.trim();
    setNewMessage("");
    try {
      const createdMessage = await messagesService.sendMessage(
        selectedConversation.id,
        currentSenderId,
        isCreatorView ? "creator" : "brand",
        messageText,
      );

      setMessages((prev) => [...prev, createdMessage]);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedConversation.id
            ? { ...conversation, lastMessage: createdMessage, updatedAt: createdMessage.createdAt }
            : conversation,
        ),
      );
    } catch (error) {
      setNewMessage(messageText);
      const message = error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const getAttachmentName = (url?: string) => {
    if (!url) return "Attachment";
    const path = url.split("?")[0];
    const name = path.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : "Attachment";
  };

  const getAttachmentHref = (url?: string) => {
    if (!url) return "#";
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleSendAttachment = async (file?: File | null) => {
    if (!file || !selectedConversation) return;
    setIsSendingAttachment(true);
    try {
      const createdMessage = await messagesService.sendAttachment(selectedConversation.id, file);
      setMessages((prev) => [...prev, createdMessage]);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedConversation.id
            ? { ...conversation, lastMessage: createdMessage, updatedAt: createdMessage.createdAt }
            : conversation,
        ),
      );
      toast.success("Attachment sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send attachment";
      toast.error(message);
    } finally {
      setIsSendingAttachment(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowMobileChat(true);
  };

  const openQuickDealModal = () => {
    if (!selectedConversation || isCreatorView) return;
    setIsQuickDealOpen(true);
  };

  const handleQuickDealCreated = async (result: { conversationId: string; messageId: string; offerId: string }) => {
    const refreshedConversations = await loadConversations();
    const targetConversation = refreshedConversations.find((conversation) => conversation.id === result.conversationId);
    if (targetConversation) {
      setSelectedConversation(targetConversation);
      setShowMobileChat(true);
    }
    await loadMessagesForConversation(result.conversationId);
  };

  const respondToOffer = async (message: Message, action: "accepted" | "rejected") => {
    const offerId = message.offer?.id;
    if (!offerId) {
      toast.error("This offer cannot be updated yet.");
      return;
    }

    setRespondingOfferId(offerId);
    try {
      const response = await messagesService.respondToQuickDeal(offerId, action);
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id && item.offer
            ? { ...item, offer: { ...item.offer, status: response.status, orderId: response.orderId } }
            : item,
        ),
      );
      toast.success(
        action === "accepted"
          ? `Offer accepted${response.orderId ? " and order created" : ""}`
          : "Offer declined",
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update offer";
      toast.error(errorMessage);
    } finally {
      setRespondingOfferId(null);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Conversations List */}
        <div
          className={`w-full border-r border-border md:w-80 lg:w-96 ${showMobileChat ? "hidden md:block" : "block"}`}
        >
          <div className="flex min-h-0 h-full flex-col">
            {/* Search Header */}
            <div className="border-b border-border p-4">
              <h1 className="mb-4 text-xl font-bold">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border">
                {isLoadingConversations && (
                  <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>
                )}
                {filteredConversations.map((conv) => {
                  const participant = getConversationParticipant(conv);
                  const previewTime = conv.lastMessage?.createdAt ?? conv.updatedAt;
                  const previewText =
                    conv.lastMessage?.type === "offer"
                      ? "Sent a deal offer"
                      : conv.lastMessage?.content || "Start a conversation";

                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 sm:p-4 ${
                        selectedConversation?.id === conv.id ? "bg-muted" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={participant.avatar}
                          alt={participant.name}
                        />
                        <AvatarFallback>
                          {getInitials(participant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="line-clamp-1 font-medium">{participant.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(previewTime)}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {previewText}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 min-w-5 justify-center rounded-full bg-primary px-1.5 text-xs"
                        >
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}

                {filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No conversations found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`min-h-0 flex-1 flex-col overflow-hidden ${showMobileChat ? "flex" : "hidden md:flex"}`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedParticipant?.avatar}
                      alt={selectedParticipant?.name}
                    />
                    <AvatarFallback>
                      {getInitials(selectedParticipant?.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {selectedParticipant?.href ? (
                        <Link
                        href={selectedParticipant.href}
                          className="line-clamp-1 font-medium hover:underline"
                      >
                        {selectedParticipant.name}
                      </Link>
                    ) : (
                        <span className="line-clamp-1 font-medium">{selectedParticipant?.name}</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {selectedParticipant?.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      {!isCreatorView && (
                        <DropdownMenuItem onClick={openQuickDealModal}>Send Quick Deal</DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages Area */}
              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="space-y-4">
                  {isLoadingMessages && (
                    <div className="text-sm text-muted-foreground">Loading messages...</div>
                  )}
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentSenderId;
                    const canRespondToOffer = isCreatorView && message.senderType === "brand";
                    const orderHref = isCreatorView ? "/creator/orders" : "/brand/orders";
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[86%] sm:max-w-[75%] ${isOwn ? "order-2" : ""}`}
                        >
                          {message.type === "text" && (
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          )}

                          {message.type === "attachment" && (
                            <a
                              href={getAttachmentHref(message.attachmentUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                                isOwn
                                  ? "border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "border-border bg-muted text-foreground hover:bg-muted/80"
                              } ${!message.attachmentUrl ? "pointer-events-none opacity-70" : ""}`}
                            >
                              <FileText className="h-5 w-5 shrink-0" />
                              <span className="min-w-0 truncate">
                                {getAttachmentName(message.attachmentUrl)}
                              </span>
                            </a>
                          )}

                          {message.type === "offer" && message.offer && (
                            <Card className="w-64 overflow-hidden">
                              <div className="bg-primary/10 p-3">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">
                                    Deal Offer
                                  </span>
                                </div>
                              </div>
                              <CardContent className="p-3">
                                <p className="mb-2 font-medium capitalize">
                                  {message.offer.dealType} collaboration
                                </p>
                                {message.offer.amount ? (
                                  <p className="mb-3 text-2xl font-bold text-primary">
                                    {formatPrice(message.offer.amount)}
                                  </p>
                                ) : null}
                                <p className="mb-3 text-sm text-muted-foreground">
                                  {message.offer.message}
                                </p>
                                {message.offer.barterDetails ? (
                                  <p className="mb-3 text-xs text-muted-foreground">
                                    {message.offer.barterDetails}
                                  </p>
                                ) : null}
                                {message.offer.creatorExpectation ? (
                                  <p className="mb-3 text-xs text-muted-foreground">
                                    Expected from creator: {message.offer.creatorExpectation}
                                  </p>
                                ) : null}
                                {message.offer.status === "pending" && (
                                  canRespondToOffer ? (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="flex-1"
                                        disabled={!message.offer.id || respondingOfferId === message.offer.id}
                                        onClick={() => void respondToOffer(message, "accepted")}
                                      >
                                        {respondingOfferId === message.offer.id ? "Saving..." : "Accept"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        disabled={!message.offer.id || respondingOfferId === message.offer.id}
                                        onClick={() => void respondToOffer(message, "rejected")}
                                      >
                                        Decline
                                      </Button>
                                    </div>
                                  ) : (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                      <Clock className="mr-1 h-3 w-3" />
                                      Awaiting creator response
                                    </Badge>
                                  )
                                )}
                                {message.offer.status === "accepted" && (
                                  <div className="flex flex-col gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="w-fit bg-green-100 text-green-700"
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      Accepted
                                    </Badge>
                                    {message.offer.orderId && (
                                      <Button size="sm" variant="outline" asChild>
                                        <Link href={orderHref}>
                                          <Package className="mr-1 h-3 w-3" />
                                          View order
                                        </Link>
                                      </Button>
                                    )}
                                  </div>
                                )}
                                {message.offer.status === "rejected" && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-700"
                                  >
                                    <X className="mr-1 h-3 w-3" />
                                    Rejected
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          <div
                            className={`mt-1 flex items-center gap-1 text-xs text-muted-foreground ${
                              isOwn ? "justify-end" : ""
                            }`}
                          >
                            <span>
                              {formatRelativeTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <>
                                {!message.isRead && (
                                  <Check className="h-3 w-3" />
                                )}
                                {message.isRead && (
                                  <CheckCheck className="h-3 w-3 text-primary" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-border bg-background p-3 pb-safe sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-tap"
                    disabled={isSendingAttachment}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-tap"
                    disabled={isSendingAttachment}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handleSendAttachment(event.target.files?.[0])}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => void handleSendAttachment(event.target.files?.[0])}
                  />
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    className="h-11 flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    size="icon"
                    className="min-tap"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Send className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Your Messages</h2>
              <p className="mb-4 max-w-md text-muted-foreground">
                {isCreatorView
                  ? "Select a conversation to continue your active brand collaboration chats."
                  : "Select a conversation from the list or start a new one by visiting a creator profile."}
              </p>
              <Button asChild>
                <Link href={isCreatorView ? "/creator/dashboard" : "/brand/explore"}>
                  {isCreatorView ? "Go to Dashboard" : "Find Creators"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />

      {!isCreatorView && selectedConversation && (
        <QuickDealModal
          creator={selectedConversation.creator}
          isOpen={isQuickDealOpen}
          onClose={() => setIsQuickDealOpen(false)}
          onCreated={(result) => void handleQuickDealCreated(result)}
        />
      )}

    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MessagesPageContent />
    </Suspense>
  );
}
