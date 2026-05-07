import { Skeleton } from "./skeleton";

export const PortfolioCardSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="aspect-[4/5] w-full rounded-sm" />
    <div className="space-y-2">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const BlogCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 flex flex-col h-full">
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="p-8 space-y-4 flex flex-col flex-grow">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-auto pt-4">
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  </div>
);

export const MasonrySkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="masonry">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="masonry-item">
        <Skeleton 
          className="w-full rounded-sm mb-4" 
          style={{ 
            height: i % 2 === 0 ? '450px' : '350px',
            opacity: 1 - (i * 0.1)
          }} 
        />
      </div>
    ))}
  </div>
);
