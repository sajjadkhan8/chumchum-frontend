"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Package,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  Instagram,
  Youtube,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";

const myPackages = [
  {
    id: "1",
    name: "Instagram Story Pack",
    description: "3 engaging Instagram stories with polls, questions, and product features",
    platform: "instagram",
    contentType: "story",
    price: 15000,
    deliveryTime: 3,
    revisions: 2,
    isActive: true,
    bookings: 12,
    deliverables: [
      "3 Instagram Stories",
      "Story Highlights",
      "Swipe Up Links (if available)",
    ],
  },
  {
    id: "2",
    name: "Instagram Reel Creation",
    description: "Professional short-form video content with trending audio and effects",
    platform: "instagram",
    contentType: "reel",
    price: 25000,
    deliveryTime: 5,
    revisions: 3,
    isActive: true,
    bookings: 8,
    deliverables: [
      "1 Instagram Reel (30-60 sec)",
      "Optimized Caption",
      "Hashtag Research",
      "Posting at optimal time",
    ],
  },
  {
    id: "3",
    name: "YouTube Video Review",
    description: "In-depth product review with detailed analysis and honest feedback",
    platform: "youtube",
    contentType: "video",
    price: 45000,
    deliveryTime: 7,
    revisions: 2,
    isActive: true,
    bookings: 5,
    deliverables: [
      "10-15 min YouTube Video",
      "SEO-optimized Title & Description",
      "Custom Thumbnail",
      "End Screen & Cards",
    ],
  },
  {
    id: "4",
    name: "TikTok Viral Package",
    description: "Creative TikTok content designed for maximum engagement",
    platform: "tiktok",
    contentType: "video",
    price: 20000,
    deliveryTime: 4,
    revisions: 2,
    isActive: false,
    bookings: 3,
    deliverables: [
      "2 TikTok Videos",
      "Trending Sound Integration",
      "Hashtag Strategy",
    ],
  },
];

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Clock,
};

export default function CreatorPackagesPage() {
  const [packages, setPackages] = useState(myPackages);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleToggleActive = (packageId: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId ? { ...pkg, isActive: !pkg.isActive } : pkg
      )
    );
  };

  const handleDeletePackage = () => {
    if (selectedPackage) {
      setPackages((prev) => prev.filter((pkg) => pkg.id !== selectedPackage));
      setDeleteDialogOpen(false);
      setSelectedPackage(null);
    }
  };

  const activePackages = packages.filter((p) => p.isActive);
  const inactivePackages = packages.filter((p) => !p.isActive);

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            My Packages
          </h1>
          <p className="text-muted-foreground">
            Create and manage your service packages
          </p>
        </div>
        <Button asChild>
          <Link href="/creator/packages/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{packages.length}</p>
              <p className="text-sm text-muted-foreground">Total Packages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activePackages.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <EyeOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactivePackages.length}</p>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Grid */}
      <div className="space-y-8">
        {/* Active Packages */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Active Packages</h2>
          {activePackages.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activePackages.map((pkg, index) => {
                const PlatformIcon = platformIcons[pkg.platform] || Package;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <PlatformIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{pkg.name}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {pkg.platform} • {pkg.contentType}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPackage(pkg.id);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedPackage(pkg.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                          {pkg.description}
                        </p>

                        <div className="mb-4 flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            {pkg.deliveryTime} days
                          </Badge>
                          <Badge variant="secondary">
                            {pkg.revisions} revisions
                          </Badge>
                          <Badge variant="outline">{pkg.bookings} bookings</Badge>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(pkg.price)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Active
                            </span>
                            <Switch
                              checked={pkg.isActive}
                              onCheckedChange={() => handleToggleActive(pkg.id)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No active packages</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Inactive Packages */}
        {inactivePackages.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
              Inactive Packages
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {inactivePackages.map((pkg, index) => {
                const PlatformIcon = platformIcons[pkg.platform] || Package;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="opacity-60">
                      <CardContent className="p-4">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              <PlatformIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{pkg.name}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {pkg.platform} • {pkg.contentType}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedPackage(pkg.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <p className="text-xl font-bold text-muted-foreground">
                            {formatPrice(pkg.price)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Inactive
                            </span>
                            <Switch
                              checked={pkg.isActive}
                              onCheckedChange={() => handleToggleActive(pkg.id)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this package? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePackage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
