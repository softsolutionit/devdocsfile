// components/editor/MDXEditorWithToolbar.jsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  imagePlugin,
  linkPlugin,
  linkDialogPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  KitchenSinkToolbar
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { compressImage } from '@/utils/imageUtils';

const MDXEditorWithToolbar = ({ 
  markdown = '', 
  onChange,
  className = '',
  readOnly = false 
}) => {
  const { data: session } = useSession();
  const previousMarkdownRef = useRef(markdown);
  const processedMarkdownRef = useRef(markdown);

  // Extract all image URLs from markdown
  const extractImageUrls = (content) => {
    if (!content) return new Set();
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    const matches = [];
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return new Set(matches);
  };

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    try {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Compress the image to max 150KB
      const compressedFile = await compressImage(file);
      
      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, [session]);

  // Handle image deletion
  const handleImageDelete = useCallback(async (imageUrl) => {
    try {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/images/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete image:', error);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }, [session]);

  // Track markdown changes and handle deleted images
  useEffect(() => {
    const previousMarkdown = previousMarkdownRef.current;
    const currentMarkdown = markdown;
    
    if (previousMarkdown !== currentMarkdown) {
      const previousImages = extractImageUrls(previousMarkdown);
      const currentImages = extractImageUrls(currentMarkdown);
      
      // Find images that were in previous markdown but not in current
      const deletedImages = [...previousImages].filter(url => !currentImages.has(url));
      
      // Delete the removed images
      deletedImages.forEach(url => {
        if (url.startsWith('/articles/images/')) { // Only delete our own images
          handleImageDelete(url);
        }
      });
      
      previousMarkdownRef.current = currentMarkdown;
    }
  }, [markdown, handleImageDelete]);

  return (
    <div className={`mdx-editor-container ${className}`}>
      <MDXEditor
        markdown={markdown}
        onChange={onChange}
        readOnly={readOnly}
        plugins={[
          // Basic markdown features
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          
          // Tables
          tablePlugin(),
          
          // Media
          imagePlugin({
            imageUploadHandler: handleImageUpload,
            // Remove onImageDelete as it's not a valid prop
            imageAutocompleteSuggestions: []
          }),
          
          // Links
          linkPlugin(),
          linkDialogPlugin(),
          // Code blocks
          codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
          codeMirrorPlugin({
            codeBlockLanguages: { 
              js: 'JavaScript', 
              ts: 'TypeScript', 
              css: 'CSS', 
              html: 'HTML',
              python: 'Python',
              java: 'Java',
              cpp: 'C++',
              php: 'PHP',
              ruby: 'Ruby',
              go: 'Go',
              rust: 'Rust',
              sql: 'SQL',
              json: 'JSON',
              xml: 'XML',
              markdown: 'Markdown'
            }
          }),
          
          // Frontmatter
          frontmatterPlugin(),
          
          // Directives (like admonitions)
          directivesPlugin({
            directiveDescriptors: [AdmonitionDirectiveDescriptor]
          }),
          
          // Diff source (for viewing source vs rendered)
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: '' }),
          
          // Toolbar with all features
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-1 p-2 border-b">
                {/* Kitchen sink - includes everything */}
                <KitchenSinkToolbar />
              </div>
            )
          })
        ]}
        contentEditableClassName="prose max-w-none font-sans text-base p-4 focus:outline-none"
      />
    </div>
  );
};

export default MDXEditorWithToolbar;