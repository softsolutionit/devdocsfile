import Link from 'next/link';

import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, Clock, Calendar, Tag, Filter } from 'lucide-react';
import { readTime } from '@/utils/readTime';

export default async function ArticlesPage({ searchParams: searchParamsPromise }) {
  // const session = await getServerSession(authOptions);
  
  // Await searchParams as it's a Promise in Next.js 15+
  const searchParams = await searchParamsPromise;
  
  // Parse query parameters
  const page = parseInt(searchParams?.page) || 1;
  const search = searchParams?.search || '';
  const category = searchParams?.category || '';
  const tag = searchParams?.tag || '';
  const sort = searchParams?.sort || 'newest';
  
  const itemsPerPage = 9;
  const skip = (page - 1) * itemsPerPage;
  
  // Build the where clause
  const where = {
    status: 'PUBLISHED'
  };
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (category) {
    where.tags = {
      some: {
        tag: {
          slug: category
        }
      }
    };
  }
  
  if (tag) {
    where.tags = {
      some: {
        tag: {
          slug: tag
        }
      }
    };
  }
  
  // Build the orderBy
  const orderBy = [];
  switch (sort) {
    case 'newest':
      orderBy.push({ createdAt: 'desc' });
      break;
    case 'oldest':
      orderBy.push({ createdAt: 'asc' });
      break;
    case 'most-liked':
      orderBy.push({ likes: { _count: 'desc' } });
      break;
    case 'most-commented':
      orderBy.push({ comments: { _count: 'desc' } });
      break;
    default:
      orderBy.push({ createdAt: 'desc' });
  }
  
  // Fetch articles with pagination
  const [articles, totalArticles] = await Promise.all([
    prisma.article.findMany({
      where,
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
                isSpam: false,
              },
            },
            likes: true,
          },
        },
      },
      orderBy,
      skip,
      take: itemsPerPage,
    }),
    prisma.article.count({ 
      where: {
        status: 'PUBLISHED',
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ]
        })
      }
    }),
  ]);
  
  // Fetch tags for filters
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  });
  
  const totalPages = Math.ceil(totalArticles / itemsPerPage);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  
  return (
    <div className="container py-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-primary/5 to-muted/20 rounded-2xl mb-12">
        <h1 className="text-4xl font-bold mb-4">Articles & Tutorials</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our collection of articles, tutorials, and guides on various development topics.
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-10"
              defaultValue={search}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={category}
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.slug}>
                  {tag.name}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={sort}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most-liked">Most Liked</option>
              <option value="most-commented">Most Commented</option>
            </select>
            <Button type="submit" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
        
        {tag && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtered by tag:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {tag}
            </span>
            <Link 
              href="/articles" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Clear filter
            </Link>
          </div>
        )}
      </div>
      
      {/* Articles Grid */}
      {articles.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
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
                    <Link href={`/${article.authorUsername}/${article.slug}`} className="hover:underline">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {article.excerpt || ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {article.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {article.categories.slice(0, 2).map((category) => (
                        <Link
                          key={category.id}
                          href={`/${article.authorUsername}/articles?category=${category.slug}`}
                          className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{readTime(article.content) || '15'} min read</span>
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {hasPreviousPage && (
                <Button variant="outline" asChild>
                  <Link href={`/articles?page=${page - 1}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}&sort=${sort}`}>
                    Previous
                  </Link>
                </Button>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show first page, last page, and pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    asChild
                  >
                    <Link 
                      href={`/articles?page=${pageNum}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}&sort=${sort}`}
                    >
                      {pageNum}
                    </Link>
                  </Button>
                );
              })}
              
              {hasNextPage && (
                <Button variant="outline" asChild>
                  <Link href={`/articles?page=${page + 1}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}&sort=${sort}`}>
                    Next
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No articles found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find any articles matching your criteria. Try adjusting your search or filter.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/articles">Clear filters</Link>
          </Button>
        </div>
      )}
      
      {/* Popular Tags */}
      {tags.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Popular Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 20).map((t) => (
              <Link
                key={t.id}
                href={`/articles?tag=${t.slug}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
