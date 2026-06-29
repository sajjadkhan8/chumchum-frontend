import { apiClient } from '@/lib/api/client';

export const isProtectedFileUrl = (url: string) => url.startsWith('/api/v1/files/');

export const downloadFile = async (url: string, fallbackName = 'download') => {
  if (!isProtectedFileUrl(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  const { blob, filename } = await apiClient.download(url);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename || fallbackName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};
