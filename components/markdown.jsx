'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Highlight, themes } from 'prism-react-renderer';
import { cn } from '@/lib/utils';

export function Markdown({ content, className }) {
  return (
    <div className={cn('prose dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        components={{
          // Handle code blocks
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          
          if (inline) {
            return (
              <code className={cn('bg-muted/50 px-1 py-0.5 rounded', className)} {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="relative my-4">
              <Highlight
                theme={themes.github}
                code={String(children).replace(/\n$/, '')}
                language={language || 'text'}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre 
                    className={cn(
                      className,
                      'rounded-lg p-4 text-sm overflow-x-auto',
                      'bg-muted/50 dark:bg-muted/20',
                      'font-mono',
                      language && 'language-marker'
                    )}
                    style={{
                      ...style,
                      margin: 0,
                      background: 'transparent',
                    }}
                  >
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          );
        },
        // Prevent paragraph wrapping around block elements
        p: ({ node, children }) => {
          // Check if the paragraph contains any block elements
          const hasBlockElements = node?.children?.some(
            child => child.type === 'element' && 
                    ['div', 'pre', 'ul', 'ol', 'table', 'blockquote'].includes(child.tagName?.toLowerCase())
          );
          
          if (hasBlockElements) {
            return <>{children}</>;
          }
          
          return <div className="my-4">{children}</div>;
        },
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {props.children}
            </a>
        ),
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>
            {props.children}
          </h1>
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-bold mt-8 mb-3" {...props}>
            {props.children}
          </h2>
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-bold mt-6 mb-2" {...props}>
            {props.children}
          </h3>
        ),
        ul: ({ node, ordered, ...props }) => (
          <ul className="list-disc pl-6 my-4 space-y-2" {...props}>
            {props.children}
          </ul>
        ),
        ol: ({ node, ordered, ...props }) => (
          <ol className="list-decimal pl-6 my-4 space-y-2" {...props}>
            {props.children}
          </ol>
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-muted-foreground/20 pl-4 italic my-4 text-muted-foreground"
            {...props}
          >
            {props.children}
          </blockquote>
        ),
        img: ({ node, ...props }) => (
          <div className="my-6 rounded-lg overflow-hidden">
            <img
              {...props}
              className="w-full h-auto object-cover"
              alt={props.alt || 'Image'}
            />
            {props.alt && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {props.alt}
              </p>
            )}
          </div>
        ),
        table: ({ node, ...props }) => (
          <div className="my-6 overflow-x-auto">
            <table className="w-full border-collapse" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th
            className="border border-border bg-muted/50 p-2 text-left font-semibold"
            {...props}
          >
            {props.children}
          </th>
        ),
        td: ({ node, ...props }) => (
          <td className="border border-border p-2" {...props}>
            {props.children}
          </td>
        ),
        // Add a custom component for code blocks to prevent hydration issues
        pre: ({ node, ...props }) => (
          <div className="my-4">
            <pre {...props} className="rounded-lg p-4 bg-muted/20 overflow-x-auto" />
          </div>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
