import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate percentage change between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Percentage change (positive for increase, negative for decrease)
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Format percentage change for display
 * @param percentage Percentage change value
 * @returns Formatted string with + or - prefix
 */
export function formatPercentageChange(percentage: number): string {
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

export const parseOptionalFloat = (
  value: string | undefined
): number | undefined => {
  if (!value) return undefined
  const parsed = parseFloat(value)
  return isNaN(parsed) ? undefined : parsed
}

// Parse deliveryDate as Argentina time (UTC-3) and compare with current time
// deliveryDate format: "YYYY-MM-DDTHH:mm:ss" (Argentina local time)
// We append the Argentina timezone offset (-03:00) to make it a proper ISO string
export const parseArgentinaTime = (dateStr: string): Date => {
  // Validate input format (basic check)
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error('Invalid date string provided')
  }

  // Check if timezone already exists in the string
  if (dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/)) {
    throw new Error('Date string should not include timezone information')
  }

  // Append Argentina timezone offset (UTC-3) to the date string
  const dateWithTimezone = `${dateStr}-03:00`

  // Parse and validate the resulting date
  const date = new Date(dateWithTimezone)
  if (!isValid(date)) {
    throw new Error(`Invalid date string: ${dateStr}`)
  }

  return date
}
