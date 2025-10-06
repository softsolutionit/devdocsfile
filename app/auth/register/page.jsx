'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const username = watch('username', '');
  
  // Check username availability
  const checkUsername = async (username) => {
    if (!username || username.length < 3) return;
    
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check username');
      }
      
      return data.available;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };
  
  // Debounced username validation
  const validateUsername = async (value) => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    
    const isAvailable = await checkUsername(value);
    if (isAvailable === false) {
      return 'This username is already taken';
    }
    
    return true;
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed');
      }

      router.push('/auth/signin');
      toast.success('Your account has been created. Please sign in.');
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthRegister = async (provider) => {
    setIsLoading(true);
    try {
      await signIn(provider, {
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      setError('An error occurred during sign in');
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-6">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={()=> handleOAuthRegister('github')}
            >
              <Icons.gitHub className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={()=> handleOAuthRegister('google')}
            >
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                disabled={isLoading}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">devdocsfile.com/</span>
                </div>
                <Input
                  id="username"
                  className="pl-40"
                  placeholder="username"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...register('username', {
                    validate: validateUsername,
                  })}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
              {username && username.length >= 3 && !errors.username && (
                <p className="text-sm text-green-600">Username is available</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || Object.keys(errors).length > 0}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/auth/signin"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </p>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
