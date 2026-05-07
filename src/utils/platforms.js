export const SUPPORTED_PLATFORMS = ["YOUTUBE", "INSTAGRAM", "TIKTOK", "FACEBOOK"];

export const SUPPORTED_PLATFORM_META = {
  YOUTUBE: { label: "YouTube" },
  INSTAGRAM: { label: "Instagram" },
  TIKTOK: { label: "TikTok" },
  FACEBOOK: { label: "Facebook" },
};

export const FOOTER_SOCIAL_PLATFORMS = ["YOUTUBE", "INSTAGRAM", "TIKTOK", "FACEBOOK"];

const SUPPORTED_PLATFORM_SET = new Set(SUPPORTED_PLATFORMS);

export const normalizeSupportedPlatform = (platform, fallback = "INSTAGRAM") => {
  if (!platform) return fallback;

  const normalizedValue = platform.toString().trim().toUpperCase();
  return SUPPORTED_PLATFORM_SET.has(normalizedValue) ? normalizedValue : fallback;
};

export const formatSupportedPlatformLabel = (platform, fallback = "Instagram") => {
  const normalizedPlatform = normalizeSupportedPlatform(platform);
  return SUPPORTED_PLATFORM_META[normalizedPlatform]?.label || fallback;
};

