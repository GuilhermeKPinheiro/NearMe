function toDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(value?: string | null) {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 1) {
    return 'agora';
  }

  if (absMinutes < 60) {
    return diffMinutes < 0
      ? `há ${absMinutes} min`
      : `em ${absMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);

  if (absHours < 24) {
    return diffHours < 0
      ? `há ${absHours} h`
      : `em ${absHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  return diffDays < 0
    ? `há ${absDays} d`
    : `em ${absDays} d`;
}
