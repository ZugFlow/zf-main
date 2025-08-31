const fs = require('fs');

// Read the database types file
const content = fs.readFileSync('types/database.types.ts', 'utf8');

// Fields to add
const missingFields = [
  'web_map_button_transparent?: boolean | null',
  'web_map_button_size?: string | null',
  'web_map_button_border_radius?: string | null',
  'web_map_button_text_color?: string | null',
  'web_map_button_border_color?: string | null',
  'web_map_button_border_width?: string | null',
  'web_opening_hours_button_text?: string | null',
  'web_opening_hours_button_action?: string | null',
  'web_opening_hours_button_color?: string | null',
  'web_opening_hours_button_text_color?: string | null',
  'web_opening_hours_button_border_color?: string | null',
  'web_opening_hours_button_border_width?: string | null'
];

// Add to Insert section
let updatedContent = content;
const insertPattern = /web_map_button_color\?\: string \| null/;
const insertReplacement = `web_map_button_color?: string | null
          ${missingFields.join('\n          ')}`;

updatedContent = updatedContent.replace(insertPattern, insertReplacement);

// Add to Update section
const updatePattern = /web_map_button_color\?\: string \| null/g;
const updateReplacement = `web_map_button_color?: string | null
          ${missingFields.join('\n          ')}`;

updatedContent = updatedContent.replace(updatePattern, updateReplacement);

// Write back to file
fs.writeFileSync('types/database.types.ts', updatedContent);

console.log('Database types updated successfully!');
