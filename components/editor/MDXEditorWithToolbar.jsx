// components/editor/MDXEditorWithToolbar.jsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  MDXEditor,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  tablePlugin,
  thematicBreakPlugin,
  quotePlugin,
  ListsToggle,
  InsertTable,
  CreateLink,
  InsertThematicBreak,
  BlockTypeSelect,
  UndoRedo,
  InsertCodeBlock,
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
          // Essential plugins for basic functionality
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          quotePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          
          // Code related plugins
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
              markdown: 'Markdown',
              bash: 'Bash',
              shell: 'Shell'
            }
          }),
          
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <CreateLink />
                <CodeToggle />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <ListsToggle />
                </DiffSourceToggleWrapper>
            )
          }),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: '' }),
          listsPlugin(),
          markdownShortcutPlugin(),
          
          
          
        ]}
        contentEditableClassName="prose max-w-none font-sans text-base dark:text-white dark:bg-gray-900 p-4 focus:outline-none"
      />
    </div>
  );
};

export default MDXEditorWithToolbar;