"use client";

import { Suspense, useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  File,
  DollarSign,
  Package,
  X,
  Plus,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { mockBrands } from "@/data/brands";
import { getMessagesByConversationId, mockConversations } from "@/data/messages";
import { creators } from "@/data/creators";
import { formatRelativeTime, formatPrice, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Message, Conversation } from "@/types";
import { toast } from "sonner";

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const creatorParam = searchParams.get("creator");
  const { user } = useAuthStore();
  const isCreatorView = user?.role === "creator";
  const fallbackBrand = mockBrands[0];

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getConversationParticipant = (conversation: Conversation) => {
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
  };

  const selectedParticipant = selectedConversation
    ? getConversationParticipant(selectedConversation)
    : null;
  const currentSenderId = selectedConversation
    ? isCreatorView
      ? selectedConversation.creatorId
      : selectedConversation.brandId
    : isCreatorView
      ? user?.id || "creator"
      : fallbackBrand.id;

  // Filter conversations based on search
  const roleScopedConversations = useMemo(() => {
    if (isCreatorView) {
      return mockConversations.filter(
        (conversation) => conversation.creatorId === (user?.id || "1")
      );
    }

    return mockConversations.filter(
      (conversation) => conversation.brandId === fallbackBrand.id
    );
  }, [isCreatorView, user?.id]);

  const filteredConversations = useMemo(() => {
    return roleScopedConversations.filter((conv) =>
      getConversationParticipant(conv).name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, roleScopedConversations]);

  // Auto-select conversation if creator param is present
  useEffect(() => {
    if (creatorParam) {
      const creator = creators.find(
        (c) => c.id === creatorParam || c.username === creatorParam
      );
      if (creator) {
        const existingConv = mockConversations.find(
          (conversation) => conversation.creatorId === creator.id
        );
        if (existingConv) {
          setSelectedConversation(existingConv);
          setMessages(getMessagesByConversationId(existingConv.id));
        } else {
          // Create a new conversation placeholder
          const newConv: Conversation = {
            id: `new-${creator.id}`,
            creatorId: creator.id,
            creator,
            brandId: fallbackBrand.id,
            brand: fallbackBrand,
            unreadCount: 0,
            updatedAt: new Date(),
          };
          setSelectedConversation(newConv);
          setMessages([]);
        }
        setShowMobileChat(true);
      }
    }
  }, [creatorParam]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      setMessages(getMessagesByConversationId(selectedConversation.id));
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setIsSending(true);

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: currentSenderId,
      senderType: isCreatorView ? "creator" : "brand",
      content: newMessage.trim(),
      type: "text",
      isRead: false,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");
    await new Promise((resolve) => setTimeout(resolve, 250));
    setIsSending(false);
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

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Conversations List */}
        <div
          className={`w-full border-r border-border md:w-80 lg:w-96 ${showMobileChat ? "hidden md:block" : "block"}`}
        >
          <div className="flex h-full flex-col">
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
          className={`flex flex-1 flex-col ${showMobileChat ? "block" : "hidden md:flex"}`}
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
                      <DropdownMenuItem>Send Quick Deal</DropdownMenuItem>
                      <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-3 sm:p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentSenderId;
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
                                {message.offer.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button size="sm" className="flex-1">
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                )}
                                {message.offer.status === "accepted" && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700"
                                  >
                                    <Check className="mr-1 h-3 w-3" />
                                    Accepted
                                  </Badge>
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
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-border bg-background p-3 pb-safe sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-tap"
                    onClick={() => toast.info("Media picker will be available in the next messaging release.")}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-tap"
                    onClick={() => toast.info("File attachments are not enabled in demo mode.")}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
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

