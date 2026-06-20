export default function DeliveryLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white/5">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-fresh border-t-transparent" />
      <p className="mt-4 text-sm text-muted">Loading your deliveries...</p>
    </div>
  );
}
