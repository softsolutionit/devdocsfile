'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Image as ImageIcon, Edit, X, Check, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

async function checkUsernameAvailability(username) {
  if (!username || username === '') return true;
  
  try {
    const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const isOAuthUser = session?.user?.provider !== 'credentials';
  
  const [originalData, setOriginalData] = useState({
    name: '',
    username: '',
    bio: '',
    email: ''
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      username: '',
      bio: '',
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (session?.user) {
      const userData = {
        name: session.user.name || '',
        email: session.user.email || '',
        username: session.user.username || '',
        bio: session.user.bio || '',
      };
      
      reset(userData);
      setOriginalData(userData);
      setSelectedImage(session.user.image || null);
    }
  }, [session, reset]);

  // Watch form values
  const currentUsername = watch('username');
  const currentValues = watch();
  
  // Check if there are any changes
  const hasChanges = isEditing && (
    currentValues.name !== originalData.name ||
    currentValues.username !== originalData.username ||
    currentValues.bio !== originalData.bio ||
    (fileInputRef.current?.files?.[0] || (isOAuthUser && !selectedImage))
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values when canceling edit
      reset(originalData);
      setSelectedImage(originalData.image || null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = async (data) => {
    if (!isEditing) return;
    
    if (data.username !== originalData.username && !usernameAvailable) {
      toast.error('Please choose an available username');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Only include fields that have changed
      if (data.username !== originalData.username) {
        formData.append('username', data.username);
      }
      
      if (data.bio !== originalData.bio) {
        formData.append('bio', data.bio);
      }
      
      // Handle profile picture changes
      if (isOAuthUser) {
        if (!selectedImage) {
          formData.append('removeImage', 'true');
        } else if (fileInputRef.current?.files?.[0]) {
          formData.append('image', fileInputRef.current.files[0]);
        }
      } else if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0]);
      }

      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update the session with new user data
      await update({
        ...session,
        user: {
          ...session.user,
          ...updatedUser,
        },
      });
      
      // Update original data with new values
      const newOriginalData = {
        name: updatedUser.name || originalData.name,
        username: updatedUser.username || originalData.username,
        bio: updatedUser.bio !== undefined ? updatedUser.bio : originalData.bio,
        email: originalData.email,
        image: updatedUser.image || originalData.image
      };
      
      setOriginalData(newOriginalData);
      setSelectedImage(updatedUser.image || selectedImage);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update your profile information' : 'View your profile information'}
          </p>
        </div>
        
        {!isEditing ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEditToggle}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditToggle}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit(onSubmit)}
              disabled={!hasChanges || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="space-y-2 text-center">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 mx-auto">
                        <AvatarImage 
                          src={selectedImage || session?.user?.image || null} 
                          alt={session?.user?.name || 'User'}
                        />
                        <AvatarFallback>
                          {session?.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="relative"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                          <ImageIcon className="mr-2 h-4 w-4" />
                          {isOAuthUser && selectedImage?.startsWith('http') ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                        {isOAuthUser && selectedImage?.startsWith('http') && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedImage(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            Remove Photo
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      {isEditing ? (
                        <div>
                      <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          {...register('name', { required: 'Name is required' })}
                          placeholder="Enter your name"
                          disabled={isSubmitting}
                      />
                      </div>
                      ) : (
                        <p className={cn(
                          "text-sm py-2 px-3 border rounded-md bg-muted/50",
                          !currentValues.name && "text-muted-foreground italic"
                        )}>
                          {currentValues.name || 'Not provided'}
                        </p>
                      )}
                    
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <Input
                          id="username"
                          {...register('username', {
                            required: 'Username is required',
                            pattern: {
                              value: /^[a-z0-9_]+$/,
                              message: 'Only lowercase letters, numbers, and underscores are allowed',
                            },
                            minLength: {
                              value: 3,
                              message: 'Username must be at least 3 characters',
                            },
                            maxLength: {
                              value: 30,
                              message: 'Username must be less than 30 characters',
                            },
                            validate: async (value) => {
                              if (value === session?.user?.username) return true;
                              const available = await checkUsernameAvailability(value);
                              return available || 'Username is already taken';
                            },
                          })}
                          placeholder="username"
                          disabled={isSubmitting}
                          onBlur={() => trigger('username')}
                        />
                        {isCheckingUsername && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {!isCheckingUsername && currentUsername && currentUsername !== session?.user?.username && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {usernameAvailable ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-destructive">✗</span>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.username ? (
                        <p className="text-sm text-destructive">{errors.username.message}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          This is your public username. Only lowercase letters, numbers, and underscores are allowed.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 text-sm py-2 px-3 border rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{currentValues.email || 'No email provided'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <>
                      <Textarea
                        id="bio"
                        {...register('bio')}
                        placeholder="Tell us a little bit about yourself"
                        className="min-h-[100px]"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        A short bio about yourself. This will be displayed on your profile.
                      </p>
                    </>
                  ) : (
                    <p className={cn(
                      "text-sm py-2 px-3 border rounded-md bg-muted/50 min-h-[100px]",
                      !currentValues.bio && "text-muted-foreground italic"
                    )}>
                      {currentValues.bio || 'No bio provided'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || isCheckingUsername}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Permanently delete your account and all associated data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
