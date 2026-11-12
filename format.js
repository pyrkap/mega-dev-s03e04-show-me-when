// No timeZone override: use the viewer's browser zone and locale.
export function formatLocalTime(value, locales = undefined, options = {}) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(locales, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short', ...options,
  }).format(date);
}

export function newestFirst(incidents) {
  return [...incidents].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
}
