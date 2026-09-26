export const APPLICATION_TIME_ZONE = "America/New_York";

type DateValue = Date | number | string;

const mediumDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: APPLICATION_TIME_ZONE,
});

const numericDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: APPLICATION_TIME_ZONE,
});

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: APPLICATION_TIME_ZONE,
  timeZoneName: "short",
});

function toDate(value: DateValue) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDisplayDate(value: DateValue) {
  return mediumDateFormatter.format(toDate(value));
}

export function formatNumericDisplayDate(value: DateValue) {
  return numericDateFormatter.format(toDate(value));
}

export function formatDisplayTimestamp(value: DateValue) {
  return timestampFormatter.format(toDate(value));
}

export function formatDateInputValue(value: DateValue) {
  const parts = numericDateFormatter.formatToParts(toDate(value));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new RangeError("Unable to format date input value.");
  }

  return `${year}-${month}-${day}`;
}

export function formatIsoCalendarDate(value: string) {
  const calendarDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!calendarDate) {
    return formatDisplayDate(value);
  }

  const [, year, month, day] = calendarDate;

  // Noon UTC preserves a validated date-only value when rendered in Eastern Time.
  return formatDisplayDate(`${year}-${month}-${day}T12:00:00.000Z`);
}
