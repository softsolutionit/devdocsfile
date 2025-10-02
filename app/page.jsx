import Link from 'next/link';
import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Opt out of static generation for this page
export const dynamic = 'force-dynamic';

// Revalidate the page every 60 seconds
export const revalidate = 60;

async function getFeaturedArticles() {
  try {
    return await prisma.article.findMany({
    where: { 
      status: 'PUBLISHED'
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      tags: {
        include: {
          tag: true
        }
      },
      _count: {
        select: {
          comments: {
            where: {
              isApproved: true,
              isSpam: false
            }
          },
          likes: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 6,
    });
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    return [];
  }
}

export default async function Home() {
  let session = null;
  let featuredArticles = [];
  
  try {
    // Fetch session and articles in parallel
    [session, featuredArticles] = await Promise.all([
      getServerAuthSession(),
      getFeaturedArticles()
    ]);
  } catch (error) {
    console.error('Error in Home page:', error);
    // Continue rendering with empty data
  }

  return (
    <div className='px-2 md:px-10'>
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to <span className="text-primary">DevDocs</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          A community-driven platform for _developers_ to share knowledge, tutorials, and insights.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/articles">Browse Articles</Link>
          </Button>
          {!session ? (
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          ) : (
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Latest Articles</h2>
          <Button variant="ghost" asChild>
            <Link href="/articles">View All</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredArticles.map((article) => (
            <Card key={article.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
              {article.coverImage && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={article.author.image} alt={article.author.name} />
                    <AvatarFallback>{article.author.name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {article.author.name}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <time 
                    dateTime={article.publishedAt?.toISOString()} 
                    className="text-sm text-muted-foreground"
                  >
                    {format(new Date(article.publishedAt || article.createdAt), 'MMM d, yyyy')}
                  </time>
                </div>
                <CardTitle className="text-xl">
                  <Link href={`/articles/${article.slug}`} className="hover:underline">
                    {article.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {article.excerpt || ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {article.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {article.tags.slice(0, 2).map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {article.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{article.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{article.readingTime || '5'} min read</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    {article._count.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                    </svg>
                    {article._count.comments}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Tags Section */}
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8">Popular Tags</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Web Development', count: 24, slug: 'web-development' },
            { name: 'Mobile', count: 18, slug: 'mobile' },
            { name: 'DevOps', count: 15, slug: 'devops' },
            { name: 'Data Science', count: 21, slug: 'data-science' },
            { name: 'AI/ML', count: 14, slug: 'ai-ml' },
            { name: 'Security', count: 12, slug: 'security' },
            { name: 'Blockchain', count: 9, slug: 'blockchain' },
            { name: 'Design', count: 17, slug: 'design' },
          ].map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="p-6 border rounded-lg hover:bg-muted/50 transition-colors flex justify-between items-center"
            >
              <span className="font-medium">{tag.name}</span>
              <Badge className="text-xs font-medium bg-teal-300 text-teal-800  dark:bg-muted dark:text-muted-foreground">
                {tag.count}
              </Badge>
              
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
