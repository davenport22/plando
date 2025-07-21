import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO, differenceInCalendarDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the total duration of a trip in days, inclusive of start and end dates.
 * @param startDateStr - The start date in 'YYYY-MM-DD' format.
 * @param endDateStr - The end date in 'YYYY-MM-DD' format.
 * @returns A formatted string like "1 day" or "5 days", or an empty string if dates are invalid.
 */
export function calculateTripDuration(startDateStr: string, endDateStr: string): string {
  try {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);
    
    // Check if dates are valid after parsing
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ""; 
    }

    // Calculate the difference in calendar days and add 1 because the end date is inclusive
    const diffDays = differenceInCalendarDays(end, start) + 1;

    if (diffDays < 1) {
      // This case should ideally be prevented by form validation (end date >= start date)
      return ""; 
    }
    if (diffDays === 1) {
      return "1 day";
    }
    return `${diffDays} days`;
  } catch (error) {
    // Catch any other errors during parsing or calculation
    console.error("Error calculating trip duration:", error);
    return ""; // Fallback for any unexpected error
  }
}
