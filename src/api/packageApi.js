import { apiRequest } from "./client";

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const normalizeTier = (tier) => {
  if (!tier) return null;

  return {
    id: tier.id || tier._id || "",
    name: tier.name || "",
    price: toNumber(tier.price),
    deliverables: Array.isArray(tier.deliverables)
      ? tier.deliverables.filter(Boolean)
      : toArray(tier.deliverables),
    delivery_days: toNumber(tier.delivery_days ?? tier.deliveryDays),
    revisions: toNumber(tier.revisions, 1),
    created_at: tier.created_at || tier.createdAt || null,
  };
};

const normalizeCreator = (creatorSource = {}, packageSource = {}) => {
  const userSource =
    creatorSource.user ||
    creatorSource.user_id ||
    creatorSource.userId ||
    creatorSource.userID ||
    packageSource.user ||
    packageSource.userID ||
    {};

  return {
    id:
      creatorSource.id ||
      creatorSource._id ||
      packageSource.creator_id ||
      packageSource.creatorId ||
      "",
    bio: creatorSource.bio || userSource.description || "",
    category: creatorSource.category || packageSource.category || "",
    rating: toNumber(creatorSource.rating ?? packageSource.rating),
    total_reviews: toNumber(
      creatorSource.total_reviews ?? creatorSource.totalReviews ?? packageSource.total_reviews ?? packageSource.totalReviews
    ),
    followers: toNumber(creatorSource.followers),
    avg_views: toNumber(creatorSource.avg_views ?? creatorSource.avgViews),
    engagement_rate: toNumber(
      creatorSource.engagement_rate ?? creatorSource.engagementRate
    ),
    user: {
      id: userSource.id || userSource._id || creatorSource.user_id || creatorSource.userId || "",
      username: userSource.username || userSource.name || "Creator",
      email: userSource.email || "",
      image: userSource.image || "/media/noavatar.png",
      city: userSource.city || "",
      country: userSource.country || "Pakistan",
      createdAt: userSource.created_at || userSource.createdAt || creatorSource.created_at || creatorSource.createdAt || null,
      description: userSource.description || creatorSource.bio || "",
      role: userSource.role || "CREATOR",
    },
  };
};

export const normalizePackage = (packageSource = {}) => {
  const coverImage = packageSource.cover_image || packageSource.coverImage || packageSource.cover || "";
  const mediaUrls = Array.isArray(packageSource.media_urls)
    ? packageSource.media_urls.filter(Boolean)
    : Array.isArray(packageSource.mediaUrls)
      ? packageSource.mediaUrls.filter(Boolean)
      : Array.isArray(packageSource.images)
        ? packageSource.images.filter(Boolean)
        : [];
  const deliverables = Array.isArray(packageSource.deliverables)
    ? packageSource.deliverables.filter(Boolean)
    : Array.isArray(packageSource.features)
      ? packageSource.features.filter(Boolean)
      : toArray(packageSource.deliverables || packageSource.features);
  const tags = Array.isArray(packageSource.tags)
    ? packageSource.tags.filter(Boolean)
    : toArray(packageSource.tags);
  const creator = normalizeCreator(
    packageSource.creator || packageSource.creatorProfile || packageSource.creator_info,
    packageSource
  );
  const tiers = Array.isArray(packageSource.package_tiers)
    ? packageSource.package_tiers.map(normalizeTier).filter(Boolean)
    : Array.isArray(packageSource.packageTiers)
      ? packageSource.packageTiers.map(normalizeTier).filter(Boolean)
      : Array.isArray(packageSource.tiers)
        ? packageSource.tiers.map(normalizeTier).filter(Boolean)
        : [];

  return {
    id: packageSource.id || packageSource._id || "",
    title: packageSource.title || "",
    description: packageSource.description || "",
    platform: packageSource.platform || "INSTAGRAM",
    category: packageSource.category || "",
    type: packageSource.type || "ONE_TIME",
    pricing_type: packageSource.pricing_type || packageSource.pricingType || "PAID",
    barter_details: packageSource.barter_details || packageSource.barterDetails || "",
    price: toNumber(packageSource.price),
    currency: packageSource.currency || "PKR",
    deliverables,
    delivery_days: toNumber(packageSource.delivery_days ?? packageSource.deliveryDays),
    duration_days:
      packageSource.duration_days ?? packageSource.durationDays ?? null,
    revisions: toNumber(packageSource.revisions ?? packageSource.revisionNumber, 1),
    cover_image: coverImage,
    media_urls: mediaUrls,
    tags,
    is_active: packageSource.is_active ?? packageSource.isActive ?? true,
    is_featured: packageSource.is_featured ?? packageSource.isFeatured ?? false,
    created_at: packageSource.created_at || packageSource.createdAt || null,
    updated_at: packageSource.updated_at || packageSource.updatedAt || null,
    creator_id: creator.id,
    creator,
    tiers,
    shortDescription:
      packageSource.shortDescription ||
      (packageSource.description?.length > 140
        ? `${packageSource.description.slice(0, 137)}...`
        : packageSource.description || ""),
    userID: {
      ...creator.user,
      description: creator.bio,
    },
  };
};

