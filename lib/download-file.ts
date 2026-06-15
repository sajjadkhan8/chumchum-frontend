import { apiClient } from '@/lib/api/client';

export const downloadFile = async (url: string, fallbackName = 'download') => {
  if (!url.startsWith('/api/v1/files/')) {
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
