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

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const session = await auth();
  
  // Fetch the article with author and like count
  const article = await prisma.article.findUnique({
    where: { 
      slug,
      status: 'PUBLISHED'
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
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

  if (!article) {
    notFound();
  }

  // Format the published date
  const publishedDate = article.publishedAt 
    ? format(new Date(article.publishedAt), 'MMMM d, yyyy')
    : 'Draft';

  // Check if current user has liked the article
  const isLiked = article.likes?.length > 0;
  const likesCount = article._count.likes;

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-4xl py-8 px-4 sm:px-6 lg:px-8">

      {/* Article Header */}
      <header className="mb-12">
        <div className="space-y-2 mb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {article.title}
          </h1>
          <p className="text-xl text-muted-foreground mt-4">
            {article.excerpt || 'A comprehensive guide on this topic'}
          </p>
        </div>

        {/* Author and Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-8">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={article.author.image} alt={article.author.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {article.author.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{article.author.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <time dateTime={article.publishedAt?.toISOString()} className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{publishedDate}</span>
                </time>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{article.readingTime || '4'} min read</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareButton 
              title={article.title}
              url={`${process.env.NEXT_PUBLIC_APP_URL}/articles/${article.slug}`}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </ShareButton>
          </div>
        </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-10 rounded-xl overflow-hidden shadow-lg border border-border/50">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-auto max-h-[500px] object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Article Actions */}
          <div className="flex items-center justify-between py-4 border-b border-border/50 mb-8">
            <div className="flex items-center gap-4">
              <ArticleLikeButton 
                articleSlug={article.slug}
                initialLikesCount={likesCount}
                initialLiked={isLiked}
              />
              
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{article._count.comments} Comments</span>
              </Button>
            </div>
            
            <ShareButton 
              title={article.title}
              url={`${process.env.NEXT_PUBLIC_APP_URL}/articles/${article.slug}`}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </ShareButton>
          </div>
        </header>

        <div className="article-content">
          {/* Article Content */}
          <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline-offset-4 prose-a:transition-all prose-code:before:hidden prose-code:after:hidden prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted/20 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:overflow-hidden prose-img:rounded-xl prose-img:border prose-img:border-border/50">
            <Markdown content={article.content} />

            {/* Tags and Categories */}
            {(article.categories?.length > 0 || article.tags?.length > 0) && (
              <footer className="mt-16 pt-8 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {article.categories?.map((category) => (
                    <Badge 
                      key={category.id}
                      variant="secondary"
                      className="px-3 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      {category.name}
                    </Badge>
                  ))}
                  {article.tags?.map((tag) => (
                    <Badge 
                      key={tag.id}
                      variant="outline"
                      className="px-3 py-1.5 text-sm font-medium rounded-full hover:bg-muted/50 transition-colors"
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </div>

      {/* Comments Section */}
      <section className="mt-16">
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Discussion ({article._count.comments})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Join the conversation. Share your thoughts and questions below.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <CommentsSection articleSlug={article.slug} />
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Author Bio */}
      <section className="mt-16">
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={article.author.image} alt={article.author.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {article.author.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Written by {article.author.name}</h3>
                <p className="text-muted-foreground mt-1">
                  {article.author.bio || 'No bio available'}
                </p>
                <div className="mt-3 flex gap-3">
                  {/* Add social links here if available */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      </div>
    </div>
  );
}

// Generate static params for all published articles
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { 
      status: 'PUBLISHED'
    },
    select: { slug: true },
  });

  return articles.map((article) => ({
    slug: article.slug,
  }));
}
