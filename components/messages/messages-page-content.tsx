"use client";

import { useState, useRef, useEffect, useMemo, useCallback, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickDealModal } from "@/components/quick-deal-modal";
import { creatorsService } from "@/services/creators.service";
import { messagesService } from "@/services/messages.service";
import { formatRelativeTime, formatPrice, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Message, Conversation } from "@/types";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download-file";

export function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorParam = searchParams.get("creator");
  const conversationParam = searchParams.get("conversation");
  const { user } = useAuthStore();
  const isCreatorView = user?.role === "creator";
  const messagesBasePath = isCreatorView ? "/creator/messages" : "/brand/messages";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
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
  const selectedConversationRef = useRef<Conversation | null>(null);

  const buildMessagesHref = useCallback(
    (params: Record<string, string | undefined> = {}) => {
      const nextParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) nextParams.set(key, value);
      });
      const query = nextParams.toString();
      return query ? `${messagesBasePath}?${query}` : messagesBasePath;
    },
    [messagesBasePath],
  );

  const getConversationParticipant = useCallback(
    (conversation: Conversation) => {
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
    },
    [isCreatorView],
  );

  const selectedParticipant = selectedConversation ? getConversationParticipant(selectedConversation) : null;
  const currentSenderId = selectedConversation
    ? isCreatorView ? selectedConversation.creatorId : selectedConversation.brandId
    : isCreatorView ? user?.id || "creator" : user?.id || "brand";

  const filteredConversations = useMemo(
    () => conversations.filter((conv) =>
      getConversationParticipant(conv).name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [searchQuery, conversations, getConversationParticipant],
  );

  const loadConversations = useCallback(async () => {
    if (!user || (user.role !== "creator" && user.role !== "brand")) return [];
    setIsLoadingConversations(true);
    try {
      const { items } = await messagesService.getConversations(user.id, user.role, 0, 50);
      setConversations(items);
      return items;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load conversations");
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  const loadMessagesForConversation = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const data = await messagesService.getMessages(conversationId);
      setMessages(data);
      await messagesService.markAsRead(conversationId);
      setConversations((current) => current.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
      return data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load messages");
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const selectConversationFromParam = useCallback(async (target: string) => {
    const data = await loadConversations();
    const existing = data.find((c) => c.creatorId === target || c.creator.username === target);
    if (existing) {
      setSelectedConversation(existing);
      setShowMobileChat(true);
      router.replace(buildMessagesHref({ conversation: existing.id }));
      return;
    }
    const creator = await creatorsService.getByIdentifier(target);
    if (!creator) return;
    const created = await messagesService.openCreatorConversation(creator.id, data);
    setConversations((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    setSelectedConversation(created);
    setShowMobileChat(true);
    router.replace(buildMessagesHref({ conversation: created.id }));
  }, [buildMessagesHref, loadConversations, router]);

  useEffect(() => {
    if (!creatorParam || !user || user.role !== "brand") return;
    const key = `${user.id}:${creatorParam}`;
    if (processedCreatorParamRef.current === key) return;
    processedCreatorParamRef.current = key;
    void selectConversationFromParam(creatorParam).catch((error) => {
      processedCreatorParamRef.current = null;
      toast.error(error instanceof Error ? error.message : "Failed to start conversation");
    });
  }, [creatorParam, selectConversationFromParam, user]);

  useEffect(() => {
    if (!conversationParam || !user || selectedConversation?.id === conversationParam) return;
    const conversation = conversations.find((c) => c.id === conversationParam);
    if (!conversation) return;
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  }, [conversationParam, conversations, selectedConversation?.id, user]);

  useEffect(() => {
    if (selectedConversation) void loadMessagesForConversation(selectedConversation.id);
  }, [selectedConversation, loadMessagesForConversation]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Background polling — only when tab is visible to avoid unnecessary API calls.
  useEffect(() => {
    const silentRefreshMessages = async () => {
      const convo = selectedConversationRef.current;
      if (!convo || document.visibilityState !== "visible") return;
      try {
        const data = await messagesService.getMessages(convo.id);
        setMessages((prev) => (prev.length !== data.length ? data : prev));
      } catch {
        // Silent — polling failures don't show toasts.
      }
    };

    const silentRefreshConversations = async () => {
      if (!user || (user.role !== "creator" && user.role !== "brand") || document.visibilityState !== "visible") return;
      try {
        const { items } = await messagesService.getConversations(user.id, user.role, 0, 50);
        setConversations(items);
      } catch {
        // Silent.
      }
    };

    const messagesInterval = setInterval(silentRefreshMessages, 5_000);
    const conversationsInterval = setInterval(silentRefreshConversations, 15_000);
    return () => {
      clearInterval(messagesInterval);
      clearInterval(conversationsInterval);
    };
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage("");
    try {
      const msg = await messagesService.sendMessage(
        selectedConversation.id, currentSenderId,
        isCreatorView ? "creator" : "brand", text,
      );
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) => c.id === selectedConversation.id
          ? { ...c, lastMessage: msg, updatedAt: msg.createdAt, unreadCount: 0 }
          : c
        ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      );
    } catch (error) {
      setNewMessage(text);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
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

  const handleSendAttachment = async (file?: File | null) => {
    if (!file || !selectedConversation) return;
    setIsSendingAttachment(true);
    try {
      const msg = await messagesService.sendAttachment(selectedConversation.id, file);
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) => c.id === selectedConversation.id
          ? { ...c, lastMessage: msg, updatedAt: msg.createdAt, unreadCount: 0 }
          : c
        ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      );
      toast.success("Attachment sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send attachment");
    } finally {
      setIsSendingAttachment(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const selectConversation = (conversation: Conversation) => {
    const read = { ...conversation, unreadCount: 0 };
    setSelectedConversation(read);
    setConversations((curr) => curr.map((c) => c.id === conversation.id ? read : c));
    setShowMobileChat(true);
    router.replace(buildMessagesHref({ conversation: conversation.id }));
  };

  const respondToOffer = async (message: Message, action: "accepted" | "rejected") => {
    const offerId = message.offer?.id;
    if (!offerId) { toast.error("This offer cannot be updated yet."); return; }
    setRespondingOfferId(offerId);
    try {
      const response = await messagesService.respondToQuickDeal(offerId, action);
      setMessages((curr) => curr.map((m) =>
        m.id === message.id && m.offer
          ? { ...m, offer: { ...m.offer, status: response.status, orderId: response.orderId } }
          : m,
      ));
      toast.success(action === "accepted"
        ? `Offer accepted${response.orderId ? " and order created" : ""}`
        : "Offer declined");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update offer");
    } finally {
      setRespondingOfferId(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100dvh-10.5rem)] min-h-[32rem] overflow-hidden rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_8px_40px_rgba(38,70,50,0.08)]">
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Conversations sidebar ── */}
        <aside className={`flex w-full flex-col border-r border-[#edf1ed] md:w-80 lg:w-96 ${showMobileChat ? "hidden md:flex" : "flex"}`}>

          {/* Sidebar header */}
          <div className="flex-shrink-0 border-b border-[#edf1ed] px-5 pb-4 pt-5">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Inbox</p>
              {conversations.length > 0 && (
                <span className="rounded-full bg-[#e8ede9] px-2 py-0.5 text-[10px] font-bold text-[#87938b]">
                  {conversations.length}
                </span>
              )}
            </div>
            <h1 className="mb-4 text-xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#b0bfb8]" />
              <input
                type="text"
                placeholder="Search conversations…"
                className="h-10 w-full rounded-xl border border-[#d1ddd6] bg-[#f4f7f5] pl-9 pr-3 text-sm text-[#1e3d2e] outline-none placeholder:text-[#b0bfb8] focus:border-[#2d6b4e] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation list */}
          <ScrollArea className="flex-1">
            {isLoadingConversations && (
              <div className="space-y-1 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                    <div className="size-11 shrink-0 rounded-full bg-[#e8ede9]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 rounded-full bg-[#e8ede9]" />
                      <div className="h-3 w-48 rounded-full bg-[#e8ede9]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingConversations && filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-[#e6eceb] text-[#2d6b4e]">
                  <Search className="size-5" />
                </div>
                <p className="text-sm font-bold text-[#1e3d2e]">No conversations found</p>
                <p className="mt-1 text-xs text-[#87938b]">
                  {searchQuery ? "Try a different search term" : "Start by exploring brand campaigns"}
                </p>
              </div>
            )}

            <div className="space-y-0.5 p-2">
              {filteredConversations.map((conv) => {
                const participant = getConversationParticipant(conv);
                const previewTime = conv.lastMessage?.createdAt ?? conv.updatedAt;
                const previewText =
                  conv.lastMessage?.type === "offer"
                    ? "💼 Sent a deal offer"
                    : conv.lastMessage?.content || "Start a conversation";
                const isSelected = selectedConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-[#e6eceb]"
                        : "hover:bg-[#f4f7f5]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-11">
                        <AvatarImage src={participant.avatar} alt={participant.name} />
                        <AvatarFallback className="bg-[#e6eceb] text-sm font-bold text-[#2d6b4e]">
                          {getInitials(participant.name)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#2d6b4e] text-[9px] font-extrabold text-white">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`line-clamp-1 text-sm ${conv.unreadCount > 0 ? "font-extrabold text-[#1e3d2e]" : "font-semibold text-[#1e3d2e]"}`}>
                          {participant.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#b0bfb8]">
                          {formatRelativeTime(previewTime)}
                        </span>
                      </div>
                      <p className={`mt-0.5 truncate text-xs ${conv.unreadCount > 0 ? "font-medium text-[#496159]" : "text-[#87938b]"}`}>
                        {previewText}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* ── Chat panel ── */}
        <div className={`min-h-0 flex-1 flex-col ${showMobileChat ? "flex" : "hidden md:flex"}`}>
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-[#edf1ed] px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    className="grid size-9 place-items-center rounded-xl text-[#87938b] transition-colors hover:bg-[#f4f7f5] hover:text-[#1e3d2e] md:hidden"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={selectedParticipant?.avatar} alt={selectedParticipant?.name} />
                    <AvatarFallback className="bg-[#e6eceb] text-sm font-bold text-[#2d6b4e]">
                      {getInitials(selectedParticipant?.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {selectedParticipant?.href ? (
                      <Link
                        href={selectedParticipant.href}
                        className="line-clamp-1 text-sm font-extrabold text-[#1e3d2e] hover:text-[#2d6b4e] hover:underline"
                      >
                        {selectedParticipant.name}
                      </Link>
                    ) : (
                      <span className="line-clamp-1 text-sm font-extrabold text-[#1e3d2e]">
                        {selectedParticipant?.name}
                      </span>
                    )}
                    <p className="text-xs text-[#87938b]">{selectedParticipant?.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[{ icon: Phone }, { icon: Video }].map(({ icon: Icon }, i) => (
                    <button
                      key={i}
                      type="button"
                      className="grid size-9 place-items-center rounded-xl text-[#87938b] transition-colors hover:bg-[#f4f7f5] hover:text-[#1e3d2e]"
                    >
                      <Icon className="size-4.5" />
                    </button>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-xl text-[#87938b] transition-colors hover:bg-[#f4f7f5] hover:text-[#1e3d2e]"
                      >
                        <MoreVertical className="size-4.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-2xl border border-[#d1ddd6] bg-white p-1 shadow-[0_8px_32px_rgba(38,70,50,0.12)]"
                    >
                      <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium text-[#1e3d2e] focus:bg-[#f4f7f5] focus:text-[#1e3d2e]">
                        View Profile
                      </DropdownMenuItem>
                      {!isCreatorView && (
                        <DropdownMenuItem
                          onClick={() => setIsQuickDealOpen(true)}
                          className="rounded-xl px-3 py-2 text-sm font-medium text-[#1e3d2e] focus:bg-[#f4f7f5] focus:text-[#1e3d2e]"
                        >
                          Send Quick Deal
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium text-[#1e3d2e] focus:bg-[#f4f7f5] focus:text-[#1e3d2e]">
                        Clear Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium text-[#c0392b] focus:bg-[#fce8e6] focus:text-[#c0392b]">
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages area */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf5] px-4 py-5 sm:px-6">
                <div className="space-y-5">
                  {isLoadingMessages && (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                          <div className={`animate-pulse rounded-2xl bg-[#e8ede9] ${i % 2 === 0 ? "rounded-bl-md" : "rounded-br-md"}`}
                            style={{ width: `${120 + i * 40}px`, height: "40px" }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoadingMessages && messages.length === 0 && selectedParticipant && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center py-16 text-center"
                    >
                      <Avatar className="mb-4 size-16">
                        <AvatarImage src={selectedParticipant.avatar} alt={selectedParticipant.name} />
                        <AvatarFallback className="bg-[#e6eceb] text-lg font-extrabold text-[#2d6b4e]">
                          {getInitials(selectedParticipant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-base font-extrabold text-[#1e3d2e]">
                        Start a conversation with {selectedParticipant.name}
                      </h2>
                      <p className="mt-1.5 max-w-xs text-sm text-[#87938b]">
                        Ask about availability, package fit, or ideas for your next campaign.
                      </p>
                    </motion.div>
                  )}

                  {messages.map((message) => {
                    const isOwn = message.senderId === currentSenderId;
                    const canRespondToOffer = isCreatorView && message.senderType === "brand";
                    const orderHref = isCreatorView ? "/creator/orders" : "/brand/orders";

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[80%] sm:max-w-[68%]">
                          {/* Text message */}
                          {message.type === "text" && (
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                isOwn
                                  ? "rounded-br-md bg-[#2d6b4e] text-white"
                                  : "rounded-bl-md border border-[#d1ddd6] bg-white text-[#1e3d2e]"
                              }`}
                            >
                              {message.content}
                            </div>
                          )}

                          {/* Attachment */}
                          {message.type === "attachment" && (() => {
                            const name = getAttachmentName(message.attachmentUrl);
                            const ext = name.split(".").pop()?.toLowerCase() ?? "";
                            const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
                              || (message.attachmentUrl && /\/(jpeg|jpg|png|webp|gif)($|\?)/i.test(message.attachmentUrl));
                            if (isImage && message.attachmentUrl) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => void downloadFile(message.attachmentUrl!, name).catch((e) => toast.error(e instanceof Error ? e.message : "Could not download"))}
                                  className={`overflow-hidden rounded-2xl ${isOwn ? "rounded-br-md" : "rounded-bl-md"} border border-[#d1ddd6] bg-white shadow-sm transition-opacity hover:opacity-90`}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={message.attachmentUrl}
                                    alt={name}
                                    className="max-h-64 max-w-full object-cover"
                                    loading="lazy"
                                  />
                                  <p className="truncate border-t border-[#d1ddd6] px-3 py-1.5 text-xs text-[#87938b]">{name}</p>
                                </button>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => message.attachmentUrl && void downloadFile(
                                  message.attachmentUrl,
                                  name,
                                ).catch((e) => toast.error(e instanceof Error ? e.message : "Could not download"))}
                                className={`flex min-w-0 items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                                  isOwn
                                    ? "rounded-br-md border-[#2d6b4e]/20 bg-[#2d6b4e] text-white hover:bg-[#1f5239]"
                                    : "rounded-bl-md border-[#d1ddd6] bg-white text-[#1e3d2e] hover:bg-[#f4f7f5]"
                                } ${!message.attachmentUrl ? "pointer-events-none opacity-70" : ""}`}
                              >
                                <FileText className="size-4 shrink-0" />
                                <span className="min-w-0 truncate">{name}</span>
                              </button>
                            );
                          })()}

                          {/* Offer card */}
                          {message.type === "offer" && message.offer && (
                            <div className="w-64 overflow-hidden rounded-2xl border border-[#d1ddd6] bg-white shadow-[0_4px_16px_rgba(38,70,50,0.08)]">
                              {/* Green header */}
                              <div className="flex items-center gap-2 bg-[#2d6b4e] px-4 py-3">
                                <div className="grid size-7 place-items-center rounded-lg bg-white/15">
                                  <DollarSign className="size-3.5 text-white" />
                                </div>
                                <span className="text-sm font-extrabold text-white">Deal Offer</span>
                              </div>
                              {/* Body */}
                              <div className="p-4 space-y-2.5">
                                <p className="text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">
                                  {message.offer.dealType} collaboration
                                </p>
                                {message.offer.amount ? (
                                  <p className="text-2xl font-extrabold tracking-[-0.04em] text-[#2d6b4e]">
                                    {formatPrice(message.offer.amount)}
                                  </p>
                                ) : null}
                                <p className="text-sm leading-5 text-[#87938b]">{message.offer.message}</p>
                                {message.offer.barterDetails && (
                                  <p className="text-xs text-[#87938b]">{message.offer.barterDetails}</p>
                                )}
                                {message.offer.creatorExpectation && (
                                  <p className="text-xs text-[#87938b]">
                                    Expected: {message.offer.creatorExpectation}
                                  </p>
                                )}

                                {/* Pending */}
                                {message.offer.status === "pending" && (
                                  canRespondToOffer ? (
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        type="button"
                                        disabled={!message.offer.id || respondingOfferId === message.offer.id}
                                        onClick={() => void respondToOffer(message, "accepted")}
                                        className="flex-1 rounded-full bg-[#2d6b4e] py-2 text-xs font-extrabold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
                                      >
                                        {respondingOfferId === message.offer.id ? "Saving…" : "Accept"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!message.offer.id || respondingOfferId === message.offer.id}
                                        onClick={() => void respondToOffer(message, "rejected")}
                                        className="flex-1 rounded-full border-2 border-[#d1ddd6] py-2 text-xs font-extrabold text-[#87938b] transition-colors hover:border-[#c0392b] hover:text-[#c0392b] disabled:opacity-60"
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8c98a] bg-[#fdf3dc] px-3 py-1 text-[10px] font-bold text-[#9b6712]">
                                      <Clock className="size-3" />
                                      Awaiting response
                                    </span>
                                  )
                                )}

                                {/* Accepted */}
                                {message.offer.status === "accepted" && (
                                  <div className="flex flex-col gap-2 pt-1">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f1e8] px-3 py-1 text-[10px] font-extrabold text-[#2d6b4e]">
                                      <Check className="size-3" /> Accepted
                                    </span>
                                    {message.offer.orderId && (
                                      <Link
                                        href={orderHref}
                                        className="flex items-center gap-1.5 rounded-full border border-[#d1ddd6] px-3 py-1.5 text-xs font-bold text-[#1e3d2e] transition-colors hover:border-[#b0c5ba]"
                                      >
                                        <Package className="size-3.5" /> View order
                                      </Link>
                                    )}
                                  </div>
                                )}

                                {/* Rejected */}
                                {message.offer.status === "rejected" && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fce8e6] px-3 py-1 text-[10px] font-extrabold text-[#c0392b]">
                                    <X className="size-3" /> Declined
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Timestamp + read receipt */}
                          <div className={`mt-1 flex items-center gap-1 text-[10px] text-[#b0bfb8] ${isOwn ? "justify-end" : ""}`}>
                            <span>{formatRelativeTime(message.createdAt)}</span>
                            {isOwn && (
                              message.isRead
                                ? <CheckCheck className="size-3 text-[#e6aa38]" />
                                : <Check className="size-3" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 border-t border-[#edf1ed] bg-white px-3 py-3 sm:px-4">
                <div className="flex items-center gap-1.5">
                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                    onChange={(e) => void handleSendAttachment(e.target.files?.[0])} />
                  <input ref={fileInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo,application/pdf,text/plain,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden" onChange={(e) => void handleSendAttachment(e.target.files?.[0])} />

                  <button
                    type="button"
                    disabled={isSendingAttachment}
                    onClick={() => imageInputRef.current?.click()}
                    className="grid size-9 place-items-center rounded-xl text-[#b0bfb8] transition-colors hover:bg-[#f4f7f5] hover:text-[#2d6b4e] disabled:opacity-50"
                  >
                    <ImageIcon className="size-4.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isSendingAttachment}
                    onClick={() => fileInputRef.current?.click()}
                    className="grid size-9 place-items-center rounded-xl text-[#b0bfb8] transition-colors hover:bg-[#f4f7f5] hover:text-[#2d6b4e] disabled:opacity-50"
                  >
                    <Paperclip className="size-4.5" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message…"
                    className="h-10 flex-1 rounded-full border border-[#d1ddd6] bg-[#f4f7f5] px-4 text-sm text-[#1e3d2e] outline-none placeholder:text-[#b0bfb8] focus:border-[#2d6b4e] transition-colors"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />

                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={!newMessage.trim() || isSending}
                    className="grid size-10 place-items-center rounded-full bg-[#2d6b4e] text-white transition-colors hover:bg-[#1f5239] disabled:opacity-50"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no conversation selected */
            <div className="flex flex-1 flex-col items-center justify-center bg-[#fbfaf5] p-8 text-center">
              <div className="mb-5 grid size-20 place-items-center rounded-3xl bg-[#e6eceb]">
                <Send className="size-9 text-[#2d6b4e]" />
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Messages</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">Your Inbox</h2>
              <p className="mt-2 max-w-xs text-sm text-[#87938b]">
                {isCreatorView
                  ? "Select a conversation to continue your active brand collaboration chats."
                  : "Select a conversation or start a new one by visiting a creator profile."}
              </p>
              <Link
                href={isCreatorView ? "/creator/dashboard" : "/brand/explore"}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#2d6b4e] px-6 text-sm font-extrabold text-white transition-colors hover:bg-[#1f5239]"
              >
                {isCreatorView ? "Go to Dashboard" : "Find Creators"}
              </Link>
            </div>
          )}
        </div>
      </div>

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

  async function handleQuickDealCreated(result: { conversationId: string; messageId: string; offerId: string }) {
    const refreshed = await loadConversations();
    const target = refreshed.find((c) => c.id === result.conversationId);
    if (target) { setSelectedConversation(target); setShowMobileChat(true); }
    await loadMessagesForConversation(result.conversationId);
  }
}
