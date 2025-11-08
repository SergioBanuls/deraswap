interface RouteCardSkeletonProps {
  showBadge?: boolean;
}

export function RouteCardSkeleton({ showBadge = false }: RouteCardSkeletonProps) {
  return (
    <div className="bg-neutral-800/50 rounded-2xl p-4 border border-transparent animate-pulse">
      {/* Badge Skeleton */}
      {showBadge && (
        <div className="w-24 h-6 bg-neutral-700/50 rounded-full mb-3"></div>
      )}
      
      {/* Token Icon and Output Amount Skeleton */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-700/50"></div>
          <div>
            <div className="w-32 h-8 bg-neutral-700/50 rounded mb-2"></div>
            <div className="flex items-center gap-1">
              <div className="w-16 h-4 bg-neutral-700/50 rounded"></div>
              <div className="w-1 h-1 bg-neutral-700/50 rounded-full"></div>
              <div className="w-12 h-4 bg-neutral-700/50 rounded"></div>
              <div className="w-1 h-1 bg-neutral-700/50 rounded-full"></div>
              <div className="w-20 h-4 bg-neutral-700/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Summary and Gas/Time Skeleton */}
      <div className="flex items-center justify-between">
        <div className="w-40 h-4 bg-neutral-700/50 rounded"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-4 bg-neutral-700/50 rounded"></div>
          <div className="w-8 h-4 bg-neutral-700/50 rounded"></div>
        </div>
      </div>
    </div>
  );
}

