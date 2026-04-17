import { http } from '@/services/http';

function extensionFromUri(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() || 'jpg';
}

function mimeTypeFromExtension(extension: string) {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  return map[extension] || 'image/jpeg';
}

export async function uploadImage(uri: string) {
  const extension = extensionFromUri(uri);
  const formData = new FormData();

  formData.append('file', {
    uri,
    name: `upload.${extension}`,
    type: mimeTypeFromExtension(extension),
  } as unknown as Blob);

  const { data } = await http.post<{ url: string }>('/api/uploads/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.url;
}
