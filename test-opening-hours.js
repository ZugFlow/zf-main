// Simple test for opening hours functionality
const { parseOpeningHours, generateAvailableSlots, formatOpeningHoursForDisplay } = require('./utils/openingHoursUtils');

// Test opening hours string
const testOpeningHoursString = `Lunedì: 09:00 - 18:00
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
Domenica: Chiuso`;

console.log('Testing Opening Hours System...\n');

// Test parsing
console.log('1. Parsing opening hours:');
const parsedHours = parseOpeningHours(testOpeningHoursString);
console.log('Parsed hours:', JSON.stringify(parsedHours, null, 2));

// Test formatting
console.log('\n2. Formatting for display:');
const formatted = formatOpeningHoursForDisplay(parsedHours);
console.log('Formatted:', formatted);

// Test slot generation
console.log('\n3. Generating available slots for Monday:');
const mondaySlots = generateAvailableSlots('2024-01-01', parsedHours, 60, 30);
console.log('Available slots:', mondaySlots.slice(0, 5)); // Show first 5 slots

// Test Sunday (should be closed)
console.log('\n4. Testing Sunday (should be closed):');
const sundaySlots = generateAvailableSlots('2024-01-07', parsedHours, 60, 30);
console.log('Sunday slots:', sundaySlots);

console.log('\n✅ Opening hours system test completed!');
