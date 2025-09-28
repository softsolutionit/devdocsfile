// components/editor/MDXEditorWithToolbar.jsx
'use client';

import React from 'react';
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

const MDXEditorWithToolbar = ({ 
  markdown = '', 
  onChange,
  className = '',
  readOnly = false 
}) => {
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
            imageUploadHandler: async (image) => {
              // Implement your image upload logic here
              console.log('Uploading image:', image);
              return Promise.resolve('https://picsum.photos/200/300');
            },
            imageAutocompleteSuggestions: [
              'https://picsum.photos/200/300',
              'https://picsum.photos/200',
              'https://picsum.photos/300'
            ]
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