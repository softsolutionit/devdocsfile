'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Dynamically import the markdown viewer to avoid SSR issues
const MDViewer = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

export default function ArticleViewer({ article, showActions = true }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (session) {
      checkBookmarkStatus();
    }
  }, [session]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/articles/${article.slug}/bookmark`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleBookmark = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setIsBookmarking(true);
    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/articles/${article.slug}/bookmark`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/articles/edit/${article.slug}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/articles/${article.slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/articles');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAuthor = session?.user?.id === article.author.id;
  const canEdit = isAuthor || session?.user?.role === 'ADMIN';
  const canDelete = isAuthor || session?.user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose dark:prose-invert max-w-none">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{article.title}</h1>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={article.author.image} alt={article.author.name} />
                <AvatarFallback>
                  {article.author.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{article.author.name || 'Anonymous'}</span>
            </div>
            <span>•</span>
            <time dateTime={article.createdAt}>
              {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
            </time>
            <span>•</span>
            <span>{article.readingTime} min read</span>
          </div>

          {article.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {article.excerpt && (
            <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          <MDViewer source={article.content} />
        </div>

        <footer className="mt-12 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                disabled={isBookmarking}
              >
                {isBookmarking ? (
                  <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                ) : isBookmarked ? (
                  <Icons.bookmark className="h-4 w-4 mr-2 fill-current" />
                ) : (
                  <Icons.bookmark className="h-4 w-4 mr-2" />
                )}
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {article._count?.bookmarks || 0} bookmarks
              </span>
            </div>

            {showActions && (canEdit || canDelete) && (
              <div className="flex space-x-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={isDeleting}
                  >
                    <Icons.edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Icons.trash className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
