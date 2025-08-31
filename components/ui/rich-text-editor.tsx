'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Palette,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const colorOptions = [
  { name: 'Default', value: '#000000' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

const highlightColors = [
  { name: 'Yellow', value: '#fef3c7' },
  { name: 'Green', value: '#dcfce7' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Purple', value: '#f3e8ff' },
  { name: 'Pink', value: '#fce7f3' },
  { name: 'Red', value: '#fee2e2' },
];

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Inizia a scrivere...', 
  className,
  readOnly = false 
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.color-picker-container')) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  if (!isMounted || !editor) {
    return (
      <div className={cn('border border-gray-200 rounded-md p-3 min-h-[120px] bg-gray-50', className)}>
        <div className="text-gray-500 text-sm">Caricamento editor...</div>
      </div>
    );
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  const setTextColor = (color: string) => {
    if (editor.isActive('textStyle')) {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setShowColorPicker(false);
  };

  const setHighlight = (color: string) => {
    if (editor.isActive('highlight')) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setShowHighlightPicker(false);
  };

  return (
    <div className={cn('border border-gray-200 rounded-md', className)}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          {/* Text formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-gray-200')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-gray-200')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-gray-200')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('strike') && 'bg-gray-200')}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Text alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-gray-200')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-gray-200')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-gray-200')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Text color */}
          <div className="relative color-picker-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-8 w-8 p-0"
            >
              <Palette className="h-4 w-4" />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
                <div className="grid grid-cols-3 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setTextColor(color.value)}
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="relative color-picker-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="h-8 w-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
                <div className="grid grid-cols-3 gap-1">
                  {highlightColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setHighlight(color.value)}
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Link */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-gray-200')}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            {showLinkInput && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 min-w-64">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Inserisci URL..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addLink();
                      }
                    }}
                  />
                  <Button size="sm" onClick={addLink}>
                    Aggiungi
                  </Button>
                  <Button size="sm" variant="outline" onClick={removeLink}>
                    Rimuovi
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-3 min-h-[120px]">
        <EditorContent 
          editor={editor} 
          className={cn(
            'prose prose-sm max-w-none focus:outline-none',
            readOnly && 'pointer-events-none'
          )}
        />
      </div>
    </div>
  );
} 