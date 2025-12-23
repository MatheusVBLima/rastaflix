import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="lg:grid lg:grid-cols-2">
      {/* Left Column - Content Skeleton */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          {/* Title */}
          <Skeleton className="h-10 w-48 mx-auto" />

          {/* Description */}
          <Skeleton className="h-7 w-full mx-auto" />

          {/* "Também conhecido como" */}
          <Skeleton className="h-7 w-56 mx-auto" />

          {/* Nicknames badges */}
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>

      {/* Right Column - Image Skeleton */}
      <div className="hidden bg-muted lg:flex">
        <Skeleton className="w-full h-[calc(100vh-5.2rem)]" />
      </div>
    </div>
  );
}
