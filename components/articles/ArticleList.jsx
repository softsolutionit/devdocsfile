'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icons } from '@/components/icons';

export default function ArticleList({ initialArticles, total, totalPages: initialTotalPages }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page);
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    
    router.push(`?${params.toString()}`, { scroll: false });
    
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/articles?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.data);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [page, status, search, router]);

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="w-full sm:w-96">
          <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          
          <Button asChild>
            <Link href="/dashboard/articles/new">
              <Icons.plus className="mr-2 h-4 w-4" />
              New Article
            </Link>
          </Button>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <Icons.fileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No articles found</h3>
          <p className="mt-1 text-muted-foreground">
            {status || search ? 'Try changing your filters' : 'Get started by creating a new article'}
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/dashboard/articles/new">
                <Icons.plus className="mr-2 h-4 w-4" />
                New Article
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div 
              key={article.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">
                    <Link href={`/articles/${article.slug}`} className="hover:underline">
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt || 'No excerpt available'}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mt-2 space-x-4">
                    <span>{article.author.name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <span>{article.viewCount} views</span>
                    <span>•</span>
                    <span>{article._count.comments} comments</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{article.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    article.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : article.status === 'DRAFT'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {article.status}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/articles/edit/${article.slug}`}>
                      <Icons.edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <Icons.chevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
            <Icons.chevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
