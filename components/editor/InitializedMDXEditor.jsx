'use client';

import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  thematicBreakPlugin, 
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ConditionalContents,
  InsertCodeBlock,
  ChangeCodeMirrorLanguage,
  ShowSandpackInfo,
  linkPlugin,
  CreateLink
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css'
import { forwardRef } from 'react';

const Editor = forwardRef((props, ref) => (
  <MDXEditor
    plugins={[
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      markdownShortcutPlugin(),
      linkPlugin(),
      toolbarPlugin({
        toolbarClassName: 'bg-gray-50 dark:bg-gray-800',
        toolbarButtonClassName: 'hover:bg-gray-100 dark:hover:bg-gray-700',
        toolbarButtonActiveClassName: 'bg-gray-100 dark:bg-gray-700',
        toolbarButtonDisabledClassName: 'opacity-50 cursor-not-allowed',
        toolbarButtonHoverClassName: 'bg-gray-100 dark:bg-gray-700',
        toolbarButtonActiveHoverClassName: 'bg-gray-100 dark:bg-gray-700',
        toolbarButtonActiveDisabledClassName: 'opacity-50 cursor-not-allowed',
        toolbarContents: () => (
          <>
          <UndoRedo />
            <BoldItalicUnderlineToggles />
            <CreateLink />
            
            <ConditionalContents
              options={[
                { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
                { when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo /> },
                {
                  fallback: () => (
                    <>
                      <InsertCodeBlock />
                    </>
                  )
                }
              ]}
            
            />
          </>
        )
      }),
    ]}
    {...props}
    ref={ref}
  />
));

Editor.displayName = 'Editor';

export default Editor;
