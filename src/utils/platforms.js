export const SUPPORTED_PLATFORMS = ["YOUTUBE", "INSTAGRAM", "TIKTOK", "FACEBOOK"];

const SUPPORTED_PLATFORM_SET = new Set(SUPPORTED_PLATFORMS);

export const normalizeSupportedPlatform = (platform, fallback = "INSTAGRAM") => {
  if (!platform) return fallback;

  const normalizedValue = platform.toString().trim().toUpperCase();
  return SUPPORTED_PLATFORM_SET.has(normalizedValue) ? normalizedValue : fallback;
};

