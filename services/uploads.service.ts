import { apiClient } from '@/lib/api/client';

export type UploadKind =
  | 'avatar'
  | 'cover-image'
  | 'content-preview'
  | 'package-thumbnail'
  | 'campaign-cover'
  | 'message-attachment'
  | 'deliverable'
  | 'brand-logo'
  | 'verification-document';

export interface UploadResponse {
  mediaId?: string;
  url: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  publicId?: string;
  resourceType?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
}

interface UploadOptions {
  orderId?: string;
  deliverableId?: string;
  platform?: string;
  packageId?: string;
  campaignId?: string;
}

export interface UploadRule {
  maxMb: number;
  allowedTypes: string[];
  resourceType: string;
}

export interface UploadLimits {
  userStorageLimitMb: number;
  packageStorageLimitMb: number;
  campaignStorageLimitMb: number;
  userUploadCountLimit: number;
  packageUploadCountLimit: number;
  campaignUploadCountLimit: number;
  uploads: Record<UploadKind, UploadRule>;
}

const fallbackLimits: UploadLimits = {
  userStorageLimitMb: 2048,
  packageStorageLimitMb: 250,
  campaignStorageLimitMb: 250,
  userUploadCountLimit: 1000,
  packageUploadCountLimit: 50,
  campaignUploadCountLimit: 50,
  uploads: {
    avatar: { maxMb: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], resourceType: 'image' },
    'cover-image': { maxMb: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], resourceType: 'image' },
    'content-preview': { maxMb: 100, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'], resourceType: 'auto' },
    'package-thumbnail': { maxMb: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], resourceType: 'image' },
    'campaign-cover': { maxMb: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], resourceType: 'image' },
    'message-attachment': { maxMb: 100, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'application/zip'], resourceType: 'auto' },
    deliverable: { maxMb: 500, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'application/zip'], resourceType: 'auto' },
    'brand-logo': { maxMb: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], resourceType: 'image' },
    'verification-document': { maxMb: 25, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], resourceType: 'auto' },
  },
};

let limitsPromise: Promise<UploadLimits> | null = null;

const getLimits = async (): Promise<UploadLimits> => {
  if (!limitsPromise) {
    limitsPromise = apiClient.get<UploadLimits>('/api/v1/uploads/limits')
      .catch(() => fallbackLimits);
  }
  return limitsPromise;
};

const formatAllowedTypes = (types: string[]) => types.map((type) => type.split('/')[1]?.toUpperCase() || type).join(', ');

const validateFile = async (kind: UploadKind, file: File) => {
  const limits = await getLimits();
  const rule = limits.uploads[kind] || fallbackLimits.uploads[kind];
  const maxBytes = rule.maxMb * 1024 * 1024;

  if (!rule.allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type. Use ${formatAllowedTypes(rule.allowedTypes)}.`);
  }
  if (file.size > maxBytes) {
    throw new Error(`File is too large. Maximum size is ${rule.maxMb} MB.`);
  }
};

const upload = async (kind: UploadKind, file: File, options: UploadOptions = {}): Promise<UploadResponse> => {
  await validateFile(kind, file);

  const formData = new FormData();
  formData.append('file', file);

  if (options.orderId) formData.append('orderId', options.orderId);
  if (options.deliverableId) formData.append('deliverableId', options.deliverableId);
  if (options.platform) formData.append('platform', options.platform);
  if (options.packageId) formData.append('packageId', options.packageId);
  if (options.campaignId) formData.append('campaignId', options.campaignId);

  return apiClient.post<UploadResponse>(`/api/v1/uploads/${kind}`, formData);
};

export const uploadsService = {
  upload,
  getLimits,
  validateFile,

  avatar(file: File) {
    return upload('avatar', file);
  },

  coverImage(file: File) {
    return upload('cover-image', file);
  },

  contentPreview(file: File, platform?: string, packageId?: string) {
    return upload('content-preview', file, { platform, packageId });
  },

  packageThumbnail(file: File, packageId?: string) {
    return upload('package-thumbnail', file, { packageId });
  },

  campaignCover(file: File, campaignId?: string) {
    return upload('campaign-cover', file, { campaignId });
  },

  deliverable(file: File, orderId?: string, deliverableId?: string) {
    return upload('deliverable', file, { orderId, deliverableId });
  },

  brandLogo(file: File) {
    return upload('brand-logo', file);
  },

  verificationDocument(file: File) {
    return upload('verification-document', file);
  },
};
