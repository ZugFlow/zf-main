export interface OpeningHours {
  day: string
  dayNumber: number
  isOpen: boolean
  startTime: string
  endTime: string
  isBreakTime: boolean
  breakStartTime: string
  breakEndTime: string
}

export interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export interface AvailableSlot {
  time_slot: string
  available_members: any[]
  total_available_members: number
}

export const DAYS_OF_WEEK = [
  { day: 'Lunedì', dayNumber: 1, short: 'LUN' },
  { day: 'Martedì', dayNumber: 2, short: 'MAR' },
  { day: 'Mercoledì', dayNumber: 3, short: 'MER' },
  { day: 'Giovedì', dayNumber: 4, short: 'GIO' },
  { day: 'Venerdì', dayNumber: 5, short: 'VEN' },
  { day: 'Sabato', dayNumber: 6, short: 'SAB' },
  { day: 'Domenica', dayNumber: 0, short: 'DOM' }
]

/**
 * Parse opening hours from the web_map_opening_hours string format
 */
export function parseOpeningHours(openingHoursString: string): OpeningHours[] {
  const defaultHours: OpeningHours[] = DAYS_OF_WEEK.map(day => ({
    day: day.day,
    dayNumber: day.dayNumber,
    isOpen: day.dayNumber !== 0, // Default: closed on Sunday
    startTime: '09:00',
    endTime: '18:00',
    isBreakTime: false,
    breakStartTime: '12:00',
    breakEndTime: '13:00'
  }))

  if (!openingHoursString || openingHoursString.trim() === '') {
    return defaultHours
  }

  const lines = openingHoursString.split('\n').filter(line => line.trim())
  const parsedHours: OpeningHours[] = []

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const dayName = line.substring(0, colonIndex).trim()
    const timeInfo = line.substring(colonIndex + 1).trim()

    // Find the day in our mapping
    const dayMapping = DAYS_OF_WEEK.find(d => 
      d.day.toLowerCase() === dayName.toLowerCase() ||
      d.day.toLowerCase().includes(dayName.toLowerCase()) ||
      dayName.toLowerCase().includes(d.day.toLowerCase())
    )

    if (!dayMapping) continue

    // Parse time information
    const timeMatch = timeInfo.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
    if (!timeMatch) continue

    const startTime = timeMatch[1]
    const endTime = timeMatch[2]

    // Check for break time
    const breakMatch = timeInfo.match(/Pausa:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
    const isBreakTime = !!breakMatch
    const breakStartTime = breakMatch ? breakMatch[1] : '12:00'
    const breakEndTime = breakMatch ? breakMatch[2] : '13:00'

    parsedHours.push({
      day: dayMapping.day,
      dayNumber: dayMapping.dayNumber,
      isOpen: true,
      startTime,
      endTime,
      isBreakTime,
      breakStartTime,
      breakEndTime
    })
  }

  // Merge with defaults for missing days
  return defaultHours.map(defaultDay => {
    const parsed = parsedHours.find(h => h.dayNumber === defaultDay.dayNumber)
    return parsed || { ...defaultDay, isOpen: false }
  })
}

/**
 * Generate available time slots for a specific date based on opening hours
 */
