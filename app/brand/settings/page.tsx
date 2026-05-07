"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Building2,
  Camera,
  Save,
  Globe,
  MapPin,
  Users,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { getInitials } from "@/lib/utils";

const industries = [
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Technology",
  "Food & Beverage",
  "Health & Fitness",
  "Travel & Hospitality",
  "Entertainment",
  "Education",
  "Finance",
  "E-commerce",
  "Other",
];

const companySizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
];

export default function BrandSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    companyName: "FreshMart Pakistan",
    email: "marketing@freshmart.pk",
    phone: "+92 21 1234567",
    website: "https://freshmart.pk",
    industry: "Food & Beverage",
    companySize: "51-200 employees",
    city: "Karachi",
    description:
      "Leading organic food retailer in Pakistan, committed to bringing fresh and healthy products to every home.",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400",
    contactName: "Ali Hassan",
    contactEmail: "ali@freshmart.pk",
    contactPhone: "+92 300 1234567",
  });

  const [notifications, setNotifications] = useState({
    newMessages: true,
    orderUpdates: true,
    creatorResponses: true,
    marketing: false,
    weeklyReport: true,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [billing, setBilling] = useState({
    plan: "Business",
    monthlyBudget: "500000",
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl p-4 pt-20 md:p-6 md:pt-20 pb-24 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your company profile and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="profile" className="gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Logo Section */}
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.logo} alt={profile.companyName} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(profile.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold">{profile.companyName}</h3>
                  <p className="text-muted-foreground">{profile.industry}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Logo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={profile.companyName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, companyName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={profile.industry}
                      onValueChange={(v) =>
                        setProfile((p) => ({ ...p, industry: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={profile.description}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="website"
                        className="pl-9"
                        value={profile.website}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, website: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={profile.city}
                      onValueChange={(v) =>
                        setProfile((p) => ({ ...p, city: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={profile.companySize}
                    onValueChange={(v) =>
                      setProfile((p) => ({ ...p, companySize: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Person */}
            <Card>
              <CardHeader>
                <CardTitle>Primary Contact</CardTitle>
                <CardDescription>
                  Person responsible for creator communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contactName"
                      className="pl-9"
                      value={profile.contactName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, contactName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        className="pl-9"
                        value={profile.contactEmail}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            contactEmail: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        type="tel"
                        className="pl-9"
                        value={profile.contactPhone}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            contactPhone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">
                      {billing.plan} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Unlimited creators, priority support
                    </p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Budget</CardTitle>
                <CardDescription>
                  Set a monthly spending limit for campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (PKR)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={billing.monthlyBudget}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, monthlyBudget: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll receive a notification when you reach 80% of your budget
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">
                        Expires 12/2025
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "newMessages",
                    label: "New messages",
                    description: "Get notified when creators message you",
                  },
                  {
                    key: "orderUpdates",
                    label: "Order updates",
                    description: "Receive updates on your campaign progress",
                  },
                  {
                    key: "creatorResponses",
                    label: "Creator responses",
                    description: "Get notified when creators respond to offers",
                  },
                  {
                    key: "marketing",
                    label: "Marketing",
                    description: "Receive tips and promotional content",
                  },
                  {
                    key: "weeklyReport",
                    label: "Weekly report",
                    description: "Summary of your weekly campaign performance",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={
                        notifications[
                          item.key as keyof typeof notifications
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        setNotifications((n) => ({ ...n, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status: Disabled</p>
                    <p className="text-sm text-muted-foreground">
                      Protect your account with 2FA
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage who has access to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>AH</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Ali Hassan</p>
                        <p className="text-sm text-muted-foreground">
                          ali@freshmart.pk • Owner
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>SK</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Sara Khan</p>
                        <p className="text-sm text-muted-foreground">
                          sara@freshmart.pk • Admin
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}
