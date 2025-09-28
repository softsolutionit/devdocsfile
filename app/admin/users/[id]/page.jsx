'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    website: '',
    twitter: '',
    github: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      setUser(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        bio: data.bio || '',
        website: data.website || '',
        twitter: data.twitter || '',
        github: data.github || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      
      // Show success message
      // You could use a toast notification here
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const updatedUser = await response.json();
      setUser(prev => ({
        ...prev,
        role: updatedUser.role
      }));
      
      alert('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error.message || 'Failed to update user role');
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      const updatedUser = await response.json();
      setUser(prev => ({
        ...prev,
        isActive: updatedUser.isActive
      }));
      
      alert(`User has been ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      setError(error.message || `Failed to ${action} user`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">User not found</h2>
        <p className="text-muted-foreground mt-2">The requested user could not be found.</p>
        <Button className="mt-4" onClick={() => router.push('/admin/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => router.push('/admin/users')}
          >
            <Icons.chevronLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
          <p className="text-muted-foreground">
            Manage user account and permissions
          </p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    bio: user.bio || '',
                    website: user.website || '',
                    twitter: user.twitter || '',
                    github: user.github || '',
                  });
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icons.save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Icons.edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Profile</CardDescription>
                <CardTitle className="text-2xl">
                  {user.name || 'No name'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="h-full w-full rounded-full"
                      />
                    ) : (
                      <Icons.user className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="capitalize">
                        {user.role.toLowerCase()}
                      </Badge>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {!isEditing && (
                  <div className="mt-4 space-y-2">
                    {user.bio && (
                      <p className="text-sm">{user.bio}</p>
                    )}
                    <div className="flex items-center space-x-4 pt-2">
                      {user.website && (
                        <a 
                          href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          <Icons.globe className="h-4 w-4 mr-1" />
                          Website
                        </a>
                      )}
                      {user.twitter && (
                        <a 
                          href={`https://twitter.com/${user.twitter.replace('@', '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:underline flex items-center"
                        >
                          <Icons.twitter className="h-4 w-4 mr-1" />
                          {user.twitter}
                        </a>
                      )}
                      {user.github && (
                        <a 
                          href={`https://github.com/${user.github.replace('@', '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-gray-700 hover:underline flex items-center"
                        >
                          <Icons.github className="h-4 w-4 mr-1" />
                          {user.github}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>
                  {isEditing ? 'Update user details' : 'View and manage user information'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="user@example.com"
                          disabled // Email should not be changed
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="A short bio about the user..."
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                            @
                          </span>
                          <Input
                            id="twitter"
                            name="twitter"
                            value={formData.twitter?.replace('@', '')}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                twitter: e.target.value.startsWith('@') ? e.target.value : `@${e.target.value}`
                              }));
                            }}
                            placeholder="username"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                            @
                          </span>
                          <Input
                            id="github"
                            name="github"
                            value={formData.github?.replace('@', '')}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                github: e.target.value.startsWith('@') ? e.target.value : `@${e.target.value}`
                              }));
                            }}
                            placeholder="username"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Account Information</h3>
                      <dl className="mt-2 space-y-2">
                        <div className="flex items-center justify-between py-2 border-b">
                          <dt className="text-sm text-muted-foreground">Status</dt>
                          <dd>
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <dt className="text-sm text-muted-foreground">Role</dt>
                          <dd className="flex items-center">
                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="capitalize">
                              {user.role.toLowerCase()}
                            </Badge>
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <dt className="text-sm text-muted-foreground">Email Verified</dt>
                          <dd className="text-sm">
                            {user.emailVerified ? (
                              <span className="text-green-600">
                                {format(new Date(user.emailVerified), 'MMM d, yyyy')}
                              </span>
                            ) : (
                              <span className="text-amber-600">Not verified</span>
                            )}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <dt className="text-sm text-muted-foreground">Member Since</dt>
                          <dd className="text-sm">
                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <dt className="text-sm text-muted-foreground">Last Updated</dt>
                          <dd className="text-sm">
                            {format(new Date(user.updatedAt), 'MMM d, yyyy')}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          value={user.role}
                          onValueChange={handleRoleChange}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Change Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MODERATOR">Moderator</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant={user.isActive ? 'destructive' : 'default'}
                          onClick={handleStatusToggle}
                        >
                          {user.isActive ? 'Deactivate User' : 'Activate User'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Implement reset password functionality
                            alert('Reset password functionality would be implemented here');
                          }}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions performed by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.articles && user.articles.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Recent Articles</h4>
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Title</th>
                            <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Created</th>
                            <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {user.articles.map((article) => (
                            <tr key={article.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <div className="font-medium">{article.title}</div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge 
                                  variant={
                                    article.status === 'PUBLISHED' ? 'default' : 
                                    article.status === 'DRAFT' ? 'outline' : 'secondary'
                                  }
                                  className="capitalize"
                                >
                                  {article.status.toLowerCase()}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {format(new Date(article.createdAt), 'MMM d, yyyy')}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/articles/${article.id}`)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Navigate to user's articles page
                          router.push(`/admin/users/${id}?tab=articles`);
                        }}
                      >
                        View all articles ({user._count?.articles || 0})
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recent activity found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Detailed activity log for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Activity log will be displayed here.</p>
                <p className="text-sm mt-2">This would show a detailed audit log of user actions.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Articles</CardTitle>
                  <CardDescription>
                    Articles created by {user.name || 'this user'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to create new article page
                    router.push('/articles/new');
                  }}
                >
                  <Icons.plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {user.articles && user.articles.length > 0 ? (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Title</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Created</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Updated</th>
                        <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.articles.map((article) => (
                        <tr key={article.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{article.title}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={
                                article.status === 'PUBLISHED' ? 'default' : 
                                article.status === 'DRAFT' ? 'outline' : 'secondary'
                              }
                              className="capitalize"
                            >
                              {article.status.toLowerCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {format(new Date(article.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {format(new Date(article.updatedAt || article.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/articles/${article.id}`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/articles/${article.id}/edit`)}
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icons.fileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No articles found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.name || 'This user'} hasn't created any articles yet.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => router.push('/articles/new')}
                    >
                      <Icons.plus className="h-4 w-4 mr-2" />
                      Create Article
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                These actions are irreversible. Proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Delete User Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this user and all associated data. This action cannot be undone.
                  </p>
                  <div>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (window.confirm('Are you absolutely sure you want to delete this user? This action cannot be undone.')) {
                          try {
                            const response = await fetch(`/api/admin/users/${id}`, {
                              method: 'DELETE',
                            });

                            if (response.ok) {
                              router.push('/admin/users');
                            } else {
                              const errorData = await response.json();
                              throw new Error(errorData.message || 'Failed to delete user');
                            }
                          } catch (error) {
                            console.error('Error deleting user:', error);
                            setError(error.message || 'Failed to delete user');
                          }
                        }
                      }}
                    >
                      Delete User
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <h4 className="text-sm font-medium text-amber-600">Export User Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all data associated with this user in a portable format.
                  </p>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Implement export functionality
                        alert('Export functionality would be implemented here');
                      }}
                    >
                      <Icons.download className="h-4 w-4 mr-2" />
                      Export User Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
