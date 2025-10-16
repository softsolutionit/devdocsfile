'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Image as ImageIcon, X, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { uploadFile, validateFile } from '@/lib/file-upload';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebounce } from 'use-debounce';
import dynamic from 'next/dynamic';
import { sanitizeMarkdown } from '@/utils/senitizeContent';

// Dynamically import MDXEditor with SSR disabled
const MDXEditor = dynamic(
  () => import('@/components/editor/MDXEditor').then((mod) => mod.MDXEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-md p-4 min-h-[400px] bg-muted/50 flex flex-col items-center justify-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    )
  }
);

// Helper function to generate slug from title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
};



export default function EditArticle({ articleId }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'DRAFT',
    tags: [],
    isFeatured: false,
    metaTitle: '',
    metaDescription: ''
  });
  const [tagInput, setTagInput] = useState('');

  const [coverImage, setCoverImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [existingCoverImage, setExistingCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [slugError, setSlugError] = useState('');
  const [debouncedSlug] = useDebounce(formData.slug, 500);
  const [isLoading, setIsLoading] = useState(true);
  const [articleNotFound, setArticleNotFound] = useState(false);
  const fileInputRef = useRef(null);
  const titleRef = useRef(null);

  // Memoize the slugify function
  const memoizedSlugify = useCallback((text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  // Fetch existing article data
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/articles/${articleId}`);

        if (response.status === 404) {
          setArticleNotFound(true);
          toast.error('Article not found');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch article');
        }

        const result = await response.json();
        const article = result.data;

        // Pre-populate form data
        setFormData({
          title: article.title || '',
          slug: article.slug || '',
          content: article.content || '',
          excerpt: article.excerpt || '',
          status: article.status || 'DRAFT',
          tags: article.tags?.map(tag => tag.name) || [],
          isFeatured: article.isFeatured || false,
          metaTitle: article.metaTitle || '',
          metaDescription: article.metaDescription || ''
        });

        setExistingCoverImage(article.coverImage || '');
        setPreview(article.coverImage || '');

      } catch (error) {
        console.error('Error fetching article:', error);
        toast.error('Failed to load article', {
          description: 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  // Update form data and handle auto-slug generation
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };

      // Auto-generate slug when title changes and auto-generate is enabled
      if (name === 'title' && autoGenerateSlug) {
        newData.slug = memoizedSlugify(value);
      }

      return newData;
    });
  }, [autoGenerateSlug, memoizedSlugify]);

  // Toggle auto-slug generation
  const handleAutoSlugToggle = useCallback((checked) => {
    setAutoGenerateSlug(checked);
    if (checked && formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: memoizedSlugify(formData.title)
      }));
    }
  }, [formData.title, memoizedSlugify]);

  const handleContentChange = useCallback((markdown) => {
    setFormData(prev => ({
      ...prev,
      content: markdown
    }));
  }, []);

  // Handle image selection and validation
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(0);

      // Validate file
      validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Store the file for upload
      setCoverImage(file);

      // Show success message
      toast.success('Image selected. It will be uploaded when you save the article.', {
        duration: 5000,
      });

    } catch (error) {
      console.error('Image validation error:', error);
      toast.error(error.message, {
        description: 'Please select a valid image file (JPG, PNG, or WebP) under 5MB.',
        duration: 10000,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setPreview(existingCoverImage || '');
      setCoverImage(null);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setCoverImage(null);
    setPreview(''); // Clear preview to show upload area
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast.info('Change image - click to select a new cover image');
  };

  // Handle upload progress
  const handleUploadProgress = (progress) => {
    setUploadProgress(progress);
  };



  // Handle form submission
  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Title is required', {
        description: 'Please enter a title for your article.',
      });
      titleRef.current?.focus();
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required', {
        description: 'Please add some content to your article.',
      });
      return;
    }

    // Validate slug if manually entered
    if (!formData.slug.trim()) {
      toast.error('URL slug is required', {
        description: 'Please enter a URL slug or enable auto-generation.',
      });
      return;
    }

    // Additional slug validation
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error('Invalid URL slug', {
        description: 'Slug can only contain lowercase letters, numbers, and hyphens.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let coverImageUrl = existingCoverImage;

      // Upload cover image if a new one was selected
      if (coverImage) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', coverImage);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || 'Failed to upload image');
          }

          const result = await uploadResponse.json();
          coverImageUrl = result.url;
        } catch (uploadError) {
          console.error('Error uploading cover image:', uploadError);
          throw new Error('Failed to upload cover image');
        } finally {
          setIsUploading(false);
        }
      }

      // Update article
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          status: formData.status,
          isFeatured: formData.isFeatured,
          metaTitle: formData.metaTitle || null,
          metaDescription: formData.metaDescription || null,
          coverImage: coverImageUrl || null,
          tags: formData.tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update article');
      }

      const article = await response.json();

      // Show success message with actions
      toast.success('Article updated successfully', {
        action: {
          label: 'View Article',
          onClick: () => {
            // Get current user's session to construct the URL
            fetch('/api/auth/session')
              .then(res => res.json())
              .then(session => {
                if (session?.user?.username) {
                  router.push(`/${session.user.username}/${article.data.slug}`);
                }
              });
          },
        },
      });

      // Redirect to articles list
      router.push('/dashboard/articles');
      router.refresh();

    } catch (error) {
      console.error('Error updating article:', error);

      toast.error('Failed to update article', {
        description: error.message || 'An unexpected error occurred. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(e),
        },
      });

    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Get user session with memoization
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch user session once on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await fetch('/api/auth/session');
        const session = await userResponse.json();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    fetchUser();
  }, []);

  // Check if slug is available (only for new slugs, not current slug)
  useEffect(() => {
    const checkSlug = async () => {
      if (!debouncedSlug || debouncedSlug.length < 3) {
        setSlugError('');
        return;
      }

      // Skip validation if slug hasn't changed from original
      if (formData.slug === debouncedSlug) {
        setSlugError('');
        return;
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(debouncedSlug)) {
        setSlugError('Invalid format. Use lowercase letters, numbers, and hyphens only.');
        return;
      }

      if (!currentUser?.username) {
        setSlugError('Please set up your username first');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(
          `/api/articles/check-slug?slug=${encodeURIComponent(debouncedSlug)}&username=${encodeURIComponent(currentUser.username)}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check slug availability');
        }

        // Update the error state based on the API response
        setSlugError(data.available ? '' : data.message || 'This URL is already in use');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error checking slug:', error);
          // Only show error if it's not a 400/404 error (user input related)
          if (error.message !== 'User not found' && !error.message.includes('required')) {
            setSlugError('Error checking URL availability. Please try again.');
          }
        }
      }
    };

    checkSlug();

    return () => {
      // Cleanup function to handle component unmount
    };
  }, [debouncedSlug, currentUser, formData.slug]);

  // senitize content
  const sanitizedContent = useMemo(() => 
    sanitizeMarkdown(formData.content),
    [formData.content]
  )
 
  
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Loading Article...</h1>
            <p className="text-muted-foreground">Please wait while we load your article</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (articleNotFound) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Article Not Found</h1>
            <p className="text-muted-foreground">The article you're looking for doesn't exist or you don't have permission to edit it.</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/articles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Articles
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Edit Article
          </h1>
          <p className="text-muted-foreground">
            Make changes to your article
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Sidebar */}
          <div className="grid col-span-full md:grid-flow-col grid-rows-1 md:grid-cols-2 gap-4">

            <div className="row-span-2 col-span-4">
              {/* Cover Image Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                  <CardDescription>
                    Update your article's cover image.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-full">
                      <div className="w-full">
                        {preview ? (
                          <div className="relative group">
                            <img
                              src={preview}
                              alt="Preview"
                              className="h-48 w-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={removeImage}
                                className="p-2 bg-black/70 text-white rounded-full hover:bg-black/90 transition-colors"
                                disabled={isSubmitting || isUploading}
                                title="Change image"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Upload progress */}
                            {isUploading && uploadProgress > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <div className="bg-background/90 rounded-md p-2">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                  </div>
                                  <Progress value={uploadProgress} className="h-1.5" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <label
                            htmlFor="cover-image"
                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50 transition-colors ${
                              (isSubmitting || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" />
                                  <p className="text-sm text-muted-foreground">Uploading...</p>
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    Click to upload a cover image
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Max 5MB • JPG, PNG, WebP
                                  </p>
                                </>
                              )}
                            </div>
                            <input
                              id="cover-image"
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept="image/jpeg, image/png, image/webp"
                              onChange={handleImageChange}
                              disabled={isSubmitting || isUploading}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {(coverImage || existingCoverImage) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Current:</span>
                        <span className="font-medium text-foreground truncate max-w-[180px]">
                          {coverImage ? coverImage.name : 'Existing image'}
                        </span>
                      </div>
                      {coverImage && (
                        <>
                          <div className="flex items-center justify-between">
                            <span>Size:</span>
                            <span>{(coverImage.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Type:</span>
                            <span className="uppercase">{coverImage.type.split('/')[1]}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-full md:col-span-1">
              {/* Publish Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="status">Status</Label>
                      <Badge
                        variant={formData.status === 'PUBLISHED' ? 'default' : 'outline'}
                        className="capitalize"
                      >
                        {formData.status.toLowerCase()}
                      </Badge>
                    </div>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="isFeatured">Featured</Label>
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, isFeatured: checked }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || isUploading || (slugError && formData.slug.length > 0)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {formData.status === 'DRAFT' ? 'Saving...' : 'Updating...'}
                        </>
                      ) : formData.status === 'DRAFT' ? (
                        'Save Draft'
                      ) : (
                        'Update Article'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="max-w-2xs col-span-full md:col-span-1">
              {/* Tags Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>
                    Update tags to help readers find your article.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="tags"
                        name="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                            e.preventDefault();
                            const newTag = tagInput.trim().replace(/,/g, '');
                            if (newTag && !formData.tags.includes(newTag)) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, newTag]
                              }));
                              setTagInput('');
                            } else if (tagInput.endsWith(',')) {
                              const newTag = tagInput.slice(0, -1).trim();
                              if (newTag && !formData.tags.includes(newTag)) {
                                setFormData(prev => ({
                                  ...prev,
                                  tags: [...prev.tags, newTag]
                                }));
                              }
                              setTagInput('');
                            }
                          } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
                            // Remove last tag on backspace when input is empty
                            e.preventDefault();
                            const newTags = [...formData.tags];
                            newTags.pop();
                            setFormData(prev => ({
                              ...prev,
                              tags: newTags
                            }));
                          }
                        }}
                        onBlur={(e) => {
                          if (tagInput.trim()) {
                            const newTag = tagInput.trim();
                            if (!formData.tags.includes(newTag)) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, newTag]
                              }));
                            }
                            setTagInput('');
                          }
                        }}
                        placeholder="Type and press Enter or comma to add tags"
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                      {tagInput && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setTagInput('')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Press Enter or comma to add a tag
                    </p>

                    {formData.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="font-normal group pr-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                tags: prev.tags.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            {tag}
                            <X className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
                <CardDescription>
                  Edit your article content here. You can use markdown for formatting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Title *</Label>
                    {formData.title.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formData.title.length}/100
                      </span>
                    )}
                  </div>
                  <Input
                    id="title"
                    name="title"
                    ref={titleRef}
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter article title"
                    maxLength={100}
                    required
                    disabled={isSubmitting}
                    className="text-base md:text-lg"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="slug">URL Slug *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                setAutoGenerateSlug(!autoGenerateSlug);
                              }}
                            >
                              {autoGenerateSlug ? 'Auto' : 'Manual'}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{autoGenerateSlug ? 'Using auto-generated slug' : 'Editing slug manually'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {formData.slug && (
                      <div className="flex items-center space-x-2">
                        {slugError ? (
                          <span className="text-xs text-destructive flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {slugError}
                          </span>
                        ) : formData.slug.length > 0 ? (
                          <span className="text-xs text-green-600 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            URL available
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      /{currentUser?.username || 'username'}/
                    </span>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="article-url-slug"
                      className={`rounded-l-none ${slugError ? 'border-destructive' : ''}`}
                      disabled={autoGenerateSlug || isSubmitting}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be the URL of your article. Only lowercase letters, numbers, and hyphens are allowed.
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Content *</Label>
                    <div className="text-xs text-muted-foreground">
                      {formData.content.length > 0 && (
                        <span>{formData.content.length} characters</span>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <MDXEditor
                      markdown={sanitizedContent}
                      onChange={handleContentChange}
                      placeholder="Write your article content here..."
                      contentEditableClassName="prose max-w-none dark:prose-invert p-4 min-h-[400px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Excerpt and Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Excerpt & Metadata</CardTitle>
                <CardDescription>
                  Update your article's excerpt and metadata to improve SEO and social sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    {formData.excerpt.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formData.excerpt.length}/300
                      </span>
                    )}
                  </div>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="A short summary of your article (optional)"
                    rows={3}
                    maxLength={300}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    A brief summary of your article that will appear in search results and social media.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="SEO title (defaults to article title)"
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 50-60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    {formData.metaDescription?.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formData.metaDescription.length}/160
                      </span>
                    )}
                  </div>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    placeholder="SEO description (defaults to excerpt)"
                    rows={2}
                    maxLength={160}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 120-160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom action bar - fixed to bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 flex justify-between items-center lg:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/articles')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(prev => ({ ...prev, status: 'DRAFT' }));
                handleSubmit({ preventDefault: () => {} });
              }}
              disabled={isSubmitting || isUploading || (slugError && formData.slug.length > 0)}
            >
              {isSubmitting && formData.status === 'DRAFT' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Draft
            </Button>

            <Button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, status: 'PUBLISHED' }));
                handleSubmit({ preventDefault: () => {} });
              }}
              disabled={isSubmitting || isUploading || (slugError && formData.slug.length > 0)}
            >
              {isSubmitting && formData.status === 'PUBLISHED' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Update Article
            </Button>
          </div>
        </div>

        {/* Add some padding at the bottom for the fixed mobile menu */}
        <div className="h-20 lg:hidden" />
      </form>
    </div>
  );
}
