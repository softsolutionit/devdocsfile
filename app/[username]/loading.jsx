import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-8">
        {/* Profile Header Skeleton */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          
          <div className="space-y-2 w-full">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-5 w-3/4 mx-auto" />
            
            <div className="flex items-center justify-center space-x-4 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Articles Section Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-5 w-full mb-3" />
                <Skeleton className="h-5 w-2/3 mb-4" />
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