export function generateAvailableSlots(
  date: string,
  openingHours: OpeningHours[],
  serviceDuration: number = 60,
  slotInterval: number = 30,
  existingBookings: any[] = []
): TimeSlot[] {
  const dayOfWeek = new Date(date).getDay()
  const dayHours = openingHours.find(h => h.dayNumber === dayOfWeek)

  if (!dayHours || !dayHours.isOpen) {
    return []
  }

  const slots: TimeSlot[] = []
  const startTime = dayHours.startTime
  const endTime = dayHours.endTime

  // Convert times to minutes for easier calculation
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const breakStartMinutes = dayHours.isBreakTime ? timeToMinutes(dayHours.breakStartTime) : -1
  const breakEndMinutes = dayHours.isBreakTime ? timeToMinutes(dayHours.breakEndTime) : -1

  // Generate slots
  for (let time = startMinutes; time <= endMinutes - serviceDuration; time += slotInterval) {
    const slotTime = minutesToTime(time)
    const slotEndTime = minutesToTime(time + serviceDuration)

    // Check if slot overlaps with break time
    const overlapsBreak = dayHours.isBreakTime && 
      ((time < breakEndMinutes && time + serviceDuration > breakStartMinutes) ||
       (time >= breakStartMinutes && time < breakEndMinutes))

    // Check if slot conflicts with existing bookings
    const conflictsWithBooking = existingBookings.some(booking => {
      const bookingStart = timeToMinutes(booking.start_time || booking.requested_time)
      const bookingEnd = timeToMinutes(booking.end_time || calculateEndTime(booking.start_time || booking.requested_time, booking.service_duration || 60))
      
      return (time < bookingEnd && time + serviceDuration > bookingStart)
    })

    slots.push({
      time: slotTime,
      available: !overlapsBreak && !conflictsWithBooking,
      reason: overlapsBreak ? 'Pausa pranzo' : conflictsWithBooking ? 'Prenotato' : undefined
    })
  }

  return slots
}

/**
 * Convert time string (HH:MM) to minutes
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Calculate end time based on start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + durationMinutes
  return minutesToTime(endMinutes)
}

/**
 * Format opening hours for display
 */
export function formatOpeningHoursForDisplay(hours: OpeningHours[]): string {
  return hours
    .filter(hour => hour.isOpen)
    .map(hour => {
      let timeText = `${hour.startTime} - ${hour.endTime}`
      if (hour.isBreakTime) {
        timeText += `\n  Pausa: ${hour.breakStartTime} - ${hour.breakEndTime}`
      }
      return `${hour.day}: ${timeText}`
    })
    .join('\n')
}

/**
 * Check if a specific date and time is within opening hours
 */
export function isWithinOpeningHours(
  date: string,
  time: string,
  duration: number,
  openingHours: OpeningHours[]
): boolean {
  const dayOfWeek = new Date(date).getDay()
  const dayHours = openingHours.find(h => h.dayNumber === dayOfWeek)

  if (!dayHours || !dayHours.isOpen) {
    return false
  }

  const startMinutes = timeToMinutes(dayHours.startTime)
  const endMinutes = timeToMinutes(dayHours.endTime)
  const timeMinutes = timeToMinutes(time)
  const endTimeMinutes = timeToMinutes(calculateEndTime(time, duration))

  // Check if appointment fits within opening hours
  if (timeMinutes < startMinutes || endTimeMinutes > endMinutes) {
    return false
  }

  // Check if appointment overlaps with break time
  if (dayHours.isBreakTime) {
    const breakStartMinutes = timeToMinutes(dayHours.breakStartTime)
    const breakEndMinutes = timeToMinutes(dayHours.breakEndTime)

    if (timeMinutes < breakEndMinutes && endTimeMinutes > breakStartMinutes) {
      return false
    }
  }

  return true
}

/**
 * Get next available date based on opening hours
 */
export function getNextAvailableDate(openingHours: OpeningHours[], startDate: Date = new Date()): Date {
  const currentDate = new Date(startDate)
  
  for (let i = 0; i < 14; i++) { // Check next 14 days
    const checkDate = new Date(currentDate)
    checkDate.setDate(currentDate.getDate() + i)
    
    const dayOfWeek = checkDate.getDay()
    const dayHours = openingHours.find(h => h.dayNumber === dayOfWeek)
    
    if (dayHours && dayHours.isOpen) {
      return checkDate
    }
  }
  
  return currentDate // Fallback to current date
}

/**
 * Generate available slots for the booking form
 */
export function generateAvailableSlotsForBooking(
  date: string,
  openingHours: OpeningHours[],
  serviceDuration: number,
  existingBookings: any[] = []
): AvailableSlot[] {
  const timeSlots = generateAvailableSlots(date, openingHours, serviceDuration, 30, existingBookings)
  
  return timeSlots
    .filter(slot => slot.available)
    .map(slot => ({
      time_slot: slot.time,
      available_members: [], // This will be populated by the API
      total_available_members: 1 // Default to 1 available member
    }))
}
