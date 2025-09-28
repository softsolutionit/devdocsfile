'use client';

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';

// Import the editor with SSR disabled
const Editor = dynamic(
  () => import('./MDXEditorWithToolbar'),
  { 
    ssr: false,
    loading: () => (
      <div className="border rounded-md p-4 min-h-[400px] bg-muted/50 flex items-center justify-center">
        <p>Loading editor...</p>
      </div>
    )
  }
);

const MDXEditor = forwardRef((props, ref) => (
  <div className="border rounded-md overflow-hidden">
    <Editor
      {...props}
      ref={ref}
      contentEditableClassName="prose max-w-none dark:prose-invert p-4 min-h-[400px]"
    />
  </div>
));

MDXEditor.displayName = 'MDXEditor';

export { MDXEditor };