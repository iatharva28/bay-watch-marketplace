/**
 * BAY Root Loading State
 *
 * Shown while the app's initial JS bundle loads. Matches the
 * Glacier Noir aesthetic so there's no jarring transition.
 */
export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border border-[var(--hairline)] border-t-[var(--platinum)] animate-spin" />
        <div className="eyebrow">Loading</div>
      </div>
    </div>
  );
}
