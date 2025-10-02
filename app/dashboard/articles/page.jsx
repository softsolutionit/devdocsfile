'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/articles?authorId=${session?.user?.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }
        const data = await response.json();
        setArticles(data.data || []);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(err.message || 'Failed to load articles');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchArticles();
    }
  }, [session?.user?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground">
            Manage your articles and create new content
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/articles/new">
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No articles yet. Create your first article!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-medium">{article.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[article.status] || 'bg-gray-100 text-gray-800'}`}>
                          {article.status.toLowerCase()}
                        </span>
                        <span>Created {format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
                        {article.updatedAt !== article.createdAt && (
                          <span>• Updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {article.tags.map(tag => (
                            <span key={tag.id} className="text-xs px-2 py-1 bg-secondary rounded-md">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/articles/edit/${article.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${article.authorUsername}/${article.slug}`} target="_blank">
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
