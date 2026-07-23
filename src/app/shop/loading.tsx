/**
 * Shop loading skeleton — shimmer grid matching the product layout.
 */
export default function ShopLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16">
      <div className="grid lg:grid-cols-[280px_1fr] gap-12">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-3 w-20 shimmer rounded" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 w-full shimmer rounded" />
              ))}
            </div>
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="watch-card aspect-[4/5] p-5">
              <div className="h-3 w-16 shimmer rounded mb-2" />
              <div className="aspect-square shimmer rounded-full my-8 mx-auto w-1/2" />
              <div className="h-5 w-2/3 shimmer rounded mb-2" />
              <div className="h-3 w-1/2 shimmer rounded mb-4" />
              <div className="h-px bg-[var(--hairline)] my-4" />
              <div className="flex justify-between">
                <div className="h-3 w-20 shimmer rounded" />
                <div className="h-8 w-24 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
