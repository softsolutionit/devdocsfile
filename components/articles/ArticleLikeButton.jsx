'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, HeartOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'
import { useRouter } from 'next/navigation';

export function ArticleLikeButton({ articleSlug, initialLikesCount = 0, initialLiked = false }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  // Update state if initial props change
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikesCount(initialLikesCount);
  }, [initialLiked, initialLikesCount]);

  const handleLike = async () => {
    if (status === 'loading') return;
    
    if (!session) {
      // Redirect to sign in with a callback URL
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      toast({
        title: 'Sign in required',
        description: 'You need to be signed in to like articles',
        variant: 'default',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/articles/${articleSlug}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update like status');
      }

      const data = await response.json();
      
      // Update the UI optimistically
      if (isLiked) {
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        setLikesCount(prev => prev + 1);
      }
      
      setIsLiked(!isLiked);
      
    } catch (error) {
      console.error('Error updating like status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update like status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = isLiked ? HeartOff : Heart;
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLoading}
        className="p-2 h-auto text-muted-foreground hover:text-foreground hover:bg-transparent"
        aria-label={isLiked ? 'Unlike article' : 'Like article'}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Icon 
            className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-current' : ''}`} 
          />
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        {likesCount > 0 ? likesCount : 'Like'}
      </span>
    </div>
  );
}
