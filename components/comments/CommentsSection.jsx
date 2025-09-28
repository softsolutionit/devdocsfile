'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { CommentLikeButton } from './CommentLikeButton';

export default function CommentsSection({ articleSlug }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [likedComments, setLikedComments] = useState({}); // { commentId: boolean }

  const toggleReplies = useCallback((commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }, []);

  const fetchComments = useCallback(async (parentId = null) => {
    try {
      const url = `/api/articles/${articleSlug}/comments${
        parentId ? `?parentId=${parentId}` : ''
      }`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (parentId) {
          // Update replies for a specific comment
          setComments(prev => 
            prev.map(comment => 
              comment.id === parentId 
                ? { ...comment, replies: data } 
                : comment
            )
          );
        } else {
          // Set top-level comments
          setComments(data);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [articleSlug, toast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/articles/${articleSlug}`);
      return;
    }
    
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId: replyingTo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(replyingTo ? 'Reply posted' : 'Comment posted');
        setContent('');
        setReplyingTo(null);
        
        // Refresh comments
        if (replyingTo) {
          fetchComments(replyingTo);
        } else {
          fetchComments();
        }
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } finally {
      setSubmitting(false);
    }
  }, [articleSlug, content, fetchComments, replyingTo, router, session]);

  useEffect(() => {
    if (status === 'authenticated' && comments.length > 0) {
      const fetchLikedStatus = async () => {
        const statuses = await Promise.all(
          comments.map(comment => 
            fetch(`/api/comments/${comment.id}/liked`)
              .then(res => res.json())
              .then(data => ({
                commentId: comment.id,
                liked: data.liked || false
              }))
              .catch(() => ({
                commentId: comment.id,
                liked: false
              }))
          )
        );
        
        const newLikedComments = {};
        statuses.forEach(({ commentId, liked }) => {
          newLikedComments[commentId] = liked;
        });
        
        setLikedComments(prev => ({
          ...prev,
          ...newLikedComments
        }));
      };
      
      fetchLikedStatus();
    }
  }, [status, comments]);

  const handleLike = useCallback(async (commentId, isLiked) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/articles/${articleSlug}`);
      return;
    }
    
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });
      
      if (response.ok) {
        setLikedComments(prev => ({
          ...prev,
          [commentId]: !isLiked
        }));
        
        // Update the UI immediately for better UX
        setComments(prev => 
          prev.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likesCount: isLiked 
                  ? (comment.likesCount || 1) - 1 
                  : (comment.likesCount || 0) + 1,
              };
            }
            return comment;
          })
        );
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  }, [articleSlug, router, session]);

  const renderComment = (comment, depth = 0) => (
    <div 
      key={comment.id} 
      className={`mt-4 ${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}
    >
      <div className="flex space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.author.image} alt={comment.author.name} />
          <AvatarFallback>
            {comment.author.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          <div className="mt-2 flex space-x-4 text-xs">
            <button 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
            {comment._count?.replies > 0 && (
              <button 
                onClick={() => toggleReplies(comment.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showReplies[comment.id] ? 'Hide replies' : `View ${comment._count.replies} replies`}
              </button>
            )}
            <CommentLikeButton 
              commentId={comment.id} 
              initialLikesCount={comment.likesCount || 0}
              initialLiked={likedComments[comment.id] || false}
            />
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && (
            <form onSubmit={handleSubmit} className="mt-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="mb-2"
                required
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Reply
                </Button>
              </div>
            </form>
          )}

          {/* Nested replies */}
          {showReplies[comment.id] && comment.replies && (
            <div className="mt-3">
              {comment.replies.map(reply => 
                renderComment(reply, depth + 1)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h3 className="text-lg font-medium mb-6">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Comment form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user.image} alt={session.user.name} />
              <AvatarFallback>
                {session.user.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="mb-2"
                required
              />
              <div className="flex justify-end">
                <Button type="submit">Comment</Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-muted/50 rounded-md text-center">
          <p className="mb-2">
            <button 
              onClick={() => router.push('/auth/signin')}
              className="text-primary hover:underline"
            >
              Sign in
            </button>{' '}
            to leave a comment
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id}>
              {renderComment(comment)}
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
