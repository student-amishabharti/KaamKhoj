// Page badalte waqt turant kuch dikhe (khaali screen nahi)
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4" aria-busy="true" aria-label="Load ho raha hai">
      <div className="h-12 animate-pulse rounded-2xl bg-surface" />
      <div className="h-32 animate-pulse rounded-2xl bg-surface" />
      <div className="h-24 animate-pulse rounded-2xl bg-surface" />
      <div className="h-24 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
