'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { MDXEditor } from '@/components/editor/MDXEditor';

export default function EditArticle({ articleId }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: [],
    status: 'DRAFT',
  });
  const [tagInput, setTagInput] = useState('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  const sanitizeMarkdown = (content) => {
  if (!content) return '';
  return content.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
    return `\`\`\`${lang || ''}\n${code.trim()}\n\`\`\``;
  });
    };
    
  const fetchArticle = useCallback(async () => {
    if (!articleId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/articles/${articleId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      
        const data = await response.json();
        
        console.log(data);
      
      // Only allow the author to edit the article
      if (data?.data?.author?.id !== session?.user?.id) {
        router.push('/dashboard/articles');
        return;
      }

      setFormData({
        title: data?.data?.title,
        slug: data?.data?.slug,
        excerpt: data?.data?.excerpt || '',
        content: sanitizeMarkdown(data?.data?.content) || '',
        coverImage: data?.data?.coverImage || '',
        tags: data?.data?.tags?.map(tag => tag.name) || [],
        status: data?.data?.status || 'DRAFT',
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      setError('Failed to load article. Please try again.');
      // Optionally redirect to articles list after showing error
      setTimeout(() => router.push('/dashboard/articles'), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, session?.user?.id, router]);

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId, fetchArticle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from title if auto-generate is on
    if (name === 'title' && autoGenerateSlug) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/--+/g, '-')      // Replace multiple hyphens with single
        .trim();
      
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!articleId) {
      setError('Invalid article ID');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update article. Please try again.');
      }

      const data = await response.json();
      router.push(`/dashboard/articles`);
    } catch (error) {
      console.error('Error updating article:', error);
      setError(error.message || 'Failed to update article. Please try again.');
      // Auto-hide error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Edit Article
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-slug"
                checked={autoGenerateSlug}
                onChange={() => setAutoGenerateSlug(!autoGenerateSlug)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="auto-slug" className="text-sm font-medium text-gray-700">
                Auto-generate from title
              </Label>
            </div>
          </div>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="article-slug"
            disabled={autoGenerateSlug}
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
            placeholder="A short summary of your article"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 inline-flex text-indigo-400 hover:text-indigo-600 focus:outline-none"
                >
                  <span className="sr-only">Remove tag</span>
                  <Icons.x className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverImage">Cover Image URL (optional)</Label>
          <Input
            id="coverImage"
            name="coverImage"
            value={formData.coverImage}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            type="url"
          />
          {formData.coverImage && (
            <div className="mt-2">
              <img
                src={formData.coverImage}
                alt="Cover preview"
                className="h-40 w-full object-cover rounded-md"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <div className="border rounded-md overflow-hidden">
            <MDXEditor
              markdown={formData.content}
              onChange={handleContentChange}
              placeholder="Write your article content here..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                status: 'DRAFT'
              }));
            }}
            disabled={formData.status === 'DRAFT' || isSubmitting}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Article'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
