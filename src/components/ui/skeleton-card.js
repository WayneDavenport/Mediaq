const SkeletonCard = () => {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
            <div className="relative w-full aspect-[3/4] bg-muted">
                {/* Poster skeleton */}
                <div className="w-full h-full animate-pulse" />
            </div>

            <div className="p-6 space-y-4 animate-pulse">
                {/* Title skeleton */}
                <div className="h-6 bg-muted rounded-md w-3/4" />

                {/* Category & Status skeleton */}
                <div className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                </div>

                {/* Progress bar skeleton */}
                <div className="h-2 bg-muted rounded-full w-full" />

                {/* Additional info skeleton */}
                <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard; 