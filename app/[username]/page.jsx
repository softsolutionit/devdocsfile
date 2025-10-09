import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Link as LinkIcon, Twitter, Github } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }) {
    const userName = await params.username
  const user = await prisma.user.findUnique({
    where: { username: userName },
    select: { name: true, username: true, bio: true, image: true },
  });

  if (!user) {
    return {
      title: 'User Not Found',
    };
  }

  return {
    title: `${user.name} (@${user.username})`,
    description: user.bio || `Read articles by ${user.name}`,
    openGraph: {
      images: user.image ? [user.image] : [],
    },
  };
}

export default async function UserProfilePage({ params }) {
    const userName = await params.username;
  const user = await prisma.user.findUnique({
    where: { username: userName },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      createdAt: true,
      
    },
  });

  if (!user) {
    notFound();
  }

  // Get user's published articles
  const articles = await prisma.article.findMany({
    where: {
      authorUsername: user.username,
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Format join date
  const joinDate = format(new Date(user.createdAt), 'MMMM yyyy');

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.image || ''} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            
            {user.bio && (
              <p className="text-lg max-w-2xl">{user.bio}</p>
            )}
            
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>Joined {joinDate}</span>
              </div>
              
              {user.website && (
                <a 
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary transition-colors"
                >
                  <LinkIcon className="mr-1 h-4 w-4" />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              
              {user.twitter && (
                <a 
                  href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary transition-colors"
                >
                  <Twitter className="mr-1 h-4 w-4" />
                  <span>{user.twitter}</span>
                </a>
              )}
              
              {user.github && (
                <a 
                  href={`https://github.com/${user.github}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary transition-colors"
                >
                  <Github className="mr-1 h-4 w-4" />
                  <span>{user.github}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Articles</h2>
          
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles published yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {articles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">
                        <Link href={`/${user.username}/${article.slug}`} className="hover:underline">
                          {article.title}
                        </Link>
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(article.updatedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {article.excerpt && (
                      <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{article.viewCount || 0} views</span>
                      <span className="mx-2">•</span>
                      <Link 
                        href={`/${user.username}/${article.slug}#comments`}
                        className="hover:text-primary"
                      >
                        View comments
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
