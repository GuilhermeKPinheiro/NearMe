type StoryMediaInput = {
  urls: string | null | undefined;
  publishedAt?: Date | string | null;
  fallbackUpdatedAt?: Date | string | null;
};

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

function resolveDate(value?: Date | string | null) {
  if (!value) {
    return null;
  }

  const next = value instanceof Date ? value : new Date(value);
  return Number.isNaN(next.getTime()) ? null : next;
}

export function getActiveStoryUrls({ urls, publishedAt, fallbackUpdatedAt }: StoryMediaInput) {
  const normalizedUrls = urls?.trim() ?? '';

  if (!normalizedUrls) {
    return '';
  }

  const effectivePublishedAt = resolveDate(publishedAt) ?? resolveDate(fallbackUpdatedAt);

  if (!effectivePublishedAt) {
    return '';
  }

  return Date.now() - effectivePublishedAt.getTime() <= STORY_TTL_MS ? normalizedUrls : '';
}

export function getActiveStoryPublishedAt({
  urls,
  publishedAt,
  fallbackUpdatedAt,
}: StoryMediaInput) {
  const activeUrls = getActiveStoryUrls({ urls, publishedAt, fallbackUpdatedAt });

  if (!activeUrls) {
    return null;
  }

  return resolveDate(publishedAt) ?? resolveDate(fallbackUpdatedAt);
}
