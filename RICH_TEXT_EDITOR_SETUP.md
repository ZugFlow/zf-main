# Rich Text Editor Setup for Task Manager

## Overview

The Task Manager now includes a Notion-like rich text editor for task notes, allowing users to format text with colors, highlighting, alignment, and other formatting options.

## Features

### Rich Text Editor Features
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Text Alignment**: Left, center, right alignment
- **Text Colors**: 9 different color options (red, orange, yellow, green, blue, purple, pink, gray, default)
- **Text Highlighting**: 6 highlight colors (yellow, green, blue, purple, pink, red)
- **Links**: Add and remove hyperlinks
- **Real-time Preview**: See formatting changes immediately

### Database Changes
- Added `note_richtext` field to the `orders` table
- Stores HTML content for rich text formatting
- Maintains backward compatibility with existing `note` field

## Components

### RichTextEditor
- **Location**: `components/ui/rich-text-editor.tsx`
- **Purpose**: Editable rich text component with formatting toolbar
- **Props**:
  - `value`: HTML content string
  - `onChange`: Callback function for content changes
  - `placeholder`: Placeholder text
  - `className`: Additional CSS classes
  - `readOnly`: Boolean for read-only mode

### RichTextViewer
- **Location**: `components/ui/rich-text-viewer.tsx`
- **Purpose**: Display-only component for formatted content
- **Props**:
  - `content`: HTML content string
  - `className`: Additional CSS classes

## Usage

### In Task Creation/Editing
```tsx
import { RichTextEditor } from '@/components/ui/rich-text-editor';

// In form component
<RichTextEditor
  value={formData.note_richtext}
  onChange={(value) => setFormData(prev => ({ ...prev, note_richtext: value }))}
  placeholder="Inizia a scrivere con formattazione..."
/>
```

### In Task Display
```tsx
import { RichTextViewer } from '@/components/ui/rich-text-viewer';

// In task card
<RichTextViewer 
  content={task.note_richtext} 
  className="text-sm text-gray-600 line-clamp-3"
/>
```

## Database Migration

Run the following SQL to add the `note_richtext` field:

```sql
-- Add note_richtext column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'note_richtext'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN note_richtext text;
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN public.orders.note_richtext IS 'Rich text content for notes with formatting (HTML)';
```

## Dependencies

### Required Packages
- `@tiptap/react`: Core rich text editor
- `@tiptap/pm`: ProseMirror integration
- `@tiptap/starter-kit`: Basic formatting features
- `@tiptap/extension-highlight`: Text highlighting
- `@tiptap/extension-text-style`: Text styling
- `@tiptap/extension-color`: Text colors
- `@tiptap/extension-underline`: Underline formatting
- `@tiptap/extension-text-align`: Text alignment
- `@tiptap/extension-link`: Link functionality
- `@tailwindcss/typography`: Typography styles

### Installation
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-highlight @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-link @tailwindcss/typography
```

## Styling

The rich text editor uses custom CSS classes defined in `app/globals.css`:

- `.ProseMirror`: Main editor container
- `.ProseMirror p.is-editor-empty`: Placeholder styling
- `.ProseMirror h1, h2, h3`: Heading styles
- `.ProseMirror blockquote`: Quote styling
- `.ProseMirror code, pre`: Code block styling
- `.ProseMirror mark`: Highlight styling
- `.ProseMirror a`: Link styling
- Color classes: `.text-red`, `.text-blue`, etc.
- Highlight classes: `.highlight-yellow`, `.highlight-green`, etc.

## Security

- HTML content is sanitized by TipTap
- Links are configured to not open automatically on click
- Content is stored as HTML in the database
- Display uses `dangerouslySetInnerHTML` with proper sanitization

## Performance

- Rich text content is loaded lazily
- Editor only initializes when needed
- Content is cached and optimized for display
- Search includes both `note` and `note_richtext` fields

## Future Enhancements

- Image upload support
- Tables and lists
- Code syntax highlighting
- Collaborative editing
- Version history
- Export to PDF/Markdown 