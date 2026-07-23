export default function ProductLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Watch face skeleton */}
        <div className="lg:sticky lg:top-28">
          <div className="aspect-square surface-elevated flex items-center justify-center">
            <div className="w-1/2 aspect-square shimmer rounded-full" />
          </div>
        </div>
        {/* Details skeleton */}
        <div className="space-y-6">
          <div className="h-4 w-32 shimmer rounded" />
          <div className="h-12 w-3/4 shimmer rounded" />
          <div className="h-6 w-1/2 shimmer rounded" />
          <div className="h-24 w-full shimmer rounded" />
          <div className="h-32 w-full surface-elevated p-6">
            <div className="h-4 w-20 shimmer rounded mb-3" />
            <div className="h-8 w-32 shimmer rounded" />
          </div>
          <div className="h-12 w-full shimmer rounded" />
        </div>
      </div>
    </div>
  );
}
