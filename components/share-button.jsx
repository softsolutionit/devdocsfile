'use client';

import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ShareButton({ 
  title, 
  url, 
  variant = 'outline', 
  size = 'default',
  className = '',
  children,
  asChild = false
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Don't render a Button if we're already inside one (prevent nesting)
  if (asChild) {
    return (
      <div 
        onClick={handleShare}
        className={cn('inline-flex items-center justify-center', className)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleShare();
          }
        }}
      >
        {isCopied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            {!children && <Share2 className="h-4 w-4 mr-2" />}
            {children || 'Share'}
          </>
        )}
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn('relative overflow-hidden', className)}
      aria-label="Share this article"
    >
      {isCopied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          {!children && <Share2 className="h-4 w-4 mr-2" />}
          {children || 'Share'}
        </>
      )}
    </Button>
  );
}
