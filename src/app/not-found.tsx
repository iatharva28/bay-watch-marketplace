import Link from "next/link";

/**
 * BAY 404 — Not Found
 *
 * On-brand 404 page. Calm, minimal, offers clear paths back.
 */
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="eyebrow-platinum mb-4">404</div>
        <h1 className="font-display text-6xl font-light mb-4">
          Not <span className="italic-serif text-[var(--platinum)]">found</span>
        </h1>
        <p className="body-lg mb-8">
          The page you're looking for doesn't exist, or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-bay btn-bay-solid">
            <span>Back to Maison</span>
          </Link>
          <Link href="/shop" className="btn-bay">
            <span>Browse Shop</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
