export const getOptimizedImageUrl = (url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
}): string => {
  if (!url) return url;

  const {
    width = 400,
    height = 400,
    quality = 80,
  } = options || {};

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('supabase')) {
      const pathParts = urlObj.pathname.split('/');
      const objectIndex = pathParts.indexOf('object');

      if (objectIndex !== -1 && pathParts[objectIndex + 1] === 'public') {
        const bucketName = pathParts[objectIndex + 2];
        const filePath = pathParts.slice(objectIndex + 3).join('/');

        const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
        const renderUrl = `${baseUrl}/storage/v1/render/image/public/${bucketName}/${filePath}`;

        const params = new URLSearchParams();
        params.append('width', width.toString());
        params.append('height', height.toString());
        params.append('quality', quality.toString());
        params.append('resize', 'cover');

        return `${renderUrl}?${params.toString()}`;
      }
    }

    return url;
  } catch {
    return url;
  }
};

export const getThumbnailUrl = (url: string): string => {
  return getOptimizedImageUrl(url, {
    width: 400,
    height: 400,
    quality: 80,
  });
};

export const getDetailImageUrl = (url: string): string => {
  return getOptimizedImageUrl(url, {
    width: 1200,
    height: 1200,
    quality: 85,
  });
};

export const getFullImageUrl = (url: string): string => {
  return getOptimizedImageUrl(url, {
    width: 2000,
    height: 2000,
    quality: 90,
  });
};
