// Dates are stored as YYYY-MM-DD (or "YYYY-MM-DD HH:MM:SS" in UTC for timestamps).
// Formatting in UTC keeps a birth date from shifting a day in western time zones.

const parse = (value) => {
  if (!value) return null;
  const iso = value.length === 10 ? `${value}T00:00:00Z` : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDate(value, locale = 'en-GB') {
  const date = parse(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  );
}

export function ageFrom(dateOfBirth, today = new Date()) {
  const dob = parse(dateOfBirth);
  if (!dob) return null;
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

export const todayIso = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/** Converts Arabic-Indic digits typed on Arabic keyboards to 0-9. */
export const normalizeDigits = (value) =>
  String(value ?? '').replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));

/** "240 KB", "1.2 MB" (localised, e.g. Arabic digits and units in ar-EG). */
export function formatSize(bytes, locale = 'en-GB') {
  const mb = bytes / (1024 * 1024);
  const [value, unit] = mb >= 1 ? [mb, 'megabyte'] : [Math.max(bytes / 1024, 1), 'kilobyte'];
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: unit === 'megabyte' ? 1 : 0,
  }).format(value);
}
