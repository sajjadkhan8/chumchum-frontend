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
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Package,
  X,
  Eye,
  Trash2,
  Ban,
  ShieldAlert,
  ShieldCheck,
  Download,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QuickDealModal } from "@/components/quick-deal-modal";
import { creatorsService } from "@/services/creators.service";
import { messagesService } from "@/services/messages.service";
import { apiClient } from "@/lib/api/client";
import { getCategoryLabel } from "@/lib/categories";
import { formatRelativeTime, formatPrice, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Message, Conversation } from "@/types";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download-file";

function ProtectedImagePreview({ url, name }: { url: string; name: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    let nextObjectUrl: string | null = null;

    setObjectUrl(null);
    setFailed(false);

    if (!url.startsWith('/api/v1/files/')) {
      setObjectUrl(url);
      return;
    }

    void apiClient.download(url)
      .then(({ blob }) => {
        if (!blob.type.startsWith('image/')) {
          setFailed(true);
          return;
        }
        nextObjectUrl = URL.createObjectURL(blob);
        if (revoked) {
          URL.revokeObjectURL(nextObjectUrl);
          return;
        }
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => setFailed(true));

    return () => {
      revoked = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [url]);

  if (failed) {
    return (
      <div className="flex h-36 w-64 max-w-full flex-col items-center justify-center gap-2 bg-[#f4f7f5] px-4 text-center">
        <div className="grid size-10 place-items-center rounded-2xl bg-[#e8f0ec]">
          <ImageIcon className="size-5 text-[#2d6b4e]" />
        </div>
        <p className="max-w-full truncate text-xs font-bold text-[#647168]">{name}</p>
        <p className="text-[11px] font-medium text-[#87938b]">Preview unavailable</p>
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className="h-36 w-64 max-w-full animate-pulse bg-gradient-to-br from-[#edf3ef] to-[#f8faf8]" />
    );
  }

  return (
    <img
      src={objectUrl}
      alt={name}
      className="max-h-64 max-w-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const messagesAreSame = (left: Message[], right: Message[]) => (
  left.length === right.length
  && left.every((message, index) => {
    const next = right[index];
    return Boolean(next)
      && message.id === next.id
      && message.content === next.content
      && message.type === next.type
      && message.isRead === next.isRead
      && message.attachmentUrl === next.attachmentUrl
      && message.attachmentOriginalName === next.attachmentOriginalName
      && message.offer?.status === next.offer?.status
      && message.offer?.orderId === next.offer?.orderId;
  })
);

export function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorParam = searchParams.get("creator");
  const conversationParam = searchParams.get("conversation");
  const orderParam = searchParams.get("order");
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
  const [confirmAction, setConfirmAction] = useState<"clear" | "block" | null>(null);
  const [isConversationActionPending, setIsConversationActionPending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedCreatorParamRef = useRef<string | null>(null);
  const processedOrderParamRef = useRef<string | null>(null);
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
        const lastSeenAt = conversation.brandLastSeenAt;
        return {
          id: conversation.brand.id,
          name: conversation.brand.name,
          avatar: conversation.brand.logo,
          subtitle: getCategoryLabel(conversation.brand.category),
          online: Boolean(conversation.brandOnline),
          lastSeenAt,
          presenceText: conversation.brandOnline
            ? "Online"
            : lastSeenAt
              ? `Last seen ${formatRelativeTime(lastSeenAt)}`
              : "Offline",
          href: null,
        };
      }
      const lastSeenAt = conversation.creatorLastSeenAt;
      return {
        id: conversation.creator.id,
        name: conversation.creator.name,
        avatar: conversation.creator.avatar,
        subtitle: `@${conversation.creator.username}`,
        online: Boolean(conversation.creatorOnline),
        lastSeenAt,
        presenceText: conversation.creatorOnline
          ? "Online"
          : lastSeenAt
            ? `Last seen ${formatRelativeTime(lastSeenAt)}`
            : "Offline",
        href: `/creator/${conversation.creator.username}`,
      };
    },
    [isCreatorView],
  );

  const selectedParticipant = selectedConversation ? getConversationParticipant(selectedConversation) : null;
  const selectedContext = selectedConversation && selectedConversation.contextType !== "general"
    ? selectedConversation
    : null;
  const conversationIsBlocked = Boolean(selectedConversation?.blockedByMe || selectedConversation?.blockedByThem);
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
    const existing = data.find((c) =>
      c.contextType === "general" && (c.creatorId === target || c.creator.username === target)
    );
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

  const selectConversationFromOrderParam = useCallback(async (orderId: string) => {
    if (!user || (user.role !== "creator" && user.role !== "brand")) return;
    const data = await loadConversations();
    const conversation = await messagesService.openOrderConversation(orderId, user.role, data);
    setConversations((prev) => [conversation, ...prev.filter((c) => c.id !== conversation.id)]);
    setSelectedConversation(conversation);
    setShowMobileChat(true);
    router.replace(buildMessagesHref({ conversation: conversation.id }));
  }, [buildMessagesHref, loadConversations, router, user]);

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
    if (!orderParam || !user || (user.role !== "creator" && user.role !== "brand")) return;
    const key = `${user.id}:${orderParam}`;
    if (processedOrderParamRef.current === key) return;
    processedOrderParamRef.current = key;
    void selectConversationFromOrderParam(orderParam).catch((error) => {
      processedOrderParamRef.current = null;
      toast.error(error instanceof Error ? error.message : "Failed to open order conversation");
    });
  }, [orderParam, selectConversationFromOrderParam, user]);

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
        setMessages((prev) => (messagesAreSame(prev, data) ? prev : data));
        await messagesService.markAsRead(convo.id);
      } catch {
        // Silent — polling failures don't show toasts.
      }
    };

    const silentRefreshConversations = async () => {
      if (!user || (user.role !== "creator" && user.role !== "brand") || document.visibilityState !== "visible") return;
      try {
        const { items } = await messagesService.getConversations(user.id, user.role, 0, 50);
        setConversations(items);
        setSelectedConversation((current) => {
          if (!current) return current;
          return items.find((conversation) => conversation.id === current.id) || current;
        });
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
    if (conversationIsBlocked) {
      toast.error(selectedConversation.blockedByMe ? "You blocked this user." : "This conversation is blocked.");
      return;
    }
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
    if (conversationIsBlocked) {
      toast.error(selectedConversation.blockedByMe ? "You blocked this user." : "This conversation is blocked.");
      return;
    }
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

  const handleViewProfile = () => {
    if (!selectedParticipant?.href) return;
    router.push(selectedParticipant.href);
  };

  const handleClearChat = async () => {
    if (!selectedConversation) return;
    setIsConversationActionPending(true);
    try {
      await messagesService.clearChat(selectedConversation.id);
      setMessages([]);
      setConversations((prev) => prev.map((conversation) =>
        conversation.id === selectedConversation.id
          ? { ...conversation, lastMessage: undefined, unreadCount: 0, updatedAt: new Date() }
          : conversation
      ));
      toast.success("Chat cleared for you");
      setConfirmAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear chat");
    } finally {
      setIsConversationActionPending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;
    setIsConversationActionPending(true);
    try {
      await messagesService.blockUser(selectedConversation.id);
      const blocked = { ...selectedConversation, blockedByMe: true, unreadCount: 0 };
      setSelectedConversation(blocked);
      setConversations((prev) => prev.map((conversation) =>
        conversation.id === selectedConversation.id ? { ...conversation, blockedByMe: true, unreadCount: 0 } : conversation
      ));
      toast.success("User blocked");
      setConfirmAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to block user");
    } finally {
      setIsConversationActionPending(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedConversation) return;
    setIsConversationActionPending(true);
    try {
      await messagesService.unblockUser(selectedConversation.id);
      const unblocked = { ...selectedConversation, blockedByMe: false };
      setSelectedConversation(unblocked);
      setConversations((prev) => prev.map((conversation) =>
        conversation.id === selectedConversation.id ? { ...conversation, blockedByMe: false } : conversation
      ));
      toast.success("User unblocked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unblock user");
    } finally {
      setIsConversationActionPending(false);
    }
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
                    ? "Sent a deal offer"
                    : conv.lastMessage?.content || (conv.contextType === "order" ? "Order conversation" : "Start a conversation");
                const isSelected = selectedConversation?.id === conv.id;
                const contextLabel = conv.contextType === "order"
                  ? conv.contextLabel || "Order"
                  : conv.contextType !== "general"
                    ? conv.contextLabel || conv.contextType
                    : null;

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
                      <span
                        className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                          participant.online ? "bg-[#2d9f61]" : "bg-[#c4cdc8]"
                        }`}
                        title={participant.presenceText}
                      />
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
                      <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                        {contextLabel && (
                          <span className="shrink-0 rounded-full border border-[#d9e5dd] bg-white px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#2d6b4e]">
                            {contextLabel}
                          </span>
                        )}
                        <p className={`truncate text-xs ${conv.unreadCount > 0 ? "font-medium text-[#496159]" : "text-[#87938b]"}`}>
                          {previewText}
                        </p>
                      </div>
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
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${selectedParticipant?.online ? "bg-[#2d9f61]" : "bg-[#c4cdc8]"}`}
                      />
                      <p className="text-xs font-semibold text-[#87938b]">
                        {selectedParticipant?.presenceText || selectedParticipant?.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
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
                      sideOffset={8}
                      className="w-64 rounded-2xl border border-[#d8e4dd] bg-white/95 p-2 shadow-[0_18px_48px_rgba(30,61,46,0.16)] backdrop-blur-md"
                    >
                      <DropdownMenuLabel className="px-2 pb-2 pt-1">
                        <span className="block truncate text-[12px] font-extrabold text-[#1e3d2e]">{selectedParticipant?.name}</span>
                        <span className="block truncate text-[11px] font-semibold text-[#87938b]">
                          {conversationIsBlocked ? "Messaging paused" : selectedParticipant?.subtitle}
                        </span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="mx-0 bg-[#edf1ed]" />
                      {selectedParticipant?.href && (
                        <DropdownMenuItem
                          onClick={handleViewProfile}
                          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1e3d2e] focus:bg-[#f4f7f5] focus:text-[#1e3d2e]"
                        >
                          <Eye className="size-4 text-[#2d6b4e]" />
                          View Profile
                        </DropdownMenuItem>
                      )}
                      {!isCreatorView && selectedConversation.contextType === "general" && (
                        <DropdownMenuItem
                          onClick={() => setIsQuickDealOpen(true)}
                          disabled={conversationIsBlocked}
                          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1e3d2e] focus:bg-[#f4f7f5] focus:text-[#1e3d2e]"
                        >
                          <DollarSign className="size-4 text-[#b77a12]" />
                          Send Quick Deal
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="mx-0 bg-[#edf1ed]" />
                      <DropdownMenuItem
                        onClick={() => setConfirmAction("clear")}
                        className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1e3d2e] focus:bg-[#f4f7f5] focus:text-[#1e3d2e]"
                      >
                        <Trash2 className="size-4 text-[#7a8f82]" />
                        Clear Chat
                      </DropdownMenuItem>
                      {selectedConversation.blockedByMe ? (
                        <DropdownMenuItem
                          onClick={() => void handleUnblockUser()}
                          disabled={isConversationActionPending}
                          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1f5239] focus:bg-[#e8f0ec] focus:text-[#1f5239]"
                        >
                          <ShieldCheck className="size-4 text-[#2d6b4e]" />
                          Unblock User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setConfirmAction("block")}
                          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#b42318] focus:bg-[#fff0ed] focus:text-[#b42318]"
                        >
                          <Ban className="size-4 text-[#b42318]" />
                          Block User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {selectedContext && (
                <div className="border-b border-[#edf1ed] bg-[#fbfaf5] px-4 py-2.5 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d9e5dd] bg-white px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#e7f0ea] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#2d6b4e]">
                          {selectedContext.contextLabel || selectedContext.contextType}
                        </span>
                        {selectedContext.contextStatus && (
                          <span className="rounded-full bg-[#fbfaf5] px-2 py-0.5 text-[10px] font-black capitalize text-[#647168]">
                            {selectedContext.contextStatus.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm font-extrabold text-[#1e3d2e]">
                        {selectedContext.contextTitle || "Context conversation"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#647168]">
                      {selectedContext.contextAmount ? <span>{formatPrice(selectedContext.contextAmount)}</span> : null}
                      {selectedContext.contextType === "order" && selectedContext.contextId && (
                        <Link
                          href={isCreatorView ? `/creator/orders?order=${selectedContext.contextId}` : `/brand/orders?order=${selectedContext.contextId}`}
                          className="rounded-full border border-[#d9e5dd] px-3 py-1.5 font-black text-[#2d6b4e] transition-colors hover:bg-[#e7f0ea]"
                        >
                          View order
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages area */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf5] px-4 py-5 sm:px-6">
                <div className="space-y-5">
                  {conversationIsBlocked && (
                    <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-[#f4c7bf] bg-[#fff4f1] px-4 py-3 text-left">
                      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#b42318]" />
                      <div>
                        <p className="text-sm font-extrabold text-[#7f1d1d]">
                          {selectedConversation.blockedByMe ? "You blocked this user" : "This conversation is blocked"}
                        </p>
                        <p className="mt-0.5 text-xs font-medium leading-5 text-[#9f6b61]">
                          Messages, files, and quick deals are paused for this conversation.
                        </p>
                      </div>
                    </div>
                  )}
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
                        {selectedContext ? `Start this ${selectedContext.contextLabel?.toLowerCase() || "context"} thread` : `Start a conversation with ${selectedParticipant.name}`}
                      </h2>
                      <p className="mt-1.5 max-w-xs text-sm text-[#87938b]">
                        {selectedContext
                          ? "Keep updates, files, and decisions tied to this specific collaboration."
                          : "Ask about availability, package fit, or ideas for your next campaign."}
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
                            const name = message.attachmentOriginalName || getAttachmentName(message.attachmentUrl);
                            const ext = name.split(".").pop()?.toLowerCase() ?? "";
                            const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
                              || (message.attachmentUrl && /\/(jpeg|jpg|png|webp|gif)($|\?)/i.test(message.attachmentUrl));
                            if (isImage && message.attachmentUrl) {
                              return (
                                <div
                                  className={`overflow-hidden rounded-2xl ${isOwn ? "rounded-br-md" : "rounded-bl-md"} border border-[#d1ddd6] bg-white shadow-sm`}
                                >
                                  <ProtectedImagePreview url={message.attachmentUrl} name={name} />
                                  <div className="flex items-center gap-2 border-t border-[#d1ddd6] px-3 py-2">
                                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[#647168]">{name}</p>
                                    <button
                                      type="button"
                                      onClick={() => void downloadFile(message.attachmentUrl!, name).catch((e) => toast.error(e instanceof Error ? e.message : "Could not download"))}
                                      aria-label={`Download ${name}`}
                                      title="Download"
                                      className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e] transition-colors hover:bg-[#dbe9e1] hover:text-[#1f5239]"
                                    >
                                      <Download className="size-4" />
                                    </button>
                                  </div>
                                </div>
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
                    disabled={isSendingAttachment || conversationIsBlocked}
                    onClick={() => imageInputRef.current?.click()}
                    className="grid size-9 place-items-center rounded-xl text-[#b0bfb8] transition-colors hover:bg-[#f4f7f5] hover:text-[#2d6b4e] disabled:opacity-50"
                  >
                    <ImageIcon className="size-4.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isSendingAttachment || conversationIsBlocked}
                    onClick={() => fileInputRef.current?.click()}
                    className="grid size-9 place-items-center rounded-xl text-[#b0bfb8] transition-colors hover:bg-[#f4f7f5] hover:text-[#2d6b4e] disabled:opacity-50"
                  >
                    <Paperclip className="size-4.5" />
                  </button>

                  <input
                    type="text"
                    placeholder={conversationIsBlocked ? "Conversation blocked" : "Type a message…"}
                    className="h-10 flex-1 rounded-full border border-[#d1ddd6] bg-[#f4f7f5] px-4 text-sm text-[#1e3d2e] outline-none placeholder:text-[#b0bfb8] focus:border-[#2d6b4e] transition-colors"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={conversationIsBlocked}
                  />

                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={!newMessage.trim() || isSending || conversationIsBlocked}
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

      {!isCreatorView && selectedConversation && selectedConversation.contextType === "general" && (
        <QuickDealModal
          creator={selectedConversation.creator}
          isOpen={isQuickDealOpen}
          onClose={() => setIsQuickDealOpen(false)}
          onCreated={(result) => void handleQuickDealCreated(result)}
        />
      )}

      <AlertDialog open={confirmAction === "clear"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-2xl border-[#d8e4dd] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1e3d2e]">Clear this chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#647168]">
              This will hide the current message history from your inbox. It will not delete records needed for orders, offers, or dispute review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConversationActionPending} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isConversationActionPending}
              onClick={(event) => {
                event.preventDefault();
                void handleClearChat();
              }}
              className="rounded-xl bg-[#2d6b4e] text-white hover:bg-[#1f5239]"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === "block"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-2xl border-[#f4c7bf] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#7f1d1d]">Block this user?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#7f5b55]">
              This will stop messages, file attachments, and quick deals in this conversation. Existing records stay available for safety and support review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConversationActionPending} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isConversationActionPending}
              onClick={(event) => {
                event.preventDefault();
                void handleBlockUser();
              }}
              className="rounded-xl bg-[#b42318] text-white hover:bg-[#8f1c14]"
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  async function handleQuickDealCreated(result: { conversationId: string; messageId: string; offerId: string }) {
    const refreshed = await loadConversations();
    const target = refreshed.find((c) => c.id === result.conversationId);
    if (target) { setSelectedConversation(target); setShowMobileChat(true); }
    await loadMessagesForConversation(result.conversationId);
  }
}
