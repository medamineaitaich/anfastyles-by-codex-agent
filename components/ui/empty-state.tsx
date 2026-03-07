export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card-surface flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <h3 className="display-font text-3xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}
