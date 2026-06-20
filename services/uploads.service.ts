import { apiClient } from '@/lib/api/client';

export type UploadKind =
  | 'avatar'
  | 'cover-image'
  | 'content-preview'
  | 'package-thumbnail'
  | 'deliverable'
  | 'brand-logo'
  | 'verification-document';

export interface UploadResponse {
  url: string;
}

interface UploadOptions {
  orderId?: string;
  deliverableId?: string;
  platform?: string;
}

const upload = async (kind: UploadKind, file: File, options: UploadOptions = {}): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  if (options.orderId) formData.append('orderId', options.orderId);
  if (options.deliverableId) formData.append('deliverableId', options.deliverableId);
  if (options.platform) formData.append('platform', options.platform);

  return apiClient.post<UploadResponse>(`/api/v1/uploads/${kind}`, formData);
};

export const uploadsService = {
  upload,

  avatar(file: File) {
    return upload('avatar', file);
  },

  coverImage(file: File) {
    return upload('cover-image', file);
  },

  contentPreview(file: File, platform?: string) {
    return upload('content-preview', file, { platform });
  },

  packageThumbnail(file: File) {
    return upload('package-thumbnail', file);
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
