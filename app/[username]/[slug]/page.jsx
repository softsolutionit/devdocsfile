import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { Markdown } from '@/components/markdown';
import CommentsSection from '@/components/comments/CommentsSection';
import { ArticleLikeButton } from '@/components/articles/ArticleLikeButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/share-button';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/auth';
import Link from 'next/link';

export default async function ArticlePage({ params }) {
  const { username, slug } = await params;
  const session = await auth();
  
  // Fetch the article with author and like count
  const article = await prisma.article.findFirst({
    where: { 
      slug,
      authorUsername: username,
      status: 'PUBLISHED'
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
        },
      },
      tags: true,
      _count: {
        select: {
          comments: {
            where: {
              isApproved: true,
              isSpam: false,
              parentId: null, // Only count top-level comments
            },
          },
          likes: true,
        },
      },
      // Check if current user has liked this article
      likes: session?.user?.id ? {
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      } : false,
    },
  });

  console.log(article);

  if (!article) {
    notFound();
  }

  // Increment view count
  await prisma.article.update({
    where: { id: article.id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });

  const readingTime = Math.ceil(article.content.split(/\s+/).length / 200); // 200 words per minute
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${username}/${slug}`;

  return (
    <div className="container max-w-4xl py-8">
      <article className="prose dark:prose-invert max-w-none">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <Link href={`/${article.author.username}`} className="flex items-center gap-2 hover:underline">
              <Avatar className="h-8 w-8">
                <AvatarImage src={article.author.image || ''} alt={article.author.name} />
                <AvatarFallback>
                  {article.author.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{article.author.name}</span>
            </Link>
            <span>•</span>
            <time dateTime={article.createdAt}>
              {format(new Date(article.createdAt), 'MMMM d, yyyy')}
            </time>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{article._count.comments} comments</span>
            </div>
          </div>

          {article.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <Markdown content={article.content} />
        </div>
        

        <div className="mt-12 pt-6 border-t">
          <div className="flex items-center justify-between">
            <ArticleLikeButton 
              articleId={article.id} 
              initialLikesCount={article._count.likes} 
              initialLiked={article.likes?.length > 0}
            />
            
            <div className="flex gap-2">
              <ShareButton url={shareUrl} title={article.title}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
              </ShareButton>
            </div>
          </div>
        </div>
      </article>

      <Separator className="my-12" />

      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Discussion ({article._count.comments})</h2>
        <CommentsSection articleId={article.id} />
      </div>
    </div>
  );
}

// Generate static params for all published articles
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
    },
    select: {
      slug: true,
      author: {
        select: {
          username: true,
        },
      },
    },
  });

  return articles.map((article) => ({
    username: article.author?.username || 'anonymous',
    slug: article.slug,
  }));
}

export const dynamicParams = true;
