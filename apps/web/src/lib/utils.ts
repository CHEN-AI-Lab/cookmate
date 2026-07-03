// Re-export shared utilities for backward compatibility with @/lib/utils imports
// All UI components import cn from here — keep this file so they don't need individual changes
export { cn, formatDuration, slugify, truncate, formatDate, DAYS_SHORT } from '@cookmate/shared/utils'