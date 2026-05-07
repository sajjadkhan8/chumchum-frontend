"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Search, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { CreatorCard } from "@/components/creator-card";
import { EmptyState } from "@/components/empty-state";
import { creators } from "@/data/creators";
import { useAuthStore } from "@/store/auth-store";

export default function BrandSavedPage() {
  const router = useRouter();
  const { savedCreators } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const savedCreatorsList = creators.filter((c) =>
    savedCreators.includes(c.id)
  );

  const filteredCreators = savedCreatorsList.filter((creator) =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.categories.some((cat) =>
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedCreators = [...filteredCreators].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "followers":
        return (
          b.platforms.reduce((sum, p) => sum + p.followers, 0) -
          a.platforms.reduce((sum, p) => sum + p.followers, 0)
        );
      case "price_low":
        return (a.minPrice ?? 0) - (b.minPrice ?? 0);
      case "price_high":
        return (b.minPrice ?? 0) - (a.minPrice ?? 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 pt-20 md:p-6 md:pt-20 pb-24 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Saved Creators
          </h1>
          <p className="text-muted-foreground">
            {savedCreatorsList.length} creator
            {savedCreatorsList.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {savedCreatorsList.length > 0 ? (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search saved creators..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Saved</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="followers">Most Followers</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden md:flex">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Creators Grid/List */}
            {sortedCreators.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "space-y-4"
                }
              >
                {sortedCreators.map((creator, index) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CreatorCard
                      creator={creator}
                      variant={viewMode === "list" ? "horizontal" : "default"}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No results found</h3>
                  <p className="text-center text-muted-foreground">
                    No saved creators match your search.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <EmptyState
            icon={Heart}
            title="No saved creators yet"
            description="Save creators you're interested in to easily find them later."
            action={{
              label: "Explore Creators",
              onClick: () => router.push("/brand/explore"),
            }}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
