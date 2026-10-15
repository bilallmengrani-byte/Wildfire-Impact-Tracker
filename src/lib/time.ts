/**
 * Utilities for formatting timestamps into the user's local timezone.
 * Complies with requirement: "Never show raw UTC strings. Always format readably in local time."
 */

/**
 * Parses satellite acquisition date (YYYY-MM-DD) and UTC acquisition time (e.g. "06:29 UTC", "1430", "629")
 * into a Date object representing the UTC acquisition moment.
 */
export function parseUtcDetectionTime(acqDate: string, acqTime: string): Date | null {
  if (!acqDate) return null;

  const dateParts = acqDate.trim().split('-').map(Number);
  if (dateParts.length !== 3 || dateParts.some(isNaN)) return null;
  const [year, month, day] = dateParts;

  // Extract digits from acqTime (e.g. "06:29 UTC" -> "0629", "1430" -> "1430", "629" -> "0629")
  const digits = (acqTime || '').replace(/[^0-9]/g, '');
  let hours = 0;
  let minutes = 0;

  if (digits.length >= 3) {
    const padded = digits.padStart(4, '0');
    hours = parseInt(padded.slice(0, 2), 10);
    minutes = parseInt(padded.slice(2, 4), 10);
  } else if (digits.length > 0) {
    hours = parseInt(digits, 10);
  }

  // Create Date using UTC coordinates
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  return isNaN(utcDate.getTime()) ? null : utcDate;
}

/**
 * Formats a detection time into a friendly local timezone string.
 * Example output: "Oct 9, 3:45 PM local time"
 */
export function formatDetectionToLocalTime(
  acqDate?: string,
  acqTime?: string,
  includeSuffix: boolean = true
): string {
  if (!acqDate) return 'Recent detection';

  const date = parseUtcDetectionTime(acqDate, acqTime || '');
  if (!date) return acqTime || 'Recent';

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const formatted = formatter.format(date);
  return includeSuffix ? `${formatted} local time` : formatted;
}

/**
 * Formats a short time for compact list items (e.g. "3:45 PM").
 */
export function formatDetectionToShortTime(acqDate?: string, acqTime?: string): string {
  if (!acqDate) return acqTime || 'Recent';

  const date = parseUtcDetectionTime(acqDate, acqTime || '');
  if (!date) return acqTime || 'Recent';

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats an ISO string (e.g. from NWS Weather "2026-10-09T11:35:00+00:00")
 * into a local timezone string: "Oct 9, 4:35 AM local time"
 */
export function formatIsoToLocalTime(isoString?: string): string {
  if (!isoString) return 'Recent';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return `${formatter.format(date)} local time`;
  } catch {
    return isoString;
  }
}

/**
 * Formats AirNow date/hour strings into local timezone: "Oct 9, 1:00 PM local time"
 */
export function formatAirNowToLocalTime(timestampStr?: string): string {
  if (!timestampStr) return 'Recent';

  try {
    // AirNow often passes: "YYYY-MM-DD at HH:00 TZ"
    const cleaned = timestampStr.replace(' at ', ' ');
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      const formatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${formatter.format(date)} local time`;
    }
  } catch {
    // fallback
  }

  return timestampStr;
}
