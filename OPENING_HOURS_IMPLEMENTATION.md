# Opening Hours Implementation for Booking System

## Overview

This implementation adds a comprehensive opening hours system to the salon booking platform, allowing salons to configure their working hours and automatically generating available booking slots based on these hours.

## Features

### 1. Opening Hours Management
- **Configurable working hours** for each day of the week
- **Break time support** with configurable lunch breaks
- **Quick templates** for common schedules (Standard, Extended, Weekend)
- **Visual interface** in the salon page builder

### 2. Smart Booking Slot Generation
- **Automatic slot generation** based on opening hours
- **Break time exclusion** - no bookings during lunch breaks
- **Conflict detection** - prevents double bookings
- **Service duration consideration** - slots respect service length

### 3. Integration with Booking Form
- **Available dates only** - shows only days when salon is open
- **Real-time slot updates** - refreshes when service or date changes
- **Opening hours display** - shows current hours to customers

## Implementation Details

### Core Utilities (`utils/openingHoursUtils.ts`)

#### Key Functions:

1. **`parseOpeningHours(openingHoursString)`**
   - Parses the stored opening hours string format
   - Converts to structured data for processing
   - Handles break times and closed days

2. **`generateAvailableSlots(date, openingHours, serviceDuration, slotInterval, existingBookings)`**
   - Generates available time slots for a specific date
   - Excludes break times and existing bookings
   - Respects service duration requirements

3. **`isWithinOpeningHours(date, time, duration, openingHours)`**
   - Validates if a booking request is within opening hours
   - Checks for break time conflicts
   - Ensures appointment fits within working hours

4. **`formatOpeningHoursForDisplay(hours)`**
   - Formats opening hours for display on the website
   - Includes break time information
   - Used in the salon page builder

### API Integration (`app/api/online-bookings/route.ts`)

#### GET Endpoint:
- Fetches opening hours from `salon_web_settings.web_map_opening_hours`
- Generates available slots based on opening hours
- Considers existing bookings and service duration
- Returns formatted slot data for the booking form

#### POST Endpoint:
- Validates booking requests against opening hours
- Checks for conflicts with existing bookings
- Ensures booking fits within working hours and break times

### Booking Form Integration (`app/salon/[subdomain]/booking/OnlineBookingForm.tsx`)

#### Key Features:
- **Available dates only** - filters calendar to show only open days
- **Opening hours display** - shows current hours to customers
- **Service-aware slots** - updates available times based on selected service
- **Real-time validation** - prevents invalid bookings

### Opening Hours Manager (`app/salon/[subdomain]/components/OpeningHoursManager.tsx`)

#### Features:
- **Visual day-by-day configuration**
- **Break time management**
- **Quick templates** for common schedules
- **Live preview** of formatted hours
- **Integration with salon page builder**

## Database Schema

### `salon_web_settings` Table
- **`web_map_opening_hours`** (TEXT) - Stores formatted opening hours string
- **`web_opening_hours_visible`** (BOOLEAN) - Controls visibility on website

### Opening Hours String Format
```
Lunedì: 09:00 - 18:00
  Pausa: 12:00 - 13:00
Martedì: 09:00 - 18:00
  Pausa: 12:00 - 13:00
Mercoledì: 09:00 - 18:00
  Pausa: 12:00 - 13:00
Giovedì: 09:00 - 18:00
  Pausa: 12:00 - 13:00
Venerdì: 09:00 - 18:00
  Pausa: 12:00 - 13:00
Sabato: 09:00 - 17:00
Domenica: Chiuso
```

## Usage Examples

### Setting Up Opening Hours

1. **Access the Salon Page Builder**
   - Navigate to the salon's web settings
   - Go to the "Orari di Apertura" section

2. **Configure Working Hours**
   - Set opening and closing times for each day
   - Configure lunch breaks if needed
   - Use quick templates for common schedules

3. **Save Configuration**
   - Opening hours are automatically saved to the database
   - Available booking slots are immediately updated

### Booking Flow

1. **Customer selects service** - form loads service details
2. **Date selection** - only shows days when salon is open
3. **Time selection** - shows available slots based on:
   - Opening hours
   - Break times
   - Existing bookings
   - Service duration
4. **Customer information** - final step before booking
5. **Validation** - system ensures booking is valid

## Benefits

### For Salon Owners
- **Flexible scheduling** - easy to configure complex schedules
- **Break time management** - automatic exclusion of lunch breaks
- **Conflict prevention** - no double bookings
- **Professional appearance** - clear opening hours on website

### For Customers
- **Clear availability** - see exactly when salon is open
- **Accurate booking** - no confusion about available times
- **Professional experience** - seamless booking process
- **Transparency** - know about break times upfront

## Technical Considerations

### Performance
- **Caching** - opening hours are cached after initial load
- **Efficient queries** - minimal database calls
- **Client-side validation** - reduces server load

### Scalability
- **Modular design** - easy to extend with new features
- **Reusable utilities** - functions can be used across the application
- **Type safety** - TypeScript interfaces ensure data consistency

### Error Handling
- **Graceful fallbacks** - defaults to standard hours if configuration is missing
- **Validation** - prevents invalid time configurations
- **User feedback** - clear error messages for invalid bookings

## Future Enhancements

### Potential Features
1. **Holiday management** - special hours for holidays
2. **Staff-specific hours** - different hours for different team members
3. **Seasonal schedules** - different hours for different seasons
4. **Emergency closures** - temporary closure notifications
5. **Multi-location support** - different hours for different locations

### Integration Opportunities
1. **Calendar sync** - integrate with external calendars
2. **Notification system** - alert customers about schedule changes
3. **Analytics** - track booking patterns and optimize hours
4. **Mobile app** - extend functionality to mobile applications

## Testing

### Manual Testing
1. Configure opening hours in the salon page builder
2. Test booking flow with different services and dates
3. Verify break times are properly excluded
4. Test conflict detection with existing bookings

### Automated Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for booking flow

## Conclusion

This opening hours implementation provides a robust, user-friendly system for managing salon schedules and generating accurate booking slots. The modular design ensures easy maintenance and future enhancements while providing immediate value to both salon owners and customers.
