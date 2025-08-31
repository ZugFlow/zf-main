// IMPORTAZIONE SOLO ESM: NON USARE require() PER date-fns!
import { format } from "date-fns";

export type TimeFormat = "12" | "24";

/**
 * Formats a time string based on the specified format (12h or 24h)
 * @param timeString - Time in HH:mm format (e.g., "14:30")
 * @param timeFormat - "12" for 12-hour format with AM/PM, "24" for 24-hour format
 * @returns Formatted time string
 */
export function formatTimeString(timeString: string, timeFormat: TimeFormat): string {
  try {
    // Parse the time string (HH:mm) into a Date object
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    if (timeFormat === "12") {
      return format(date, "h:mm a"); // 12-hour format with AM/PM
    } else {
      return format(date, "HH:mm"); // 24-hour format
    }
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString; // Return original string if formatting fails
  }
}

/**
 * Formats a Date object based on the specified format (12h or 24h)
 * @param date - Date object to format
 * @param timeFormat - "12" for 12-hour format with AM/PM, "24" for 24-hour format
 * @returns Formatted time string
 */
export function formatTime(date: Date, timeFormat: TimeFormat): string {
  try {
    if (timeFormat === "12") {
      return format(date, "h:mm a"); // 12-hour format with AM/PM
    } else {
      return format(date, "HH:mm"); // 24-hour format
    }
  } catch (error) {
    console.error("Error formatting time:", error);
    return format(date, "HH:mm"); // Fallback to 24-hour format
  }
}