const normalizePackageCollection = (response) => {
  if (Array.isArray(response)) {
    return response.map(normalizePackage);
  }

  if (Array.isArray(response?.content)) {
    return response.content.map(normalizePackage);
  }

  if (Array.isArray(response?.data)) {
    return response.data.map(normalizePackage);
  }

  return [];
};

const buildPackageFilters = (filters = {}) => {
  const mappedFilters = {
    category: filters.category,
    search: filters.search,
    platform: filters.platform,
    type: filters.type,
    pricingType: filters.pricingType,
    pricing_type: filters.pricingType,
    creatorId: filters.creatorId,
    creator_id: filters.creatorId,
    minPrice: filters.minPrice ?? filters.min,
    maxPrice: filters.maxPrice ?? filters.max,
    min: filters.minPrice ?? filters.min,
    max: filters.maxPrice ?? filters.max,
    sort: filters.sort,
  };

  return Object.entries(mappedFilters).reduce((accumulator, [key, value]) => {
    if ([undefined, null, ""].includes(value)) {
      return accumulator;
    }

    return {
      ...accumulator,
      [key]: value,
    };
  }, {});
};

const serializeTier = (tier) => {
  const deliverables = Array.isArray(tier.deliverables)
    ? tier.deliverables.filter(Boolean).join(", ")
    : toArray(tier.deliverables).join(", ");

  return {
    name: tier.name,
    price: toNumber(tier.price),
    deliverables,
    delivery_days: toNumber(tier.delivery_days ?? tier.deliveryDays),
    revisions: toNumber(tier.revisions, 1),
  };
};

const serializePackagePayload = (payload = {}) => {
  const tiers = Array.isArray(payload.tiers)
    ? payload.tiers
        .filter((tier) => tier.price || tier.deliverables?.length || tier.delivery_days)
        .map(serializeTier)
    : [];

  return {
    creator_id: payload.creator_id,
    title: payload.title,
    description: payload.description,
    platform: payload.platform,
    category: payload.category,
    type: payload.type,
    pricing_type: payload.pricing_type,
    barter_details:
      payload.pricing_type === "BARTER" ? payload.barter_details : null,
    price: toNumber(payload.price),
    currency: payload.currency || "PKR",
    deliverables: (payload.deliverables || []).filter(Boolean).join(", "),
    delivery_days: toNumber(payload.delivery_days),
    duration_days: payload.duration_days ? toNumber(payload.duration_days) : null,
    revisions: toNumber(payload.revisions, 1),
    cover_image: payload.cover_image,
    media_urls: (payload.media_urls || []).filter(Boolean),
    tags: (payload.tags || []).filter(Boolean),
    is_active: payload.is_active ?? true,
    is_featured: payload.is_featured ?? false,
    tiers,
  };
};

export const getPackages = async (filters = {}) => {
  const response = await apiRequest({
    url: "/api/packages",
    method: "get",
    params: buildPackageFilters(filters),
  });

  return normalizePackageCollection(response);
};

export const getMyPackages = async () => {
  const response = await apiRequest({
    url: "/api/packages/my",
    method: "get",
  });

  return normalizePackageCollection(response);
};

export const getPackageById = async (packageId) => {
  const response = await apiRequest({
    url: `/api/packages/${packageId}`,
    method: "get",
  });

  return normalizePackage(response);
};

export const createPackage = async (payload) => {
  const response = await apiRequest({
    url: "/api/packages",
    method: "post",
    data: serializePackagePayload(payload),
  });

  return normalizePackage(response);
};

export const updatePackage = async (packageId, payload) => {
  const response = await apiRequest({
    url: `/api/packages/${packageId}`,
    method: "put",
    data: serializePackagePayload(payload),
  });

  return normalizePackage(response);
};

export const deletePackage = (packageId) =>
  apiRequest({
    url: `/api/packages/${packageId}`,
    method: "delete",
  });

