import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">User not found</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        The user you're looking for doesn't exist or has been removed.
      </p>
      <div className="mt-10">
        <Button asChild>
          <Link href="/">
            Go back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
