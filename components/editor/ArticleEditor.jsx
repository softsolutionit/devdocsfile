'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

// Dynamically import the editor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

export default function ArticleEditor({ initialData = null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState('');
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '**Hello world!!!**',
    excerpt: initialData?.excerpt || '',
    status: initialData?.status || 'DRAFT',
  });

  useEffect(() => {
    if (initialData?.tags) {
      setTags(initialData.tags.map(tag => tag.name).join(', '));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      content: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const payload = {
        ...formData,
        tags: tagArray,
      };

      const url = initialData 
        ? `/api/articles/${initialData.slug}`
        : '/api/articles';
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to the article page or dashboard
      if (method === 'POST') {
        router.push(`/articles/${data.slug}`);
      } else {
        router.push(`/dashboard/articles`);
      }
    } catch (err) {
      console.error('Error saving article:', err);
      setError(err.message || 'Failed to save article');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {initialData ? 'Edit Article' : 'Write a New Article'}
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/articles')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                status: 'DRAFT',
              }));
              document.getElementById('save-button').click();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                status: 'PUBLISHED',
              }));
              document.getElementById('save-button').click();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.publish className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter article title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt (optional)</Label>
          <Textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="A brief summary of your article"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Content</Label>
            <span className="text-sm text-muted-foreground">
              Markdown supported
            </span>
          </div>
          <div className="border rounded-md overflow-hidden">
            <MDEditor
              value={formData.content}
              onChange={handleContentChange}
              height={500}
              preview="edit"
              visibleDragbar={false}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, javascript, nextjs"
          />
        </div>

        <button id="save-button" type="submit" className="hidden" />
      </form>
    </div>
  );
}
